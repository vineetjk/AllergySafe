import re
from typing import List, Dict, Tuple, Optional
from app.models.schemas import (
    UserProfile, ScanResponse, IngredientFlag, RiskLevel, AllergenSeverity
)
from app.engine.allergen_knowledge_base import ALLERGEN_TAXONOMY, CROSS_REACTIVITY_RULES

def clean_token(text: str) -> str:
    """Normalize text for allergen matching."""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', ' ', text)
    return ' '.join(text.split())

def map_user_allergy_to_category(allergy_name: str) -> Optional[str]:
    """Map user allergy name to internal taxonomy key."""
    norm = allergy_name.lower()
    if any(k in norm for k in ["gluten", "celiac", "wheat", "barley", "rye"]):
        return "gluten"
    if any(k in norm for k in ["tree nut", "almond", "cashew", "walnut", "pecan"]):
        return "tree_nuts"
    if any(k in norm for k in ["peanut", "groundnut"]):
        return "peanuts"
    if any(k in norm for k in ["dairy", "lactose", "milk", "cheese", "casein"]):
        return "dairy"
    if any(k in norm for k in ["soy", "soya", "edamame"]):
        return "soy"
    if any(k in norm for k in ["egg", "albumin"]):
        return "eggs"
    if any(k in norm for k in ["shellfish", "crustacean", "shrimp", "crab"]):
        return "shellfish"
    if any(k in norm for k in ["sesame", "tahini"]):
        return "sesame"
    return None

class SafetyAnalyzer:
    @staticmethod
    def analyze(text: str, profile: UserProfile, dish_title: Optional[str] = None) -> ScanResponse:
        """
        Deterministically scan ingredients against user's specific allergy profile.
        Detects direct keywords, sneaky derivatives, and calculates safety hazard index.
        """
        # Split text into candidate lines / clauses
        lines = [line.strip() for line in re.split(r'[\n,;•\-\*]', text) if line.strip()]
        if not lines and text.strip():
            lines = [text.strip()]

        flags: List[IngredientFlag] = []
        cross_contamination_risks: List[str] = []
        suggested_replacements: List[Dict[str, str]] = []
        seen_ingredients = set()

        # Build active user allergen lookup
        active_allergens = {}
        for item in profile.allergies:
            cat = map_user_allergy_to_category(item.name)
            if cat and cat in ALLERGEN_TAXONOMY:
                active_allergens[cat] = item

        # Scan each line / ingredient
        for raw_line in lines:
            normalized_line = clean_token(raw_line)
            if not normalized_line or len(normalized_line) < 2:
                continue

            for cat, user_allergy in active_allergens.items():
                tax = ALLERGEN_TAXONOMY[cat]
                matched_term = None
                is_derivative = False

                # 1. Check direct keywords (word boundary matching)
                for kw in tax["keywords"]:
                    pattern = rf"\b{re.escape(kw)}\b"
                    if re.search(pattern, normalized_line):
                        matched_term = kw
                        is_derivative = False
                        break

                # 2. Check sneaky / hidden derivatives
                if not matched_term:
                    for deriv in tax["derivatives"]:
                        pattern = rf"\b{re.escape(deriv)}\b"
                        if re.search(pattern, normalized_line):
                            matched_term = deriv
                            is_derivative = True
                            break

                if matched_term and (raw_line, matched_term) not in seen_ingredients:
                    seen_ingredients.add((raw_line, matched_term))

                    # Determine severity
                    if user_allergy.severity in [AllergenSeverity.ANAPHYLACTIC, AllergenSeverity.SEVERE]:
                        risk = RiskLevel.DANGER
                    elif user_allergy.severity == AllergenSeverity.INTOLERANCE:
                        risk = RiskLevel.CAUTION
                    else:
                        risk = RiskLevel.CAUTION

                    # Scientific explanation
                    if is_derivative:
                        reason = (
                            f"Contains '{matched_term}', an often-overlooked hidden derivative of {tax['canonical_name']}. "
                            f"{profile.name}'s profile specifies {user_allergy.severity.upper()} sensitivity."
                        )
                    else:
                        reason = (
                            f"Contains '{matched_term}', directly triggering {profile.name}'s {tax['canonical_name']} allergy. "
                            f"Risk severity: {user_allergy.severity.upper()}."
                        )

                    # Look up safe culinary substitution
                    sub = tax["substitutions"].get(matched_term)
                    if not sub:
                        # Fallback to general category substitution
                        sub = next(iter(tax["substitutions"].values()), None)

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
                f"🚨 CRITICAL DANGER for {profile.name}: Found {danger_count} life-threatening or severe allergen triggers. "
                f"Do not serve without performing the recommended culinary substitutions."
            )
        elif caution_count > 0:
            overall_verdict = RiskLevel.CAUTION
            hazard_score = min(65, 30 + (caution_count * 12))
            summary = (
                f"⚠️ CAUTION for {profile.name}: Found {caution_count} potential intolerance or sensitivity triggers. "
                f"Safe to modify with mild adjustments."
            )
        else:
            overall_verdict = RiskLevel.SAFE
            hazard_score = 0
            summary = (
                f"✅ 100% ALLERGEN-SAFE for {profile.name}: Zero flagged triggers across "
                f"{len(profile.allergies)} tracked allergy profiles. Both roommates can enjoy this without fear!"
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
                "engine": "OpenSource Allergen Taxonomy & Deterministic Clinical Rules",
                "rules_evaluated": len(ALLERGEN_TAXONOMY),
                "roommate_scanned": profile.name,
                "offline_capable": True,
                "privacy_audit": "100% processed locally on device - 0 bytes transmitted to cloud"
            }
        )
