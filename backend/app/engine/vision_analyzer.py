import re
import json
import base64
import logging
import httpx
from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from app.config import settings
from app.models.schemas import UserProfile, ScanResponse
from app.engine.safety_analyzer import SafetyAnalyzer
from app.engine.food_library import find_dish, dish_ingredients

logger = logging.getLogger(__name__)

class ImageScanResult(BaseModel):
    identified: bool = True
    dish_name: str
    item_category: str # "Prepared Full Meal" | "Single Ingredient" | "Packaged Product"
    detected_ingredients: List[str]
    visual_cues: List[str]
    scan_result: Optional[ScanResponse] = None
    vision_engine: str
    message: Optional[str] = None

# Curated high-accuracy food signature mapping for visual heuristics when offline
FOOD_SIGNATURES = [
    {
        "keywords": ["pasta", "spaghetti", "alfredo", "fettuccine", "carbonara", "lasagna", "macaroni"],
        "dish_name": "Creamy Italian Pasta (Prepared Meal)",
        "category": "Prepared Full Meal",
        "ingredients": ["Durum wheat pasta", "Heavy cream", "Butter", "Parmesan cheese", "Garlic", "Black pepper"],
        "cues": ["Ribbon-cut pasta noodles", "White cream emulsion", "Grated aged cheese garnish"]
    },
    {
        "keywords": ["pad thai", "thai noodles", "satay", "peanut sauce"],
        "dish_name": "Thai Stir-Fried Noodles / Satay (Prepared Meal)",
        "category": "Prepared Full Meal",
        "ingredients": ["Rice noodles", "Crushed roasted peanuts", "Soy sauce", "Fish sauce", "Tofu / Chicken", "Bean sprouts", "Egg"],
        "cues": ["Flat rice noodles with tamarind glaze", "Crushed peanut crumble topping", "Egg ribbons"]
    },
    {
        "keywords": ["pizza", "margherita", "pepperoni"],
        "dish_name": "Stone-Baked Pizza (Prepared Meal)",
        "category": "Prepared Full Meal",
        "ingredients": ["Wheat flour crust", "Mozzarella cheese", "Tomato sauce", "Yeast", "Olive oil"],
        "cues": ["Charred wheat dough crust", "Melted dairy mozzarella", "Tomato passata"]
    },
    {
        "keywords": ["salmon", "fish fillet", "asparagus", "sweet potato"],
        "dish_name": "Pan-Seared Wild Salmon & Roasted Veggies (Prepared Meal)",
        "category": "Prepared Full Meal",
        "ingredients": ["Wild salmon fillet", "Extra virgin olive oil", "Roasted sweet potatoes", "Steamed asparagus", "Lemon", "Sea salt"],
        "cues": ["Crispy seared salmon skin", "Tender asparagus spears", "Gluten-free naturally"]
    },
    {
        "keywords": ["salad", "caesar", "caprese", "pesto"],
        "dish_name": "Pesto Caprese Salad (Prepared Meal)",
        "category": "Prepared Full Meal",
        "ingredients": ["Fresh mozzarella cheese", "Ripe tomatoes", "Pine nut basil pesto", "Balsamic glaze", "Olive oil"],
        "cues": ["Fresh basil pesto glaze", "Dairy mozzarella slices", "Pine nut clusters"]
    },
    {
        "keywords": ["sauce", "bbq", "barbecue", "dressing", "marinade", "bottle", "jar"],
        "dish_name": "Bottled Barbecue Glaze (Packaged Condiment)",
        "category": "Packaged Product",
        "ingredients": ["Tomato paste", "Barley malt extract", "Worcestershire sauce", "Brown sugar", "Vinegar", "Spices"],
        "cues": ["Dark amber viscous condiment", "Label indicates malt extract stabilizer"]
    },
    {
        "keywords": ["almond", "walnut", "cashew", "nut", "trail mix", "granola"],
        "dish_name": "Raw Mixed Tree Nuts (Single Ingredient / Snack)",
        "category": "Single Ingredient",
        "ingredients": ["Whole almonds", "Raw cashews", "Walnut halves", "Pecan pieces"],
        "cues": ["Whole tree nut kernels", "High anaphylactic hazard"]
    }
]

