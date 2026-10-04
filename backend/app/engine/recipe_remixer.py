import re
from typing import List
from app.models.schemas import RecipeRemixRequest, RecipeRemixResponse, RemixedIngredient, UserProfile
from app.engine.allergen_knowledge_base import ALLERGEN_TAXONOMY, HEALTH_CATEGORIES
from app.engine.safety_analyzer import (
    active_categories, clean_token, find_trigger, substitute_for,
)
from app.models.schemas import AllergenSeverity

# Leading labels like "Step 3:", "Step 1 (Prep):", "3.", "3)" so steps are
# never numbered twice.
STEP_LABEL = re.compile(r"^\s*(?:step\s*\d+\s*(?:\([^)]*\))?\s*[:.)\-–]?\s*|\d+\s*[.):\-–]\s*)", re.IGNORECASE)


def strip_step_label(step: str) -> str:
    return STEP_LABEL.sub("", step, count=1).strip()


class RecipeRemixer:
    @staticmethod
    async def remix(req: RecipeRemixRequest) -> RecipeRemixResponse:
        """
        Rework a recipe for the friend's profile: swap only the ingredients that
        conflict with their allergies, conditions, or goals, and keep the rest.
        """
        profile = req.profile or UserProfile()
        active = active_categories(profile)
        if not active:
            # No profile conditions: fall back to the common allergens.
            active = {k: None for k in ALLERGEN_TAXONOMY if k not in HEALTH_CATEGORIES}

        remixed_ingredients: List[RemixedIngredient] = []
        used_categories: List[str] = []

        for ing in req.original_ingredients:
            norm = clean_token(ing)
            found_sub = None
            reasons = []
            for cat, item in active.items():
                intolerance = bool(item and item.severity == AllergenSeverity.INTOLERANCE)
                term, _ = find_trigger(norm, cat, intolerance_only=intolerance)
                if term:
                    reasons.append(ALLERGEN_TAXONOMY[cat]["canonical_name"])
                    if cat not in used_categories:
                        used_categories.append(cat)
                    if not found_sub:
                        found_sub = substitute_for(cat, term)

            if found_sub:
                remixed_ingredients.append(RemixedIngredient(
                    original=ing,
                    substitute=found_sub,
                    amount="Same amount, unless the swap says otherwise",
                    notes=f"Swapped for {profile.name}: {', '.join(reasons)}.",
                ))
            else:
                remixed_ingredients.append(RemixedIngredient(
                    original=ing,
                    substitute=ing,
                    amount="As in the original recipe",
                    notes=f"Fine for {profile.name} as it is.",
                ))

        swapped = [i for i in remixed_ingredients if i.original != i.substitute]

        if req.original_instructions:
            instructions = []
            for step in req.original_instructions:
                mod_step = strip_step_label(step)
                for item in swapped:
                    orig_word = clean_token(item.original).split()[-1] if clean_token(item.original) else ""
                    if len(orig_word) > 3 and orig_word in mod_step.lower():
                        pattern = re.compile(rf"\b{re.escape(orig_word)}\b", re.IGNORECASE)
                        mod_step = pattern.sub(f"{item.substitute} (swap)", mod_step)
                if mod_step:
                    instructions.append(mod_step)
        else:
            swap_names = ", ".join(i.substitute for i in swapped[:3])
            instructions = [
                f"Prep: get your swaps ready{f' ({swap_names})' if swap_names else ''} and chop everything before you start cooking.",
                "Cook: use 1-2 teaspoons of oil and a non-stick pan; roast, grill, or saute instead of deep-frying.",
                "Season: build flavour with cumin, ginger, garlic, fresh herbs, and a squeeze of lemon rather than cream or extra salt.",
                "Serve: plate a balanced portion with half the plate vegetables, and add a fresh salad on the side.",
            ]

        kitchen_rules: List[str] = []
        for cat in used_categories or list(active)[:2]:
            for rule in ALLERGEN_TAXONOMY[cat].get("cross_contamination_vectors", [])[:2]:
                if rule not in kitchen_rules:
                    kitchen_rules.append(rule)
        if not kitchen_rules:
            kitchen_rules = ["Wash boards and utensils between raw and cooked food."]

        if swapped:
            flavor_notes = (
                f"{len(swapped)} ingredient{'s' if len(swapped) != 1 else ''} swapped for {profile.name}. "
                "Keep the same spices and cooking order as the original so the dish still tastes familiar; "
                "taste and adjust salt and lemon at the end."
            )
        else:
            flavor_notes = f"Nothing needed swapping. This recipe already suits {profile.name}."


        return RecipeRemixResponse(
            remixed_title=f"{req.title} ({profile.name}-friendly)",
            description=f"A version of {req.title} adjusted for {profile.name}'s needs.",
            prep_time="20 mins",
            cook_time="25 mins",
            servings=req.servings,
            safe_ingredients=remixed_ingredients,
            instructions=instructions,
            cross_contamination_rules=kitchen_rules,
            flavor_preservation_notes=flavor_notes,
            ai_engine="Rule-based recipe engine",
        )
