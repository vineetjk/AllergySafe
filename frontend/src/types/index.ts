export type Severity = "anaphylactic" | "severe" | "moderate" | "intolerance" | "preference";
export type RiskLevel = "SAFE" | "CAUTION" | "DANGER";

export interface AllergenItem {
  name: string;
  severity: Severity;
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  relationship: string;
  allergies: AllergenItem[];
  dislikes: string[];
  favorite_cuisines: string[];
}

export interface IngredientFlag {
  ingredient_name: string;
  matched_allergen: string;
  risk_level: RiskLevel;
  scientific_reason: string;
  is_hidden_derivative: boolean;
  safe_substitute?: string;
}

export interface ScanResponse {
  overall_verdict: RiskLevel;
  hazard_score: number;
  dish_title?: string;
  summary: string;
  total_ingredients_audited: number;
  flags: IngredientFlag[];
  cross_contamination_risks: string[];
  suggested_replacements: Array<{
    unsafe_ingredient: string;
    detected_trigger: string;
    recommended_safe_swap: string;
    allergen_group: string;
  }>;
  ai_trace: {
    engine: string;
    rules_evaluated: number;
    roommate_scanned: string;
    offline_capable: boolean;
    privacy_audit: string;
  };
}

export interface RemixedIngredient {
  original: string;
  substitute: string;
  amount: string;
  notes: string;
}

export interface RecipeRemixResponse {
  remixed_title: string;
  description: string;
  prep_time: string;
  cook_time: string;
  servings: number;
  safe_ingredients: RemixedIngredient[];
  instructions: string[];
  cross_contamination_rules: string[];
  flavor_preservation_notes: string;
  ai_engine: string;
}

export interface DayMealPlan {
  day_number: number;
  day_name: string;
  dinner_title: string;
  dinner_description: string;
  why_safe_for_both: string;
  prep_time_minutes: number;
  key_ingredients: string[];
  safety_prep_tip: string;
}

export interface MealPlanResponse {
  days: DayMealPlan[];
  grocery_list_by_aisle: Record<string, string[]>;
  kitchen_safety_protocol: string[];
  ai_engine: string;
}
