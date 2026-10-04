import httpx
from fastapi import APIRouter, HTTPException
from typing import Optional
from app.models.schemas import (
    UserProfile, ScanRequest, ScanResponse,
    RecipeRemixRequest, RecipeRemixResponse,
    MealPlanRequest, MealPlanResponse, OpenFoodFactsProduct
)
from app.engine.safety_analyzer import SafetyAnalyzer
from app.engine.recipe_remixer import RecipeRemixer
from app.engine.meal_planner import MealPlanner
from app.engine.llm_provider import open_llm

router = APIRouter(prefix="/api")

# In-memory session profile (can be updated by user)
CURRENT_PROFILE = UserProfile()

@router.get("/health")
async def health_check():
    ollama_ready = await open_llm.is_ollama_available()
    return {
        "status": "healthy",
        "service": "AllergySafe Table API",
        "open_source_engine": {
            "ollama_connected": ollama_ready,
            "active_model": open_llm.model if ollama_ready else "Deterministic Clinical Taxonomy",
            "mode": "Local / On-Device Open Weights" if ollama_ready else "Local Open-Source Deterministic Engine",
            "privacy_guarantee": "100% on-device execution — zero external API telemetry"
        }
    }

@router.get("/profile", response_model=UserProfile)
async def get_profile():
    return CURRENT_PROFILE

@router.post("/profile", response_model=UserProfile)
async def update_profile(profile: UserProfile):
    global CURRENT_PROFILE
    CURRENT_PROFILE = profile
    return CURRENT_PROFILE

@router.post("/scan", response_model=ScanResponse)
async def scan_ingredients(req: ScanRequest):
    profile = req.profile or CURRENT_PROFILE
    return SafetyAnalyzer.analyze(req.text, profile, req.dish_title)

@router.post("/remix", response_model=RecipeRemixResponse)
async def remix_recipe(req: RecipeRemixRequest):
    return await RecipeRemixer.remix(req)

@router.post("/meal-plan", response_model=MealPlanResponse)
async def create_meal_plan(req: MealPlanRequest):
    return await MealPlanner.generate_plan(req)

@router.get("/open-food-facts/{query}")
async def lookup_open_food_facts(query: str):
    """
    Query the global open-source Open Food Facts database for barcode or product name.
    """
    try:
        # Check if barcode (numeric)
        if query.isdigit():
            url = f"https://world.openfoodfacts.org/api/v0/product/{query}.json"
        else:
            url = f"https://world.openfoodfacts.org/cgi/search.pl?search_terms={query}&search_simple=1&action=process&json=1&page_size=3"

        async with httpx.AsyncClient(timeout=8.0) as client:
            res = await client.get(url, headers={"User-Agent": "AllergySafeTable-DevChallenge/1.0"})
            if res.status_code == 200:
                data = res.json()
                if query.isdigit() and data.get("status") == 1:
                    p = data.get("product", {})
                    return {
                        "found": True,
                        "product_name": p.get("product_name", "Unknown Product"),
                        "brands": p.get("brands", ""),
                        "ingredients_text": p.get("ingredients_text", ""),
                        "allergens": p.get("allergens", ""),
                        "traces": p.get("traces", "")
                    }
                elif not query.isdigit() and data.get("products"):
                    products = []
                    for p in data.get("products", [])[:3]:
                        products.append({
                            "product_name": p.get("product_name", "Unknown"),
                            "brands": p.get("brands", ""),
                            "ingredients_text": p.get("ingredients_text", ""),
                            "allergens": p.get("allergens", "")
                        })
                    return {"found": True, "products": products}
    except Exception as e:
        pass
    
    return {"found": False, "message": "Product not found or offline mode active."}

@router.get("/why-open-source")
async def why_open_source():
    return {
        "manifesto": "Why Open-Source AI is Mandatory for Food Allergies & Loved Ones",
        "pillars": [
            {
                "title": "Health Data Sovereignty & Intimate Privacy",
                "argument": "Dietary restrictions and medical diagnoses (Celiac auto-immune disorder, anaphylaxis histories) are protected health information. Closed cloud LLMs retain chat histories to train proprietary models. With local open-source inference, your friend's medical records never exit the loopback interface."
            },
            {
                "title": "Zero-Hallucination Determinism over Black Boxes",
                "argument": "Closed commercial LLMs optimize for conversational fluency, not clinical accuracy. They frequently claim 'soy sauce is usually okay' or overlook maltodextrin. Our open architecture pairs open models with an open-source, auditable deterministic clinical taxonomy."
            },
            {
                "title": "Offline Basement Grocery Mode",
                "argument": "Supermarkets, bodegas, and food co-ops are frequently located in urban basements with zero cellular reception. A closed API app is useless when you're standing in aisle 4 wondering if a sauce will kill your roommate. AllergySafe Table runs 100% locally on your laptop or local network."
            },
            {
                "title": "Uncapped Zero-Cost for Students & Roommates",
                "argument": "Roommates and college students shouldn't have to pay $20/month per seat or face API rate-limits just to safely cook dinner together. Open weights like Llama 3.2 and open agent frameworks cost exactly $0 forever."
            }
        ]
    }
