import time
import base64
import httpx
from fastapi import APIRouter, File, HTTPException, Request, UploadFile
from pydantic import BaseModel, Field
from typing import Optional, List
from app.models.schemas import (
    UserProfile, ScanRequest, ScanResponse,
    RecipeRemixRequest, RecipeRemixResponse,
    MealPlanRequest, MealPlanResponse,
    AskRequest, AskResponse,
)
from app.engine.assistant import FoodAssistant
from app.api.rate_limit import voice_limiter
from app.engine.safety_analyzer import SafetyAnalyzer
from app.engine.recipe_remixer import RecipeRemixer
from app.engine.meal_planner import MealPlanner
from app.engine.llm_provider import open_llm
from app.engine.voice_service import VoiceService
from app.config import settings

router = APIRouter(prefix="/api")

# Default profile. Each visitor's edits are kept in their own browser and sent
# with every request, so one visitor can never change another's profile.
DEFAULT_PROFILE = UserProfile()

MAX_AUDIO_UPLOAD_BYTES = 8 * 1024 * 1024


class VoiceGuideRequest(BaseModel):
    title: str = Field(..., max_length=200)
    steps: List[str] = Field(..., max_length=25)
    roommate_name: Optional[str] = Field("Prithvi", max_length=40)


class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1500)


def _voice_payload(audio_bytes: Optional[bytes], script: str) -> dict:
    if audio_bytes:
        return {
            "success": True,
            "provider": f"ElevenLabs ({settings.ELEVENLABS_MODEL})",
            "voice_name": "ElevenLabs Voice",
            "audio_base64": base64.b64encode(audio_bytes).decode("utf-8"),
            "script": script,
        }
    return {
        "success": True,
        "provider": "Browser speech (ElevenLabs unavailable)",
        "voice_name": "Local Synthesizer",
        "audio_base64": None,
        "script": script,
    }

@router.get("/health")
async def health_check():
    ollama_ready = await open_llm.is_ollama_available()
    active_model = await open_llm.resolve_active_model() if ollama_ready else "Rule-based food knowledge base"
    voice_ready = bool(settings.ELEVENLABS_API_KEY)
    return {
        "status": "healthy",
        "service": "AllergySafe Table API",
        "open_source_engine": {
            "ollama_connected": ollama_ready,
            "active_model": active_model,
            "is_gemma_model": "gemma" in active_model.lower(),
            "mode": f"Local open model ({active_model})" if ollama_ready else "Rule-based engine",
        },
        "voice": {
            "text_to_speech": voice_ready,
            "speech_to_text": voice_ready,
            "provider": "ElevenLabs" if voice_ready else None,
        },
    }

@router.get("/profile", response_model=UserProfile)
async def get_profile():
    return DEFAULT_PROFILE

@router.post("/ask", response_model=AskResponse)
async def ask(req: AskRequest):
    """Conversational check: "Can Prithvi eat paneer butter masala?" """
    return FoodAssistant.answer(req, req.profile or DEFAULT_PROFILE)

@router.post("/scan", response_model=ScanResponse)
async def scan_ingredients(req: ScanRequest):
    start_time = time.perf_counter()
    profile = req.profile or DEFAULT_PROFILE
    res = SafetyAnalyzer.analyze(req.text, profile, req.dish_title)
    elapsed_ms = round((time.perf_counter() - start_time) * 1000, 2)
    
    # Timing metadata shown in the UI
    res.ai_trace["trace"] = {
        "operation": "allergen_audit",
        "latency_ms": elapsed_ms,
        "ingredients_evaluated": res.total_ingredients_audited,
        "triggers_found": len(res.flags),
        "model_architecture": "Rule-based food knowledge base"
    }
    return res

class ImageScanPayload(BaseModel):
    image_base64: str = Field(..., max_length=12_000_000)
    hint_label: Optional[str] = Field(None, max_length=200)
    dish_title: Optional[str] = Field(None, max_length=200)
    profile: Optional[UserProfile] = None

@router.post("/scan-image")
async def scan_image(payload: ImageScanPayload):
    from app.engine.vision_analyzer import VisionAnalyzer
    profile = payload.profile or DEFAULT_PROFILE
    hint = payload.hint_label or payload.dish_title
    return await VisionAnalyzer.analyze_image(
        image_base64=payload.image_base64,
        profile=profile,
        hint_label=hint
    )

@router.post("/remix", response_model=RecipeRemixResponse)
async def remix_recipe(req: RecipeRemixRequest):
    return await RecipeRemixer.remix(req)

@router.post("/meal-plan", response_model=MealPlanResponse)
async def create_meal_plan(req: MealPlanRequest):
    return await MealPlanner.generate_plan(req)

@router.post("/voice-guide")
async def generate_voice_guide(req: VoiceGuideRequest, request: Request):
    """Read the recipe steps aloud so the cook doesn't have to touch the screen."""
    steps = [step[:400] for step in req.steps]
    script = VoiceService.generate_chef_script(req.title, steps, req.roommate_name or "Prithvi")[:3000]
    audio_bytes = None
    if settings.ELEVENLABS_API_KEY:
        voice_limiter.check(request)
        audio_bytes = await VoiceService.synthesize_elevenlabs(script)
    return _voice_payload(audio_bytes, script)

@router.post("/speak")
async def speak(req: SpeakRequest, request: Request):
    """Speak an assistant answer aloud."""
    audio_bytes = None
    if settings.ELEVENLABS_API_KEY:
        voice_limiter.check(request)
        audio_bytes = await VoiceService.synthesize_elevenlabs(req.text)
    return _voice_payload(audio_bytes, req.text)

@router.post("/transcribe")
async def transcribe(request: Request, file: UploadFile = File(...)):
    """Turn a recorded voice question into text with ElevenLabs speech-to-text."""
    if not settings.ELEVENLABS_API_KEY:
        raise HTTPException(status_code=503, detail="Voice input is not configured on this server.")
    voice_limiter.check(request)
    audio = await file.read(MAX_AUDIO_UPLOAD_BYTES + 1)
    if len(audio) > MAX_AUDIO_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Recording is too long. Keep questions under a minute.")
    if not audio:
        raise HTTPException(status_code=400, detail="The recording was empty.")
    text = await VoiceService.transcribe(audio, file.filename or "question.webm", file.content_type or "audio/webm")
    if text is None:
        raise HTTPException(status_code=502, detail="Couldn't transcribe the recording. Please try again or type your question.")
    return {"text": text}

@router.get("/why-open-source")
async def why_open_source():
    return {
        "manifesto": "Why this app is open source",
        "pillars": [
            {
                "title": "Health data stays private",
                "argument": "Food checks run on this app's own server with open rules, and the profile is stored only in the visitor's browser. Voice features use ElevenLabs only when the user asks for them."
            },
            {
                "title": "Answers you can check",
                "argument": "Every verdict comes from open, readable ingredient lists and rules, so anyone can see why a dish was flagged and fix the data."
            },
            {
                "title": "Self-hostable",
                "argument": "The whole app runs on a laptop or home network with no paid AI API. An optional local open model can be added through Ollama."
            },
            {
                "title": "Free to use and improve",
                "argument": "Anyone can add dishes, ingredients, or health conditions and share them back."
            }
        ]
    }
