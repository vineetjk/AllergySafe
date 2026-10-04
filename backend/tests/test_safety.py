import asyncio

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.models.schemas import (
    UserProfile, AllergenItem, AllergenSeverity, RiskLevel,
    RecipeRemixRequest, MealPlanRequest, AskRequest, AskContext,
)
from app.engine.safety_analyzer import SafetyAnalyzer
from app.engine.recipe_remixer import RecipeRemixer, strip_step_label
from app.engine.meal_planner import MealPlanner
from app.engine.assistant import FoodAssistant
from app.engine.voice_service import VoiceService
from app.engine import assistant as assistant_module
from app.engine.llm_provider import parse_ingredient_json


@pytest.fixture
def maya_profile():
    return UserProfile(
        name="Maya",
        allergies=[
            AllergenItem(name="Gluten / Celiac", severity=AllergenSeverity.ANAPHYLACTIC),
            AllergenItem(name="Tree Nuts", severity=AllergenSeverity.ANAPHYLACTIC),
            AllergenItem(name="Lactose / Dairy", severity=AllergenSeverity.INTOLERANCE),
        ],
    )


@pytest.fixture
def prithvi():
    return UserProfile()


# ---- Allergy engine (celiac / nut profile) ----

def test_detects_hidden_gluten_in_soy_sauce(maya_profile):
    res = SafetyAnalyzer.analyze("Chicken breast, garlic, soy sauce, broccoli, brown rice", maya_profile)
    assert res.overall_verdict == RiskLevel.DANGER
    assert res.hazard_score >= 70
    assert any("soy sauce" in f.ingredient_name.lower() for f in res.flags)
    assert any("Tamari" in r["recommended_safe_swap"] for r in res.suggested_replacements)


def test_detects_tree_nut_in_pesto(maya_profile):
    res = SafetyAnalyzer.analyze("Basil pesto with pine nuts, olive oil, garlic", maya_profile)
    assert res.overall_verdict == RiskLevel.DANGER


def test_passes_naturally_safe_dish(maya_profile):
    res = SafetyAnalyzer.analyze("Wild salmon, roasted sweet potatoes, olive oil, fresh rosemary, sea salt", maya_profile)
    assert res.overall_verdict == RiskLevel.SAFE
    assert res.flags == []


def test_peanut_butter_and_coconut_milk_are_not_dairy(maya_profile):
    res = SafetyAnalyzer.analyze("Peanut butter, coconut milk, rice", maya_profile)
    assert not any(f.matched_allergen == "Lactose / Dairy" for f in res.flags)


# ---- Prithvi: lactose (sometimes), sensitive gut, high TSH, weight loss ----

def test_default_profile_is_prithvi(prithvi):
    assert prithvi.name == "Prithvi"
    names = " ".join(a.name.lower() for a in prithvi.allergies)
    for word in ("lactose", "gut", "tsh", "weight"):
        assert word in names


def test_paneer_and_cream_are_caution_not_danger(prithvi):
    res = SafetyAnalyzer.analyze("Paneer, fresh cream, tomato", prithvi)
    assert res.overall_verdict == RiskLevel.CAUTION
    groups = {f.matched_allergen for f in res.flags}
    assert "Lactose / Dairy" in groups and "Weight Loss Goal" in groups


def test_ghee_is_not_flagged_for_lactose_intolerance(prithvi):
    res = SafetyAnalyzer.analyze("Ghee, moong dal, rice", prithvi)
    assert res.overall_verdict == RiskLevel.SAFE


def test_soy_flagged_for_thyroid(prithvi):
    res = SafetyAnalyzer.analyze("Tofu, soya chunks", prithvi)
    assert any(f.matched_allergen == "Thyroid (High TSH)" for f in res.flags)


def test_deep_fried_flagged_for_gut_and_weight_but_stir_fry_is_not(prithvi):
    fried = SafetyAnalyzer.analyze("Deep-fried pakora", prithvi)
    groups = {f.matched_allergen for f in fried.flags}
    assert {"Sensitive Gut", "Weight Loss Goal"} <= groups
    stir = SafetyAnalyzer.analyze("Stir-fried vegetables, air-fried potatoes", prithvi)
    assert stir.overall_verdict == RiskLevel.SAFE


# ---- Conversational assistant ----

def test_assistant_answers_known_dish(prithvi):
    res = FoodAssistant.answer(AskRequest(message="Can Prithvi eat paneer butter masala?"), prithvi)
    assert res.verdict == RiskLevel.CAUTION
    assert res.dish == "Paneer Butter Masala"
    assert res.swaps and "Prithvi" in res.reply


def test_assistant_safe_dish(prithvi):
    res = FoodAssistant.answer(AskRequest(message="can my friend eat idli sambar"), prithvi)
    assert res.verdict == RiskLevel.SAFE


def test_assistant_asks_for_unknown_dish_then_uses_follow_up(prithvi):
    first = FoodAssistant.answer(AskRequest(message="Can she eat thalipeeth?"), prithvi)
    assert first.verdict is None and first.context.pending_dish == "thalipeeth"
    second = FoodAssistant.answer(
        AskRequest(message="jowar flour, onion, oil, curd", context=first.context), prithvi
    )
    assert second.dish == "thalipeeth"
    assert second.verdict == RiskLevel.CAUTION


class FakeOpenModel:
    def __init__(self, ingredients):
        self.ingredients = ingredients

    async def suggest_ingredients(self, dish):
        return self.ingredients

    async def resolve_active_model(self):
        return "gemma2:2b"


