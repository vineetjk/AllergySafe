import logging
import httpx
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("uvicorn.error")

class VoiceService:
    @staticmethod
    def generate_chef_script(title: str, steps: list[str], roommate_name: str = "Maya") -> str:
        """Create a conversational hands-free cooking narration script."""
        script_parts = [
            f"Hands-free kitchen guide activated! Let's cook {title} safely for {roommate_name}.",
            "First, your sterile kitchen reminder: sanitize your prep area with a fresh cloth, and use dedicated non-porous utensils."
        ]
        for idx, step in enumerate(steps, 1):
            clean_step = step.replace(f"Step {idx}:", "").strip()
            script_parts.append(f"Step {idx}: {clean_step}")
        script_parts.append(f"All set! Plate directly with clean tongs so you and {roommate_name} can enjoy dinner together safely.")
        return " ".join(script_parts)

    @staticmethod
    async def synthesize_elevenlabs(text: str) -> Optional[bytes]:
        """Synthesize high-fidelity voice using ElevenLabs TTS API."""
        if not settings.ELEVENLABS_API_KEY:
            logger.warning("ELEVENLABS_API_KEY is not set; voice guide will use the browser's built-in speech.")
            return None

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.ELEVENLABS_API_KEY
        }
        payload = {
            "text": text,
            "model_id": settings.ELEVENLABS_MODEL,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.8
            }
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    return res.content
                logger.error("ElevenLabs TTS failed (HTTP %s): %s", res.status_code, res.text[:300])
        except Exception as e:
            logger.error("ElevenLabs TTS request error: %r", e)
        return None
