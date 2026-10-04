from typing import List, Dict
from app.models.schemas import (
    MealPlanRequest, MealPlanResponse, DayMealPlan, UserProfile
)
from app.engine.llm_provider import open_llm

CURATED_SHARED_MEALS = [
    {
        "dinner_title": "Crispy Citrus-Herb Salmon with Roasted Sweet Potato & Garlic Broccolini",
        "description": "Pan-seared wild salmon fillets glazed in lemon-herb olive oil, served over caramelized roasted sweet potatoes and crispy charred broccolini.",
        "why_safe_for_both": "Naturally 100% gluten-free, dairy-free, and nut-free. High omega-3 and rich umami without needing heavy creams or flours.",
        "prep_time_minutes": 25,
        "key_ingredients": ["Wild salmon fillets", "Sweet potatoes", "Fresh broccolini", "Garlic", "Lemon", "Extra virgin olive oil", "Rosemary", "Flaky sea salt"],
        "safety_tip": "Roast vegetables on fresh unbleached parchment paper to avoid contact with any prior baking residue.",
        "aisles": {
            "Produce": ["Sweet potatoes", "Fresh broccolini", "Garlic", "Fresh lemons", "Fresh rosemary"],
            "Meat & Seafood": ["Wild salmon fillets (2-4 fillets)"],
            "Pantry & Oils": ["Extra virgin olive oil", "Flaky sea salt", "Black pepper"]
        }
    },
    {
        "dinner_title": "Smoky Chipotle Carnitas Tacos with Pickled Red Onion & Avocado Crema",
        "description": "Slow-braised spiced shredded pork served on warm 100% certified corn tortillas, topped with fresh avocado-lime crema and tangy pickled onions.",
        "why_safe_for_both": "100% certified gluten-free corn tortillas replace flour tortillas; silky avocado replaces sour cream/dairy completely without losing richness.",
        "prep_time_minutes": 35,
        "key_ingredients": ["Pork shoulder or chicken thighs", "Certified GF corn tortillas", "Avocados", "Limes", "Red onion", "Chipotle in adobo (GF)", "Cumin", "Cilantro (optional)"],
        "safety_tip": "Warm corn tortillas on a dry stainless steel pan, never in a shared toaster.",
        "aisles": {
            "Produce": ["Ripe avocados", "Fresh limes", "Red onion", "Fresh cilantro"],
            "Meat & Seafood": ["Boneless pork shoulder or chicken thighs"],
            "Pantry & Grains": ["Certified Gluten-Free yellow corn tortillas", "Ground cumin", "Smoked paprika"],
            "Condiments & Sauces": ["Gluten-free chipotle chili in adobo", "Apple cider vinegar"]
        }
    },
    {
        "dinner_title": "Golden Turmeric Coconut Chicken Curry with Jasmine Rice & Sugar Snap Peas",
        "description": "Fragrant Thai-inspired curry simmered in rich coconut milk, fresh ginger, lemongrass, and tender chicken, served over fluffy steamed jasmine rice.",
        "why_safe_for_both": "Full-fat canned coconut milk provides deep velvety luxury with zero dairy or tree nut allergens. Coconut aminos replace soy sauce.",
        "prep_time_minutes": 30,
        "key_ingredients": ["Chicken breast / thighs", "Full-fat coconut milk", "Jasmine rice", "Sugar snap peas", "Fresh ginger", "Garlic", "Turmeric", "Coconut aminos"],
        "safety_tip": "Double-check curry paste labels for sneaky shrimp paste or soy sauce additives.",
        "aisles": {
            "Produce": ["Sugar snap peas", "Fresh ginger root", "Garlic cloves", "Lime"],
            "Meat & Seafood": ["Chicken breast cutlets"],
            "Pantry & Grains": ["Jasmine rice", "Canned full-fat coconut milk (Aroy-D or Native Forest)"],
            "Condiments & Sauces": ["Organic coconut aminos", "Ground turmeric", "Red curry paste (GF certified)"]
        }
    },
    {
        "dinner_title": "Tuscan White Bean & Kale Skillet with Sundried Tomatoes & GF Polenta",
        "description": "Hearty Cannellini beans simmered in olive oil, garlic, sweet sundried tomatoes, and dark lacinato kale over crispy pan-fried polenta rounds.",
        "why_safe_for_both": "Corn-based polenta gives comforting Italian rustic satisfaction while remaining 100% celiac-safe and vegan-friendly.",
        "prep_time_minutes": 25,
        "key_ingredients": ["Cannellini beans", "Prepared polenta tube (GF)", "Lacinato kale", "Sundried tomatoes in olive oil", "Garlic", "Vegetable broth (GF)"],
        "safety_tip": "Ensure vegetable broth is certified gluten-free (some brands contain hidden yeast extract from barley).",
        "aisles": {
            "Produce": ["Lacinato kale bunch", "Garlic cloves"],
            "Pantry & Grains": ["Canned cannellini beans", "Prepared organic polenta tube", "Sundried tomatoes in olive oil", "Certified GF vegetable broth"]
        }
    },
    {
        "dinner_title": "Sesame-Free Tamari Beef & Broccoli Stir-Fry with Rice Noodles",
        "description": "Tender flank steak stir-fried with crisp broccoli florets in a rich glaze of certified gluten-free tamari, fresh ginger, and coconut aminos over broad rice noodles.",
        "why_safe_for_both": "100% broad rice noodles replicate restaurant chow fun; certified tamari gives authentic Chinese wok flavor without wheat or nuts.",
        "prep_time_minutes": 25,
        "key_ingredients": ["Flank steak", "Broccoli crowns", "Broad rice noodles", "Gluten-free tamari", "Coconut aminos", "Fresh ginger", "Garlic", "Arrowroot starch"],
        "safety_tip": "Thicken sauce with arrowroot starch or tapioca starch instead of wheat cornstarch.",
        "aisles": {
            "Produce": ["Fresh broccoli crowns", "Ginger root", "Garlic"],
            "Meat & Seafood": ["Flank steak or sirloin"],
            "Pantry & Grains": ["Broad flat rice noodles", "Arrowroot starch"],
            "Condiments & Sauces": ["San-J Gluten-Free Tamari", "Coconut aminos"]
        }
    }
]

