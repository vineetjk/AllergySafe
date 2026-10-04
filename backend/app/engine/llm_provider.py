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

    async def is_ollama_available(self) -> bool:
        """Check if local Ollama daemon is reachable."""
        try:
            async with httpx.AsyncClient(timeout=1.5) as client:
                res = await client.get(f"{self.ollama_host}/api/tags")
                return res.status_code == 200
        except Exception:
            return False

    async def generate(self, prompt: str, system_prompt: Optional[str] = None) -> Optional[str]:
        """Query local Ollama instance if available, otherwise return None."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False,
                }
                if system_prompt:
                    payload["system"] = system_prompt

                res = await client.post(f"{self.ollama_host}/api/generate", json=payload)
                if res.status_code == 200:
                    data = res.json()
                    return data.get("response", "")
        except Exception as e:
            logger.info(f"Ollama generation fallback triggered: {e}")
        return None

open_llm = OpenLLMProvider()
