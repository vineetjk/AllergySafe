import random
from typing import Dict, List

from app.engine.food_library import MEALS
from app.engine.safety_analyzer import SafetyAnalyzer
from app.models.schemas import (
    DayMealPlan, MealPlanRequest, MealPlanResponse, RiskLevel, UserProfile,
)

DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


class MealPlanner:
    @staticmethod
    async def generate_plan(req: MealPlanRequest) -> MealPlanResponse:
        """
        Plan shared dinners that suit the friend's profile, so everyone at the
        table eats the same meal. Meals are checked against the profile and the
        ones with no conflicts are used first.
        """
        profile = req.roommate_profile or UserProfile()
        dinners = [m for m in MEALS if "dinner" in m["types"] and m.get("aisles")]

        safe, caution = [], []
        for meal in dinners:
            scan = SafetyAnalyzer.analyze("\n".join(meal["ingredients"]), profile)
            if scan.overall_verdict == RiskLevel.SAFE:
                safe.append(meal)
            elif scan.overall_verdict == RiskLevel.CAUTION:
                caution.append(meal)
        random.shuffle(safe)
        chosen = (safe + caution)[: max(1, min(req.days, 7))]

        days_list: List[DayMealPlan] = []
        groceries: Dict[str, List[str]] = {}
        for idx, meal in enumerate(chosen):
            days_list.append(DayMealPlan(
                day_number=idx + 1,
                day_name=DAY_NAMES[idx % 7],
                dinner_title=meal["title"],
                dinner_description=meal["description"],
                why_safe_for_both=meal["why"],
                prep_time_minutes=meal["minutes"],
                key_ingredients=meal["ingredients"],
                safety_prep_tip=meal["tip"],
            ))
            for aisle, items in meal["aisles"].items():
                bucket = groceries.setdefault(aisle, [])
                for item in items:
                    if item not in bucket:
                        bucket.append(item)

        kitchen_protocol = [
            "Cook once for everyone: the whole table eats the same dinner.",
            "Measure oil with a spoon; 1-2 teaspoons per person is plenty.",
            "Keep lactose-free milk and curd in the fridge so swaps are easy.",
            "Prep vegetables for two days at a time to make weeknights quicker.",
        ]


        return MealPlanResponse(
            days=days_list,
            grocery_list_by_aisle=groceries,
            kitchen_safety_protocol=kitchen_protocol,
            ai_engine="Rule-based meal planner",
        )