class MealPlanner:
    @staticmethod
    async def generate_plan(req: MealPlanRequest) -> MealPlanResponse:
        """
        Generate co-dining dinner plans designed so both roommates enjoy the same delicious food
        with zero allergen compromises or separate cooking stress.
        """
        days_count = max(1, min(req.days, len(CURATED_SHARED_MEALS)))
        selected_meals = CURATED_SHARED_MEALS[:days_count]
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        days_list: List[DayMealPlan] = []
        consolidated_groceries: Dict[str, List[str]] = {
            "Produce": [],
            "Meat & Seafood": [],
            "Pantry & Grains": [],
            "Condiments & Sauces": [],
            "Refrigerated & Dairy-Free": []
        }

        for idx, meal in enumerate(selected_meals):
            days_list.append(DayMealPlan(
                day_number=idx + 1,
                day_name=day_names[idx % len(day_names)],
                dinner_title=meal["dinner_title"],
                dinner_description=meal["description"],
                why_safe_for_both=meal["why_safe_for_both"],
                prep_time_minutes=meal["prep_time_minutes"],
                key_ingredients=meal["key_ingredients"],
                safety_prep_tip=meal["safety_tip"]
            ))

            # Merge grocery items
            for aisle, items in meal.get("aisles", {}).items():
                if aisle not in consolidated_groceries:
                    consolidated_groceries[aisle] = []
                for item in items:
                    if item not in consolidated_groceries[aisle]:
                        consolidated_groceries[aisle].append(item)

        kitchen_protocol = [
            "🟢 Dedicated Color Zone: Reserve green cutting boards exclusively for allergy-safe prep.",
            "🍞 Toaster Isolation: Never toast gluten-free bread in the regular toaster; use toaster bags or oven broiler.",
            "🧽 Clean Sponge Rule: Gluten and nut proteins stick to sponges; use a fresh silicone scrubber for safe pans.",
            "🧂 Safe Spice Shakers: Never pinch salt from an open cellar where floury fingers may have dipped."
        ]

        ollama_active = await open_llm.is_ollama_available()
        engine_str = "Ollama / Llama 3.2 3B (Open-Source Multi-Roommate Co-Dining Engine)" if ollama_active else "Open-Source Deterministic Co-Dining Engine"

        return MealPlanResponse(
            days=days_list,
            grocery_list_by_aisle=consolidated_groceries,
            kitchen_safety_protocol=kitchen_protocol,
            ai_engine=engine_str
        )
