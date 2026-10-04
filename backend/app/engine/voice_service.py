import asyncio
import base64
import json
import logging
import httpx
import websockets
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("uvicorn.error")

# Models ElevenLabs only serves over the realtime Text to Dialogue websocket.
WEBSOCKET_ONLY_MODELS = {"eleven_v4_turbo"}
# Used if the websocket model fails, so playback stays an ElevenLabs voice.
HTTP_FALLBACK_MODEL = "eleven_turbo_v2_5"

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
        """Synthesize voice with ElevenLabs, using the configured model."""
        if not settings.ELEVENLABS_API_KEY:
            logger.warning("ELEVENLABS_API_KEY is not set; voice guide will use the browser's built-in speech.")
            return None

        model = settings.ELEVENLABS_MODEL
        if model in WEBSOCKET_ONLY_MODELS:
            audio = await VoiceService._synthesize_websocket(text, model)
            if audio:
                return audio
            logger.warning("Falling back from %s to %s over HTTP.", model, HTTP_FALLBACK_MODEL)
            model = HTTP_FALLBACK_MODEL
        return await VoiceService._synthesize_http(text, model)

    @staticmethod
    async def _synthesize_http(text: str, model: str) -> Optional[bytes]:
        url = f"https://api.elevenlabs.io/v1/text-to-speech/{settings.ELEVENLABS_VOICE_ID}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": settings.ELEVENLABS_API_KEY
        }
        payload = {
            "text": text,
            "model_id": model,
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

    @staticmethod
    async def _synthesize_websocket(text: str, model: str) -> Optional[bytes]:
        """Eleven v4 Turbo is only served over the Text to Dialogue websocket.
        Send the whole script, collect the streamed MP3 chunks, return one clip."""
        voice_id = settings.ELEVENLABS_VOICE_ID
        url = (
            "wss://api.elevenlabs.io/v1/text-to-dialogue/stream-input"
            f"?model_id={model}&output_format=mp3_44100_128"
        )
        chunks: list[bytes] = []

        async def run() -> None:
            async with websockets.connect(url, max_size=None) as ws:
                await ws.send(json.dumps({"voices": [voice_id], "xi_api_key": settings.ELEVENLABS_API_KEY}))
                await ws.send(json.dumps({"inputs": [{"text": text, "voice_id": voice_id, "new_turn": False}]}))
                await ws.send(json.dumps({"flush": True}))
                # Signal end of input so the server finishes and closes,
                # instead of idling until its 20s inactivity timeout.
                await ws.send(json.dumps({"close_socket": True}))
                async for raw in ws:
                    msg = json.loads(raw)
                    if msg.get("error"):
                        raise RuntimeError(msg["error"])
                    if msg.get("audio"):
                        chunks.append(base64.b64decode(msg["audio"]))
                    if msg.get("is_final"):
                        break

        try:
            await asyncio.wait_for(run(), timeout=30.0)
        except Exception as e:
            if not chunks:
                logger.error("ElevenLabs %s websocket error: %r", model, e)
                return None
            # Closing after the final frame can race the server; keep the audio.
            logger.info("ElevenLabs %s websocket closed with %r after audio was received.", model, e)
        if not chunks:
            logger.error("ElevenLabs %s websocket returned no audio.", model)
            return None
        return b"".join(chunks)