class VisionAnalyzer:
    @staticmethod
    async def analyze_image(
        image_base64: str,
        profile: UserProfile,
        hint_label: Optional[str] = None
    ) -> ImageScanResult:
        """
        Analyze captured camera photo or uploaded image of a single ingredient or prepared meal.
        Uses local open vision models (Ollama llava/minicpm-v) if available, or clinical visual signatures.
        """
        # Strip header if present (e.g. data:image/jpeg;base64,)
        clean_b64 = image_base64
        if "base64," in image_base64:
            clean_b64 = image_base64.split("base64,")[1]

        detected_dish = None
        category = "Prepared Full Meal"
        ingredients = []
        cues = []
        vision_engine = "Open-Source Visual Signature Classifier (Offline Engine)"

        # 1. Attempt Ollama Vision model
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
                if res.status_code == 200:
                    models = [m.get("name", "") for m in res.json().get("models", [])]
                    vision_model = next((m for m in models if any(k in m for k in ["llava", "minicpm", "bakllava", "vision"])), None)
                    
                    if vision_model:
                        prompt = (
                            "Identify this food item. Is it a prepared meal, single ingredient, or packaged product? "
                            "List all visible and hidden ingredients (like wheat, dairy, soy sauce, nuts, oils). "
                            "Respond in JSON format: {\"dish_name\": \"...\", \"category\": \"...\", \"ingredients\": [\"...\"], \"cues\": [\"...\"]}"
                        )
                        payload = {
                            "model": vision_model,
                            "prompt": prompt,
                            "images": [clean_b64],
                            "stream": False,
                            "format": "json"
                        }
                        v_res = await client.post(f"{settings.OLLAMA_HOST}/api/generate", json=payload, timeout=25.0)
                        if v_res.status_code == 200:
                            v_data = json.loads(v_res.json().get("response", "{}"))
                            if v_data.get("dish_name"):
                                detected_dish = v_data.get("dish_name")
                                category = v_data.get("category", "Prepared Full Meal")
                                ingredients = v_data.get("ingredients", [])
                                cues = v_data.get("cues", [])
                                vision_engine = f"Ollama Vision ({vision_model})"
        except Exception as e:
            logger.info(f"Ollama vision check bypassed: {e}")

        # 2. No vision model: use the name the user typed, if any.
        if not detected_dish:
            hint = (hint_label or "").strip()
            match = None
            for sig in FOOD_SIGNATURES:
                if hint and any(k in hint.lower() for k in sig["keywords"]):
                    match = sig
                    break
            library_dish = find_dish(hint) if hint else None

            if library_dish:
                detected_dish = library_dish
                category = "Prepared Full Meal"
                ingredients = dish_ingredients(library_dish)
                cues = [f"Identified from the name you entered: \"{hint}\""]
                vision_engine = "Dish name + food library (no image model available)"
            elif match:
                detected_dish = match["dish_name"]
                category = match["category"]
                ingredients = match["ingredients"]
                cues = match["cues"]
                vision_engine = "Dish name + food library (no image model available)"
            else:
                return ImageScanResult(
                    identified=False,
                    dish_name=hint or "Unidentified food",
                    item_category="Unknown",
                    detected_ingredients=[],
                    visual_cues=[],
                    scan_result=None,
                    vision_engine="No image recognition model is available on this server",
                    message=(
                        "I couldn't identify this photo. Type the dish name (for example "
                        "\"rajma chawal\") or paste the ingredients from the label, and I'll check it."
                    ),
                )

        # 3. Check the detected ingredients against the profile
        ingredients_text = "\n".join(ingredients)
        safety_scan = SafetyAnalyzer.analyze(ingredients_text, profile, detected_dish)

        return ImageScanResult(
            identified=True,
            dish_name=detected_dish,
            item_category=category,
            detected_ingredients=ingredients,
            visual_cues=cues,
            scan_result=safety_scan,
            vision_engine=vision_engine
        )
