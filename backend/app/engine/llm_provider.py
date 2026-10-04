import json
import logging
import httpx
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class OpenLLMProvider:
    def __init__(self):
        self.ollama_host = settings.OLLAMA_HOST
        self.model = settings.OLLAMA_MODEL
        self.detected_gemma = False

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

    async def generate_with_gemma(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """
        Generate completion using Google Gemma 2 open-weight model with Gemma's
        distinctive turn-based token template: <start_of_turn>user ... <end_of_turn><start_of_turn>model
        """
        active_model = await self.resolve_active_model()
        formatted_prompt = prompt
        
        # If Gemma is active, wrap with Gemma turn tokens
        if "gemma" in active_model.lower():
            sys_block = f"{system_prompt}\n\n" if system_prompt else ""
            formatted_prompt = f"<start_of_turn>user\n{sys_block}{prompt}<end_of_turn>\n<start_of_turn>model\n"

        try:
            async with httpx.AsyncClient(timeout=35.0) as client:
                payload = {
                    "model": active_model,
                    "prompt": formatted_prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.2, # Low temperature for culinary accuracy
                        "top_p": 0.9
                    }
                }
                res = await client.post(f"{self.ollama_host}/api/generate", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "").strip()
        except Exception as e:
            logger.info(f"Open LLM generation fallback triggered: {e}")
        return None

open_llm = OpenLLMProvider()

