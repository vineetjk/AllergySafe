"""
Conversational "Can she eat this?" assistant.

Understands questions like "Can Prithvi eat paneer butter masala?", meal-idea
requests ("what can she have for breakfast?"), and follow-up ingredient lists.
Answers are built from the same rule-based safety analysis as the scanner, so
they are consistent and never invented. For dishes the food library doesn't know,
a local open model (Gemma 2 via Ollama) may suggest the typical ingredients; the
rules still decide the verdict.
"""
import random
import re
from typing import List, Optional

from app.engine.allergen_knowledge_base import ALLERGEN_TAXONOMY, HEALTH_CATEGORIES
from app.engine.food_library import MEALS, dish_ingredients, find_dish
from app.engine.llm_provider import open_llm
from app.engine.safety_analyzer import SafetyAnalyzer, active_categories, map_user_allergy_to_category
from app.models.schemas import (
    AskContext, AskRequest, AskResponse, AskSuggestion, AskSwap, RiskLevel, UserProfile,
)

GREETING = re.compile(r"^\s*(hi|hello|hey|hii+|namaste|good (morning|evening|afternoon)|help)\b[\s!.?]*$", re.I)
SUGGEST = re.compile(
    r"\b(suggest|recommend|ideas?|options?|what (else )?(can|should|could|to)\b.*\b(eat|have|cook|make|order)\b"
    r"|what to (eat|cook|make|order)|meal plan|healthy (food|meal|snack|dinner|lunch|breakfast)s?)\b",
    re.I,
)
MEAL_TYPES = {
    "breakfast": ["breakfast", "morning", "nashta"],
    "lunch": ["lunch", "afternoon"],
    "dinner": ["dinner", "supper", "tonight", "night"],
    "snack": ["snack", "evening", "munch", "hungry", "craving"],
}
# Pulls the food out of "can she eat X?", "is X ok for her", etc.
DISH_PATTERNS = [
    re.compile(r"\b(?:eat|have|try|order|drink|take)\s+(?:a |an |the |some |any )?(.+?)(?:\s+(?:tonight|today|now|for \w+))?\s*[?.!]*$", re.I),
    re.compile(r"^\s*(?:is|are)\s+(.+?)\s+(?:ok|okay|safe|fine|good|healthy|allowed)\b", re.I),
    re.compile(r"^\s*(?:what about|how about)\s+(.+?)\s*[?.!]*$", re.I),
]

CONCERN_PHRASES = {
    "dairy": "has lactose",
    "gut_sensitive": "can upset a sensitive gut",
    "thyroid": "is best limited with high TSH",
    "weight_goal": "is heavy on calories for the weight-loss goal",
}


def _category_key(canonical_name: str) -> Optional[str]:
    for key, tax in ALLERGEN_TAXONOMY.items():
        if tax["canonical_name"] == canonical_name:
            return key
    return None


