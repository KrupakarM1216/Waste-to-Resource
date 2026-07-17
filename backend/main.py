"""
EcoSync API — Scrap-to-Cash backend.

Accepts a photo of scrap/waste material, sends it to Gemini Vision, and
returns a structured valuation: material identity, purity, hazards,
CO2 impact, confidence, and estimated market value in Rupees/kg.

Setup:
    pip install -r requirements.txt
    cp .env.example .env      # then paste in your real GEMINI_API_KEY
    uvicorn main:app --reload --port 8080

Get a free Gemini key: https://aistudio.google.com/apikey
"""

import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

load_dotenv()

# Overridable via .env — gemini-2.5-flash is the current free-tier-friendly
# vision model. If you hit 429 RESOURCE_EXHAUSTED, your key has no quota
# left for whichever model is set here; check https://ai.dev/rate-limit
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = FastAPI(title="EcoSync Scrap-to-Cash API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_BYTES = 10 * 1024 * 1024  # 10 MB


# ---------------------------------------------------------------------------
# Response schema
# ---------------------------------------------------------------------------


class ScrapAssessment(BaseModel):
    material_category: str
    specific_materials: list[str]
    estimated_weight_kg: int = Field(..., ge=0)
    purity_assessment: str
    hazard_flags: list[str]
    carbon_saved_kg: float = Field(..., ge=0)
    confidence_score: int = Field(..., ge=0, le=100)
    market_value_inr: int = Field(..., ge=0, description="Estimated ₹ per kg")


# ---------------------------------------------------------------------------
# Gemini Vision prompt
# ---------------------------------------------------------------------------

VISION_SYSTEM_PROMPT = """You are an expert industrial scrap and recycling assessor \
for an eco-logistics platform. Analyze the photo of waste/scrap the user provides \
and return ONLY a JSON object (no markdown fences) with these exact keys:

1. "material_category": broad category, e.g. "Polymer & Plastic Scrap", "Ferrous Metals".
2. "specific_materials": list of specific materials detected, e.g. ["HDPE", "Copper Wire"].
3. "estimated_weight_kg": integer, rough weight estimate from visual volume.
4. "purity_assessment": one short sentence on how clean vs. mixed the scrap is.
5. "hazard_flags": list of safety/environmental hazards, e.g. ["Contains motor oil"]. Empty list if none.
6. "carbon_saved_kg": estimated kg CO2 saved if recycled instead of landfilled (number).
7. "confidence_score": integer 0-100, how confident you are in the identification.
8. "market_value_inr": integer, estimated ₹ per kg for the primary material in the Indian scrap market.

If the image does not clearly show scrap/waste material, still return valid JSON with your \
best guess, set material_category to "Undetermined", and set confidence_score low."""


def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not set. Add it to backend/.env and restart. "
            "Get a free key at https://aistudio.google.com/apikey",
        )
    return genai.Client(api_key=api_key)


def evaluate_scrap_image(image_bytes: bytes, content_type: str) -> ScrapAssessment:
    client = get_gemini_client()

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=content_type),
                "Analyze the scrap material in this photo and return the assessment JSON.",
            ],
            config=types.GenerateContentConfig(
                system_instruction=VISION_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.2,
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API call failed: {exc}") from exc

    raw = (response.text or "").strip()

    # Defensive: strip markdown fences if the model adds them anyway.
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        data = json.loads(raw)
        return ScrapAssessment(**data)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI returned an unparseable response: {raw[:200]}",
        ) from exc


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "EcoSync Scrap-to-Cash API"}


@app.post("/api/evaluate-scrap", response_model=ScrapAssessment)
async def evaluate_scrap(file: UploadFile = File(...)) -> ScrapAssessment:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. Upload a JPEG, PNG, WebP, or GIF.",
        )

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(image_bytes) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")

    return evaluate_scrap_image(image_bytes, file.content_type)