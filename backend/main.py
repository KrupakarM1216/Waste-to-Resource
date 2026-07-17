"""
EcoSync API — Waste-to-Resource backend.

Contains both endpoints:
1. /api/evaluate-scrap (Vision: analyzes uploaded photos of scrap)
2. /api/analyze (Text: analyzes text descriptions of waste)

Setup:
    pip install -r requirements.txt
    cp .env.example .env      # then paste in your real GEMINI_API_KEY
    uvicorn main:app --reload --port 8080
"""

import json
import os

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile, Body
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

load_dotenv()

# Overridable via .env — gemini-2.5-flash is the current free-tier-friendly model.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = FastAPI(title="EcoSync Waste-to-Resource API", version="1.0.0")

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
# Response Schemas
# ---------------------------------------------------------------------------

# Schema for Image Vision (/api/evaluate-scrap)
class ScrapAssessment(BaseModel):
    material_category: str
    specific_materials: list[str]
    estimated_weight_kg: int = Field(..., ge=0)
    purity_assessment: str
    hazard_flags: list[str]
    carbon_saved_kg: float = Field(..., ge=0)
    confidence_score: int = Field(..., ge=0, le=100)
    market_value_inr: int = Field(..., ge=0, description="Estimated ₹ per kg")

# Schemas for Text Analysis (/api/analyze)
class WasteQuery(BaseModel):
    description: str

class ResourceMatch(BaseModel):
    industry: str
    use_case: str
    demand_level: str
    estimated_value_inr: str

class WasteAnalysis(BaseModel):
    identified_materials: list[str]
    recyclability_score: int = Field(..., ge=0, le=100)
    potential_buyers: list[ResourceMatch]
    handling_instructions: list[str]


# ---------------------------------------------------------------------------
# Gemini Prompts
# ---------------------------------------------------------------------------

VISION_SYSTEM_PROMPT = """You are an expert industrial scrap and recycling assessor \
for an eco-logistics platform. Analyze the photo of waste/scrap the user provides \
and return ONLY a JSON object (no markdown fences) with these exact keys:

1. "material_category": broad category, e.g. "Polymer & Plastic Scrap".
2. "specific_materials": list of specific materials detected.
3. "estimated_weight_kg": integer, rough weight estimate from visual volume.
4. "purity_assessment": one short sentence on how clean vs. mixed the scrap is.
5. "hazard_flags": list of safety/environmental hazards. Empty list if none.
6. "carbon_saved_kg": estimated kg CO2 saved if recycled instead of landfilled.
7. "confidence_score": integer 0-100, how confident you are in the identification.
8. "market_value_inr": integer, estimated ₹ per kg in the Indian scrap market.

If the image does not clearly show scrap/waste material, still return valid JSON \
with your best guess, set material_category to "Undetermined", and set confidence_score low."""

TEXT_SYSTEM_PROMPT = """You are an expert waste-to-resource matchmaker. \
Analyze the user's text description of their waste/scrap. \
Return ONLY a JSON object (no markdown fences) matching this exact structure:

{
  "identified_materials": ["list", "of", "materials"],
  "recyclability_score": integer between 0 and 100,
  "potential_buyers": [
    {
      "industry": "e.g., Construction, Electronics",
      "use_case": "e.g., Using crushed glass for concrete",
      "demand_level": "High or Medium or Low",
      "estimated_value_inr": "₹ per kg estimate or range"
    }
  ],
  "handling_instructions": ["list", "of", "safety/prep steps"]
}"""


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not set. Add it to backend/.env and restart. "
            "Get a free key at https://aistudio.google.com/apikey",
        )
    return genai.Client(api_key=api_key)

def clean_json_response(raw_text: str) -> dict:
    """Removes markdown formatting if the AI includes it and parses the JSON."""
    raw_text = raw_text.strip()
    if raw_text.startswith("```"):
        raw_text = raw_text.strip("`")
        if raw_text.lower().startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()
    
    try:
        return json.loads(raw_text)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI returned an unparseable response: {raw_text[:200]}",
        ) from exc


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "EcoSync Waste-to-Resource API"}


@app.post("/api/evaluate-scrap", response_model=ScrapAssessment)
async def evaluate_scrap(file: UploadFile = File(...)) -> ScrapAssessment:
    """Vision Endpoint: Analyzes an uploaded image of scrap."""
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

    client = get_gemini_client()

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[
                types.Part.from_bytes(data=image_bytes, mime_type=file.content_type),
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

    data = clean_json_response(response.text or "")
    return ScrapAssessment(**data)


@app.post("/api/analyze", response_model=WasteAnalysis)
async def analyze_waste(query: WasteQuery) -> WasteAnalysis:
    """Text Endpoint: Analyzes a text description of waste/scrap."""
    if not query.description.strip():
        raise HTTPException(status_code=400, detail="Waste description cannot be empty.")

    client = get_gemini_client()

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=[query.description],
            config=types.GenerateContentConfig(
                system_instruction=TEXT_SYSTEM_PROMPT,
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Gemini API call failed: {exc}") from exc

    data = clean_json_response(response.text or "")
    return WasteAnalysis(**data)