def test_open_model_fills_in_unknown_dish_and_rules_decide(prithvi, monkeypatch):
    monkeypatch.setattr(assistant_module, "open_llm", FakeOpenModel(["jowar flour", "onion", "oil", "curd"]))
    r = asyncio.run(FoodAssistant.answer_with_open_model(AskRequest(message="Can she eat thalipeeth?"), prithvi))
    assert r.verdict == RiskLevel.CAUTION
    assert r.ingredients_source == "gemma2:2b"
    assert "curd" in r.assumed_ingredients
    assert "gemma2:2b" in r.reply
    # A corrected list still goes through the follow-up path.
    assert r.context.pending_dish == "thalipeeth"


def test_without_open_model_unknown_dish_asks_for_ingredients(prithvi, monkeypatch):
    monkeypatch.setattr(assistant_module, "open_llm", FakeOpenModel([]))
    r = asyncio.run(FoodAssistant.answer_with_open_model(AskRequest(message="Can she eat thalipeeth?"), prithvi))
    assert r.verdict is None and r.ingredients_source is None
    assert r.context.pending_dish == "thalipeeth"


def test_open_model_not_used_for_known_dishes(prithvi, monkeypatch):
    monkeypatch.setattr(assistant_module, "open_llm", FakeOpenModel(["sugar"]))
    r = asyncio.run(FoodAssistant.answer_with_open_model(AskRequest(message="Can she eat rajma chawal?"), prithvi))
    assert r.ingredients_source is None


def test_parse_ingredient_json():
    assert parse_ingredient_json('{"known": true, "ingredients": ["Paneer.", "cream", "paneer", 3]}') == ["paneer", "cream"]
    assert parse_ingredient_json('{"known": false, "ingredients": ["x", "y"]}') == []
    assert parse_ingredient_json('{"known": true, "ingredients": ["only one"]}') == []
    assert parse_ingredient_json("not json") == []
    assert parse_ingredient_json(None) == []


def test_assistant_suggests_meals_that_fit_profile(prithvi):
    res = FoodAssistant.answer(AskRequest(message="What can she have for breakfast?"), prithvi)
    assert res.suggestions
    for s in res.suggestions:
        assert "Fried" not in s.title


# ---- Remixer, voice script, planner ----

@pytest.mark.anyio
async def test_recipe_remix_uses_profile(prithvi):
    req = RecipeRemixRequest(
        title="Paneer Butter Masala",
        original_ingredients=["paneer", "butter", "fresh cream", "tomato", "soy sauce"],
        profile=prithvi,
    )
    res = await RecipeRemixer.remix(req)
    subs = {i.original: i.substitute for i in res.safe_ingredients}
    assert subs["paneer"] != "paneer"
    assert subs["fresh cream"] != "fresh cream"
    assert subs["tomato"] == "tomato"
    # Soy sauce is not a problem for this profile (no gluten or soy allergy).
    assert subs["soy sauce"] == "soy sauce"
    assert "Prithvi" in res.remixed_title


@pytest.mark.anyio
async def test_remix_instructions_have_no_step_labels(prithvi):
    req = RecipeRemixRequest(
        title="Dal", original_ingredients=["dal"],
        original_instructions=["Step 1: Wash dal", "2. Boil it", "Step 3 (Serve): Serve hot"],
        profile=prithvi,
    )
    res = await RecipeRemixer.remix(req)
    assert all(not s.lower().startswith("step") and not s[0].isdigit() for s in res.instructions)


def test_voice_script_numbers_each_step_once():
    script = VoiceService.generate_chef_script("Dal", ["Step 1: Wash dal.", "Step 2 (Cook): Boil it.", "3. Serve"], "Prithvi")
    assert script.count("Step 1") == 1 and script.count("Step 2") == 1 and script.count("Step 3") == 1
    assert "Step 1. Step" not in script and "Step 1: Step" not in script


def test_strip_step_label():
    assert strip_step_label("Step 4 (Serve): Plate it") == "Plate it"
    assert strip_step_label("12) Garnish") == "Garnish"
    assert strip_step_label("Stir well") == "Stir well"


@pytest.mark.anyio
async def test_meal_plan_fits_prithvi(prithvi):
    res = await MealPlanner.generate_plan(MealPlanRequest(days=5, roommate_profile=prithvi))
    assert len(res.days) == 5
    for day in res.days:
        scan = SafetyAnalyzer.analyze("\n".join(day.key_ingredients), prithvi)
        assert scan.overall_verdict == RiskLevel.SAFE


@pytest.mark.anyio
async def test_image_scan_with_known_hint(maya_profile):
    from app.engine.vision_analyzer import VisionAnalyzer
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    res = await VisionAnalyzer.analyze_image(dummy_b64, maya_profile, hint_label="Pad Thai with peanut sauce")
    assert res.identified and "Thai" in res.dish_name
    assert res.scan_result.overall_verdict == RiskLevel.DANGER


@pytest.mark.anyio
async def test_image_scan_without_hint_does_not_guess(prithvi):
    from app.engine.vision_analyzer import VisionAnalyzer
    res = await VisionAnalyzer.analyze_image("aGk=", prithvi, hint_label=None)
    assert res.identified is False and res.scan_result is None


# ---- API ----

def test_api_ask_and_limits():
    client = TestClient(app)
    r = client.post("/api/ask", json={"message": "Can Prithvi eat rajma chawal?"})
    assert r.status_code == 200 and r.json()["verdict"] == "CAUTION"
    too_long = client.post("/api/ask", json={"message": "x" * 2000})
    assert too_long.status_code == 422
    assert client.post("/api/profile", json={}).status_code == 405