def _clean_ingredient(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip(" .")


def _meal_type(message: str) -> Optional[str]:
    lower = message.lower()
    for meal_type, words in MEAL_TYPES.items():
        if any(re.search(rf"\b{w}\b", lower) for w in words):
            return meal_type
    return None


def _extract_dish_phrase(message: str) -> Optional[str]:
    for pattern in DISH_PATTERNS:
        m = pattern.search(message.strip())
        if m:
            phrase = m.group(1).strip(" ?.!")
            phrase = re.sub(r"\b(for|by)\s+(her|him|them|prithvi|my friend)\b.*$", "", phrase, flags=re.I).strip()
            if 1 <= len(phrase) <= 80:
                return phrase
    return None


def _looks_like_ingredient_list(message: str) -> bool:
    return "," in message or "\n" in message or len(message.split()) <= 6


def suggest_meals(profile: UserProfile, meal_type: Optional[str], count: int = 4) -> List[AskSuggestion]:
    pool = [m for m in MEALS if meal_type is None or meal_type in m["types"]]
    safe, ok = [], []
    for meal in pool:
        verdict = SafetyAnalyzer.analyze("\n".join(meal["ingredients"]), profile).overall_verdict
        if verdict == RiskLevel.SAFE:
            safe.append(meal)
        elif verdict == RiskLevel.CAUTION:
            ok.append(meal)
    random.shuffle(safe)
    picks = (safe + ok)[:count]
    return [AskSuggestion(title=m["title"], why=m["why"]) for m in picks]


class FoodAssistant:
    @staticmethod
    async def answer_with_open_model(req: AskRequest, profile: UserProfile) -> AskResponse:
        """Like answer(), but asks the local open model about dishes the library doesn't know."""
        response = FoodAssistant.answer(req, profile)
        dish = response.context.pending_dish
        if not dish or response.verdict is not None:
            return response

        ingredients = await open_llm.suggest_ingredients(dish)
        if not ingredients:
            return response

        model = await open_llm.resolve_active_model()
        guessed = FoodAssistant._analyse(profile, dish, ingredients, assumed=True)
        guessed.reply = guessed.reply.replace(
            " This is based on a typical recipe; tell me if yours is different.",
            f" I didn't have {dish} in my recipe list, so {model} (running locally) guessed what's in it."
            " If that's wrong, tell me the real ingredients and I'll check again.",
        )
        guessed.ingredients_source = model
        # Keep the follow-up open so a corrected ingredient list is checked against this dish.
        guessed.context = AskContext(pending_dish=dish)
        return guessed

    @staticmethod
    def answer(req: AskRequest, profile: UserProfile) -> AskResponse:
        message = req.message.strip()
        context = req.context or AskContext()
        name = profile.name

        if GREETING.match(message):
            return AskResponse(
                reply=(
                    f"Hi! Ask me whether {name} can eat something, like \"Can {name} eat "
                    f"paneer butter masala?\", or ask for ideas, like \"What can {name} have for dinner?\""
                ),
            )

        dish = find_dish(message)
        wants_ideas = bool(SUGGEST.search(message)) and dish is None

        # Follow-up: the user is answering "what's in it?" with a list.
        is_list = "," in message or "\n" in message
        if context.pending_dish and not wants_ideas and (is_list or (not dish and _looks_like_ingredient_list(message))):
            return FoodAssistant._analyse(profile, context.pending_dish, [message], assumed=False)

        if dish:
            ingredients = dish_ingredients(dish)
            extra = re.search(r"\bwith\s+(.+?)\s*[?.!]*$", message, re.I)
            if extra:
                ingredients += [
                    _clean_ingredient(part)
                    for part in re.split(r",|\band\b|&", extra.group(1))
                    if part.strip()
                ]
            return FoodAssistant._analyse(profile, dish, ingredients, assumed=True)

        if wants_ideas:
            meal_type = _meal_type(message)
            suggestions = suggest_meals(profile, meal_type)
            label = f"{meal_type} " if meal_type else ""
            return AskResponse(
                reply=f"Here are some {label}ideas that suit {name}'s profile.",
                suggestions=suggestions,
                tips=FoodAssistant._general_tips(profile),
            )

        # Free text that mentions ingredients directly ("pasta with cream and cheese")
        phrase = _extract_dish_phrase(message)
        scan = SafetyAnalyzer.analyze(phrase or message, profile)
        if scan.flags:
            return FoodAssistant._from_scan(profile, phrase or "that", scan, [], assumed=False)

        if phrase:
            return AskResponse(
                reply=(
                    f"I don't know what usually goes into {phrase}. "
                    f"Tell me the main ingredients, for example \"rice, curd, onion, oil\", and I'll check it for {name}."
                ),
                dish=phrase,
                context=AskContext(pending_dish=phrase),
            )

        return AskResponse(
            reply=(
                f"I can check a dish or ingredients for {name}, or suggest meals. "
                f"Try \"Can {name} eat rajma chawal?\" or \"Suggest a healthy snack for {name}\"."
            ),
        )

    @staticmethod
    def _analyse(profile: UserProfile, dish: str, ingredients: List[str], assumed: bool) -> AskResponse:
        scan = SafetyAnalyzer.analyze("\n".join(ingredients), profile, dish)
        return FoodAssistant._from_scan(profile, dish, scan, ingredients if assumed else [], assumed)

    @staticmethod
    def _from_scan(profile: UserProfile, dish: str, scan, assumed_ingredients: List[str], assumed: bool) -> AskResponse:
        name = profile.name
        concerns: List[str] = []
        swaps: List[AskSwap] = []
        flagged_categories = []
        seen_swaps = set()

        by_ingredient: dict = {}
        for flag in scan.flags:
            key = _category_key(flag.matched_allergen)
            if key and key not in flagged_categories:
                flagged_categories.append(key)
            ingredient = _clean_ingredient(flag.ingredient_name)
            phrase = CONCERN_PHRASES.get(key or "", f"contains {flag.matched_allergen.lower()}")
            by_ingredient.setdefault(ingredient, [])
            if phrase not in by_ingredient[ingredient]:
                by_ingredient[ingredient].append(phrase)
            # One swap per ingredient: the first (most specific) one wins.
            if flag.safe_substitute and ingredient not in seen_swaps:
                seen_swaps.add(ingredient)
                swaps.append(AskSwap(ingredient=ingredient, swap=flag.safe_substitute, reason=flag.matched_allergen))
        concerns = [f"{ing[:1].upper()}{ing[1:]} {' and '.join(phrases)}." for ing, phrases in by_ingredient.items()]

        dish_label = dish if dish != "that" else "that"
        if scan.overall_verdict == RiskLevel.SAFE:
            reply = f"Yes, {name} can have {dish_label}. Nothing in it clashes with {name}'s profile."
        elif scan.overall_verdict == RiskLevel.CAUTION:
            reply = (
                f"{name} can have {dish_label} occasionally, but it needs a few changes. "
                f"Watch out for {FoodAssistant._join_categories(flagged_categories)}."
            )
        else:
            reply = f"No, {dish_label} is not safe for {name} as it is. It has a severe allergen in it."

        if swaps:
            reply += f" The easiest fix: {swaps[0].swap.rstrip('.')} instead of {swaps[0].ingredient.lower()}."
        if assumed and assumed_ingredients:
            reply += " This is based on a typical recipe; tell me if yours is different."

        tips: List[str] = []
        for key in flagged_categories:
            if key in HEALTH_CATEGORIES:
                tips.extend(ALLERGEN_TAXONOMY[key]["cross_contamination_vectors"][:1])
        if "thyroid" in flagged_categories:
            tips.append(ALLERGEN_TAXONOMY["thyroid"]["cross_contamination_vectors"][1])

        suggestions: List[AskSuggestion] = []
        if scan.overall_verdict == RiskLevel.DANGER or len(concerns) >= 3:
            suggestions = suggest_meals(profile, None, count=2)

        return AskResponse(
            reply=reply,
            verdict=scan.overall_verdict,
            dish=dish_label,
            assumed_ingredients=assumed_ingredients,
            concerns=concerns[:6],
            swaps=swaps[:4],
            suggestions=suggestions,
            tips=tips[:3],
        )

    @staticmethod
    def _join_categories(keys: List[str]) -> str:
        labels = {
            "dairy": "lactose",
            "gut_sensitive": "things that upset the gut",
            "thyroid": "soy or millet for the thyroid",
            "weight_goal": "extra calories",
        }
        names = [labels.get(k, ALLERGEN_TAXONOMY[k]["canonical_name"].lower()) for k in keys] or ["a few ingredients"]
        if len(names) == 1:
            return names[0]
        return ", ".join(names[:-1]) + " and " + names[-1]

    @staticmethod
    def _general_tips(profile: UserProfile) -> List[str]:
        tips = []
        for key in active_categories(profile):
            if key in HEALTH_CATEGORIES:
                tips.append(ALLERGEN_TAXONOMY[key]["cross_contamination_vectors"][0])
        return tips[:3]
