from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum

class AllergenSeverity(str, Enum):
    ANAPHYLACTIC = "anaphylactic"
    SEVERE = "severe"
    MODERATE = "moderate"
    INTOLERANCE = "intolerance"
    PREFERENCE = "preference"

class RiskLevel(str, Enum):
    SAFE = "SAFE"
    CAUTION = "CAUTION"
    DANGER = "DANGER"

class AllergenItem(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    severity: AllergenSeverity = AllergenSeverity.SEVERE
    notes: Optional[str] = Field("", max_length=500)

def default_conditions() -> List["AllergenItem"]:
    return [
        AllergenItem(
            name="Lactose (sometimes)",
            severity=AllergenSeverity.INTOLERANCE,
            notes="Lactose bothers her on some days. Lactose-free milk, ghee, and aged cheese are usually fine; keep fresh milk, cream, paneer, and curd small or lactose-free."
        ),
        AllergenItem(
            name="Sensitive Gut",
            severity=AllergenSeverity.MODERATE,
            notes="Go easy on deep-fried food, very spicy dishes, fizzy drinks, alcohol, and sugar-free sweeteners. Simple home-style food suits her best."
        ),
        AllergenItem(
            name="High TSH (Thyroid)",
            severity=AllergenSeverity.MODERATE,
            notes="Limit soy foods and bajra. Cooked cabbage, cauliflower, and broccoli are fine. If she takes thyroid medicine, keep soy, calcium, iron, and coffee about 4 hours apart from it."
        ),
        AllergenItem(
            name="Weight Loss Goal",
            severity=AllergenSeverity.PREFERENCE,
            notes="Favour high-protein, high-fibre meals. Limit fried snacks, sweets, sugary drinks, maida, and heavy cream."
        ),
    ]


class UserProfile(BaseModel):
    id: str = "prithvi-default"
    name: str = Field("Prithvi", min_length=1, max_length=40)
    relationship: str = Field("Friend", max_length=60)
    allergies: List[AllergenItem] = Field(default_factory=default_conditions, max_length=20)
    dislikes: List[str] = Field(default_factory=list, max_length=30)
    favorite_cuisines: List[str] = Field(default_factory=lambda: ["Indian home-style"], max_length=20)

class IngredientFlag(BaseModel):
    ingredient_name: str
    matched_allergen: str
    risk_level: RiskLevel
    scientific_reason: str
    is_hidden_derivative: bool = False
    safe_substitute: Optional[str] = None

class ScanRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=8000, description="Recipe text, ingredient list, or menu description")
    profile: Optional[UserProfile] = None
    dish_title: Optional[str] = Field(None, max_length=200)

class ScanResponse(BaseModel):
    overall_verdict: RiskLevel
    hazard_score: int = Field(..., ge=0, le=100, description="0 = Completely Safe, 100 = Critical Danger")
    dish_title: Optional[str] = None
    summary: str
    total_ingredients_audited: int
    flags: List[IngredientFlag]
    cross_contamination_risks: List[str]
    suggested_replacements: List[Dict[str, str]]
    ai_trace: Dict[str, Any]

class RecipeRemixRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    original_ingredients: List[str] = Field(..., min_length=1, max_length=60)
    original_instructions: Optional[List[str]] = Field(None, max_length=40)
    target_allergies: Optional[List[str]] = None
    servings: int = Field(2, ge=1, le=20)
    profile: Optional[UserProfile] = None

class RemixedIngredient(BaseModel):
    original: str
    substitute: str
    amount: str
    notes: str

class RecipeRemixResponse(BaseModel):
    remixed_title: str
    description: str
    prep_time: str
    cook_time: str
    servings: int
    safe_ingredients: List[RemixedIngredient]
    instructions: List[str]
    cross_contamination_rules: List[str]
    flavor_preservation_notes: str
    ai_engine: str

class MealPlanRequest(BaseModel):
    days: int = Field(3, ge=1, le=7)
    roommate_profile: Optional[UserProfile] = None
    user_preferences: Optional[str] = "Quick weeknight dinners under 35 mins"
    cuisine_vibes: List[str] = ["Mediterranean", "Mexican", "Japanese"]

class DayMealPlan(BaseModel):
    day_number: int
    day_name: str
    dinner_title: str
    dinner_description: str
    why_safe_for_both: str
    prep_time_minutes: int
    key_ingredients: List[str]
    safety_prep_tip: str

class MealPlanResponse(BaseModel):
    days: List[DayMealPlan]
    grocery_list_by_aisle: Dict[str, List[str]]
    kitchen_safety_protocol: List[str]
    ai_engine: str

class OpenFoodFactsProduct(BaseModel):
    code: str
    product_name: str
    brands: Optional[str] = None
    ingredients_text: Optional[str] = None
    allergens: Optional[str] = None
    traces: Optional[str] = None


class AskContext(BaseModel):
    """Conversation state the client sends back with each message."""
    pending_dish: Optional[str] = Field(None, max_length=200)


class AskRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    profile: Optional[UserProfile] = None
    context: Optional[AskContext] = None


class AskSwap(BaseModel):
    ingredient: str
    swap: str
    reason: str


class AskSuggestion(BaseModel):
    title: str
    why: str


class AskResponse(BaseModel):
    reply: str
    verdict: Optional[RiskLevel] = None
    dish: Optional[str] = None
    assumed_ingredients: List[str] = []
    # Set when the ingredients came from the local open model, e.g. "gemma2:2b".
    ingredients_source: Optional[str] = None
    concerns: List[str] = []
    swaps: List[AskSwap] = []
    suggestions: List[AskSuggestion] = []
    tips: List[str] = []
    context: AskContext = AskContext()
