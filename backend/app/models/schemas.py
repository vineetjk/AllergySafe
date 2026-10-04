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
    name: str
    severity: AllergenSeverity = AllergenSeverity.SEVERE
    notes: Optional[str] = ""

class UserProfile(BaseModel):
    id: str = "maya-default"
    name: str = "Maya"
    relationship: str = "Roommate"
    allergies: List[AllergenItem] = [
        AllergenItem(name="Gluten / Celiac", severity=AllergenSeverity.ANAPHYLACTIC, notes="Severe Celiac Disease. Strictly no wheat, barley, rye, or hidden malt. Cross-contamination causes acute illness."),
        AllergenItem(name="Tree Nuts", severity=AllergenSeverity.ANAPHYLACTIC, notes="Almonds, cashews, walnuts, pistachios. Carries EpiPen."),
        AllergenItem(name="Lactose / Dairy", severity=AllergenSeverity.INTOLERANCE, notes="Severe digestive discomfort; aged parmesan is tolerable in tiny amounts, but prefers dairy-free.")
    ]
    dislikes: List[str] = ["Cilantro", "Very spicy hot sauce"]
    favorite_cuisines: List[str] = ["Mediterranean", "Japanese", "Comfort Mexican", "Rustic Italian"]

class IngredientFlag(BaseModel):
    ingredient_name: str
    matched_allergen: str
    risk_level: RiskLevel
    scientific_reason: str
    is_hidden_derivative: bool = False
    safe_substitute: Optional[str] = None

class ScanRequest(BaseModel):
    text: str = Field(..., description="Recipe text, ingredient list, or menu description")
    profile: Optional[UserProfile] = None
    dish_title: Optional[str] = None

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
    title: str
    original_ingredients: List[str]
    original_instructions: Optional[List[str]] = None
    target_allergies: Optional[List[str]] = None
    servings: int = 2

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
    days: int = 3
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
