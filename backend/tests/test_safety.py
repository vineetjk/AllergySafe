import pytest
from app.models.schemas import (
    UserProfile, AllergenItem, AllergenSeverity, RiskLevel,
    RecipeRemixRequest, MealPlanRequest
)
from app.engine.safety_analyzer import SafetyAnalyzer
from app.engine.recipe_remixer import RecipeRemixer
from app.engine.meal_planner import MealPlanner

@pytest.fixture
def maya_profile():
    return UserProfile(
        name="Maya",
        allergies=[
            AllergenItem(name="Gluten / Celiac", severity=AllergenSeverity.ANAPHYLACTIC),
            AllergenItem(name="Tree Nuts", severity=AllergenSeverity.ANAPHYLACTIC),
            AllergenItem(name="Lactose / Dairy", severity=AllergenSeverity.INTOLERANCE)
        ]
    )

def test_detects_hidden_gluten_in_soy_sauce(maya_profile):
    text = "Chicken breast, garlic, soy sauce, broccoli, brown rice"
    res = SafetyAnalyzer.analyze(text, maya_profile)
    assert res.overall_verdict == RiskLevel.DANGER
    assert res.hazard_score >= 70
    assert any("soy sauce" in f.ingredient_name.lower() for f in res.flags)
    assert any("Tamari" in r["recommended_safe_swap"] for r in res.suggested_replacements)

def test_detects_tree_nut_in_pesto(maya_profile):
    text = "Basil pesto with pine nuts, olive oil, garlic"
    res = SafetyAnalyzer.analyze(text, maya_profile)
    assert res.overall_verdict == RiskLevel.DANGER
    assert any("pine nut" in f.ingredient_name.lower() or "pesto" in f.ingredient_name.lower() for f in res.flags)

def test_passes_naturally_safe_dish(maya_profile):
    text = "Wild salmon, roasted sweet potatoes, olive oil, fresh rosemary, sea salt, steamed asparagus"
    res = SafetyAnalyzer.analyze(text, maya_profile)
    assert res.overall_verdict == RiskLevel.SAFE
    assert res.hazard_score == 0
    assert len(res.flags) == 0

@pytest.mark.anyio
async def test_recipe_remix():
    req = RecipeRemixRequest(
        title="Crispy Chicken Parm",
        original_ingredients=["chicken cutlets", "all-purpose flour", "breadcrumbs", "parmesan cheese", "olive oil"]
    )
    res = await RecipeRemixer.remix(req)
    assert "AllergySafe" in res.remixed_title
    subs = {i.original: i.substitute for i in res.safe_ingredients}
    assert subs["all-purpose flour"] != "all-purpose flour"
    assert subs["breadcrumbs"] != "breadcrumbs"

@pytest.mark.anyio
async def test_meal_plan_generation(maya_profile):
    req = MealPlanRequest(days=3, roommate_profile=maya_profile)
    res = await MealPlanner.generate_plan(req)
    assert len(res.days) == 3
    assert "Produce" in res.grocery_list_by_aisle
    assert len(res.kitchen_safety_protocol) > 0
@pytest.mark.anyio
async def test_image_scan_prepared_meal(maya_profile):
    from app.engine.vision_analyzer import VisionAnalyzer
    dummy_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    res = await VisionAnalyzer.analyze_image(dummy_b64, maya_profile, hint_label="Pad Thai with peanut sauce")
    assert "Thai" in res.dish_name
    assert res.scan_result.overall_verdict == RiskLevel.DANGER
    assert any("peanut" in i.lower() for i in res.detected_ingredients)
