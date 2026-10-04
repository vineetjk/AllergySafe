import re
from typing import List, Dict, Tuple, Optional
from app.models.schemas import (
    UserProfile, ScanResponse, IngredientFlag, RiskLevel, AllergenSeverity, AllergenItem
)
from app.engine.allergen_knowledge_base import ALLERGEN_TAXONOMY, CROSS_REACTIVITY_RULES, HEALTH_CATEGORIES

def clean_token(text: str) -> str:
    """Normalize text for allergen matching."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', ' ', text)
    return ' '.join(text.split())

def map_user_allergy_to_category(allergy_name: str) -> Optional[str]:
    """Map user allergy / condition name to internal taxonomy key."""
    norm = allergy_name.lower()
    if any(k in norm for k in ["thyroid", "tsh", "hypothyroid", "hashimoto"]):
        return "thyroid"
    if any(k in norm for k in ["gut", "ibs", "digest", "stomach", "acidity", "bloat"]):
        return "gut_sensitive"
    if any(k in norm for k in ["weight", "calorie", "diet goal", "fat loss"]):
        return "weight_goal"
    if any(k in norm for k in ["gluten", "celiac", "coeliac", "wheat", "barley", "rye"]):
        return "gluten"
    if any(k in norm for k in ["tree nut", "almond", "cashew", "walnut", "pecan"]):
        return "tree_nuts"
    if any(k in norm for k in ["peanut", "groundnut"]):
        return "peanuts"
    if any(k in norm for k in ["dairy", "lactose", "lactos", "milk", "cheese", "casein"]):
        return "dairy"
    if any(k in norm for k in ["soy", "soya", "edamame"]):
        return "soy"
    if any(k in norm for k in ["egg", "albumin"]):
        return "eggs"
    if any(k in norm for k in ["shellfish", "crustacean", "shrimp", "crab", "prawn"]):
        return "shellfish"
    if any(k in norm for k in ["sesame", "tahini", "til"]):
        return "sesame"
    return None


def split_ingredients(text: str) -> List[str]:
    """Split recipe text into ingredient lines. Hyphens inside words
    (deep-fried, air-fried) are kept; only list bullets are split."""
    parts = re.split(r"[\n,;•\*]|(?:^|\s)-\s", text, flags=re.MULTILINE)
    return [p.strip() for p in parts if p and p.strip()]


def find_trigger(normalized_line: str, category: str, intolerance_only: bool = False) -> Tuple[Optional[str], bool]:
    """Return (matched_term, is_derivative) for a category, or (None, False)."""
    tax = ALLERGEN_TAXONOMY[category]
    line = f" {normalized_line} "
    for phrase in tax.get("exclusions", []):
        line = re.sub(rf"\b{re.escape(phrase)}\b", " ", line)
    skip = set(tax.get("low_lactose", [])) if intolerance_only else set()

    # Prefer the longest match so "heavy cream" wins over "cream".
    for terms, is_deriv in ((tax["keywords"], False), (tax["derivatives"], True)):
        for term in sorted(terms, key=len, reverse=True):
            if term in skip:
                continue
            if re.search(rf"\b{re.escape(term)}\b", line):
                return term, is_deriv
    return None, False


def substitute_for(category: str, term: str) -> Optional[str]:
    tax = ALLERGEN_TAXONOMY[category]
    return (
        tax["substitutions"].get(term)
        or tax.get("default_advice")
        or next(iter(tax["substitutions"].values()), None)
    )


def active_categories(profile: UserProfile) -> Dict[str, "AllergenItem"]:
    active = {}
    for item in profile.allergies:
        cat = map_user_allergy_to_category(item.name)
        if cat and cat in ALLERGEN_TAXONOMY and cat not in active:
            active[cat] = item
    return active


class SafetyAnalyzer:
    @staticmethod
    def analyze(text: str, profile: UserProfile, dish_title: Optional[str] = None) -> ScanResponse:
        """
        Deterministically scan ingredients against user's specific allergy profile.
        Detects direct keywords, sneaky derivatives, and calculates safety hazard index.
        """
        # Split text into candidate lines / clauses
        lines = split_ingredients(text)
        if not lines and text.strip():
            lines = [text.strip()]

        flags: List[IngredientFlag] = []
        cross_contamination_risks: List[str] = []
        suggested_replacements: List[Dict[str, str]] = []
        seen_ingredients = set()

        active_allergens = active_categories(profile)

        # Scan each line / ingredient
        for raw_line in lines:
            normalized_line = clean_token(raw_line)
            if not normalized_line or len(normalized_line) < 2:
                continue

            for cat, user_allergy in active_allergens.items():
                tax = ALLERGEN_TAXONOMY[cat]
                matched_term, is_derivative = find_trigger(
                    normalized_line, cat,
                    intolerance_only=user_allergy.severity == AllergenSeverity.INTOLERANCE,
                )

                if matched_term and (raw_line, cat) not in seen_ingredients:
                    seen_ingredients.add((raw_line, cat))

                    # Determine severity (health conditions and goals are never "danger")
                    if cat in HEALTH_CATEGORIES:
                        risk = RiskLevel.CAUTION
                    elif user_allergy.severity in [AllergenSeverity.ANAPHYLACTIC, AllergenSeverity.SEVERE]:
                        risk = RiskLevel.DANGER
                    elif user_allergy.severity == AllergenSeverity.INTOLERANCE:
                        risk = RiskLevel.CAUTION
                    else:
                        risk = RiskLevel.CAUTION

                    # Explanation
                    if cat in HEALTH_CATEGORIES:
                        reason = (
                            f"'{matched_term}' is something to limit for {profile.name}'s "
                            f"{tax['canonical_name'].lower()}."
                        )
                    elif is_derivative:
                        reason = (
                            f"Contains '{matched_term}', an often-overlooked source of {tax['canonical_name']}. "
                            f"{profile.name}'s profile lists this as {user_allergy.severity.value}."
                        )
                    else:
                        reason = (
                            f"Contains '{matched_term}', which affects {profile.name}'s {tax['canonical_name']} "
                            f"({user_allergy.severity.value})."
                        )

                    sub = substitute_for(cat, matched_term)

                    if sub:
                        suggested_replacements.append({
                            "unsafe_ingredient": raw_line,
                            "detected_trigger": matched_term,
                            "recommended_safe_swap": sub,
                            "allergen_group": tax["canonical_name"]
                        })

                    flags.append(IngredientFlag(
                        ingredient_name=raw_line,
                        matched_allergen=tax["canonical_name"],
                        risk_level=risk,
                        scientific_reason=reason,
                        is_hidden_derivative=is_derivative,
                        safe_substitute=sub
                    ))

                    # Add category cross contamination vectors
                    for vector in tax.get("cross_contamination_vectors", [])[:2]:
                        if vector not in cross_contamination_risks:
                            cross_contamination_risks.append(vector)

        # Calculate Overall Verdict and Hazard Score
        danger_count = sum(1 for f in flags if f.risk_level == RiskLevel.DANGER)
        caution_count = sum(1 for f in flags if f.risk_level == RiskLevel.CAUTION)

        if danger_count > 0:
            overall_verdict = RiskLevel.DANGER
            hazard_score = min(100, 70 + (danger_count * 10))
            summary = (
                f"Found {danger_count} severe allergen trigger{'s' if danger_count != 1 else ''}. "
                f"Don't serve it without the swaps below."
            )
        elif caution_count > 0:
            overall_verdict = RiskLevel.CAUTION
            hazard_score = min(65, 30 + (caution_count * 12))
            groups = sorted({f.matched_allergen for f in flags})
            summary = (
                f"{caution_count} ingredient{'s' if caution_count != 1 else ''} to limit or swap "
                f"({', '.join(groups)}). The suggested swaps make it a better fit."
            )
        else:
            overall_verdict = RiskLevel.SAFE
            hazard_score = 0
            summary = (
                f"Nothing here conflicts with the {len(active_allergens)} allergies and "
                f"health needs in {profile.name}'s profile."
                if active_allergens else
                f"No conflicts found. {profile.name}'s profile has no allergies or conditions set yet."
            )

        # Cross reactivity notes
        for rule in CROSS_REACTIVITY_RULES:
            if rule["allergen"] in active_allergens:
                if rule["warning"] not in cross_contamination_risks:
                    cross_contamination_risks.append(rule["warning"])

        return ScanResponse(
            overall_verdict=overall_verdict,
            hazard_score=hazard_score,
            dish_title=dish_title,
            summary=summary,
            total_ingredients_audited=max(len(lines), 1),
            flags=flags,
            cross_contamination_risks=cross_contamination_risks,
            suggested_replacements=suggested_replacements,
            ai_trace={
                "engine": "Open-source rule-based food knowledge base",
                "rules_evaluated": len(active_allergens),
                "roommate_scanned": profile.name,
                "offline_capable": True,
                "privacy_audit": "Analysed by this app's own server; no third-party AI service is used for scanning."
            }
        )
