import json
import logging
import httpx
from typing import Any, Dict, List, Optional
from app.config import settings

logger = logging.getLogger(__name__)

class OpenLLMProvider:
    def __init__(self):
        self.ollama_host = settings.OLLAMA_HOST
        self.model = settings.OLLAMA_MODEL
        self.detected_gemma = False
        self._ingredient_cache: Dict[str, List[str]] = {}

    async def get_available_models(self) -> list[str]:
        """Fetch models installed in local Ollama instance."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.ollama_host}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    return models
        except Exception:
            pass
        return []

    async def is_ollama_available(self) -> bool:
        """Check if local Ollama daemon is reachable."""
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{self.ollama_host}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def resolve_active_model(self) -> str:
        """Pick Google Gemma 2 if available, else configured default."""
        models = await self.get_available_models()
        # Prioritize Google Gemma 2 for the Featured Partner Category
        for candidate in ["gemma2:2b", "gemma2", "gemma2:9b", "gemma:2b"]:
            if any(candidate in m for m in models):
                self.detected_gemma = True
                return candidate
        if models:
            self.detected_gemma = any("gemma" in m.lower() for m in models)
            return models[0]
        return self.model

    async def generate_with_gemma(
        self, prompt: str, system_prompt: Optional[str] = None, json_output: bool = False
    ) -> Optional[str]:
        """
        Generate a completion with the local open-weight model (Google Gemma 2 when
        installed). Ollama applies Gemma's own chat template, so the prompt is sent as is.
        Returns None when Ollama is not running or the call fails.
        """
        active_model = await self.resolve_active_model()
        payload: Dict[str, Any] = {
            "model": active_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": 0.2,  # Low temperature for culinary accuracy
                "top_p": 0.9,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt
        if json_output:
            payload["format"] = "json"

        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                res = await client.post(f"{self.ollama_host}/api/generate", json=payload)
                if res.status_code == 200:
                    return res.json().get("response", "").strip()
        except Exception as e:
            logger.info(f"Open LLM generation fallback triggered: {e}")
        return None

    async def suggest_ingredients(self, dish: str) -> List[str]:
        """
        Ask the local model what usually goes into a dish the food library doesn't know.
        The model only lists ingredients; the rule-based analyzer decides whether they
        suit the profile. Returns [] when the model is unavailable, unsure, or the dish
        isn't a real food.
        """
        key = dish.strip().lower()
        if key in self._ingredient_cache:
            return self._ingredient_cache[key]
        if not key or not await self.is_ollama_available():
            return []

        raw = await self.generate_with_gemma(
            f'Dish: "{dish}"',
            system_prompt=INGREDIENT_SYSTEM_PROMPT,
            json_output=True,
        )
        ingredients = parse_ingredient_json(raw)
        self._ingredient_cache[key] = ingredients
        return ingredients


INGREDIENT_SYSTEM_PROMPT = (
    "You list the typical ingredients of a dish, the way it is usually made in an Indian home, "
    "mess, or restaurant. Include cooking fat, dairy, sauces, toppings and garnishes "
    "(for example fried farsan or sev), how it is cooked (for example deep-fried), and "
    "\"very spicy\" if it is usually very spicy. Reply only with JSON: "
    '{"known": true, "ingredients": ["ingredient", ...]} with 4 to 12 short ingredient names. '
    'If it is not a real food or drink, or you are not sure what it is, reply {"known": false, "ingredients": []}.'
)


def parse_ingredient_json(raw: Optional[str]) -> List[str]:
    """Validate the model's JSON reply into a short, clean ingredient list."""
    if not raw:
        return []
    try:
        data = json.loads(raw)
    except ValueError:
        return []
    if not isinstance(data, dict) or data.get("known") is False:
        return []
    items = data.get("ingredients")
    if not isinstance(items, list):
        return []
    cleaned: List[str] = []
    for item in items:
        if not isinstance(item, str):
            continue
        name = item.strip().strip(".").lower()
        if 0 < len(name) <= 40 and name not in cleaned:
            cleaned.append(name)
    return cleaned[:12] if len(cleaned) >= 2 else []


open_llm = OpenLLMProvider()

