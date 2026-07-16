"""
EcoSync API — FastAPI backend for the Green Tech waste-matching platform.

Features:
  1. Text-based waste matching  — keyword/fuzzy categorization + buyer matches.
  2. Scrap-to-Cash assessment   — Gemini Vision analyzes a scrap photo and
                                  returns a structured industrial assessment
                                  (material, weight, purity, hazards, CO₂, ₹/kg).

Run with:
    uvicorn main:app --reload --port 8080
"""

import json
import os
from difflib import get_close_matches

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Environment & app setup
# ---------------------------------------------------------------------------

load_dotenv()  # reads backend/.env (GEMINI_API_KEY=...)

# Override with GEMINI_MODEL in .env if your key has quota on a different model.
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

app = FastAPI(
    title="EcoSync API",
    description="AI-powered matching and valuation of industrial by-products.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite default port
        "http://127.0.0.1:5173",
        "http://localhost:5174",   # Vite fallback port (5173 in use)
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------


class WasteInput(BaseModel):
    """Incoming plain-English waste description."""

    description: str = Field(..., min_length=10, examples=[
        "3 tonnes of HDPE plastic trimmings per week from our packaging line"
    ])


class MatchResult(BaseModel):
    """A single buyer match for the analyzed material."""

    material_category: str
    match_percentage: int = Field(..., ge=0, le=100)
    buyer_name: str


class ScrapAssessment(BaseModel):
    """Structured Gemini Vision assessment of an uploaded scrap photo."""

    material_category: str
    specific_materials: list[str]
    estimated_weight_kg: int = Field(..., ge=0)
    purity_assessment: str
    hazard_flags: list[str]
    carbon_saved_kg: float = Field(..., ge=0)
    confidence_score: int = Field(..., ge=0, le=100)
    market_value_inr: int = Field(..., ge=0, description="Estimated ₹ per kg")


# ---------------------------------------------------------------------------
# Mock AI knowledge base (text matching)
# ---------------------------------------------------------------------------

MATERIAL_KEYWORDS: dict[str, list[str]] = {
    "Polymer & Plastic Scrap": [
        "plastic", "polymer", "pet", "hdpe", "ldpe", "polypropylene",
        "nylon", "resin", "acrylic",
    ],
    "Ferrous & Non-Ferrous Metals": [
        "metal", "steel", "aluminum", "aluminium", "copper", "iron",
        "brass", "swarf", "shavings", "offcut",
    ],
    "Wood & Biomass By-Products": [
        "wood", "sawdust", "timber", "pallet", "lumber", "chips", "bark",
    ],
    "Textile & Fiber Waste": [
        "textile", "fabric", "cotton", "fiber", "fibre", "yarn",
        "cloth", "garment",
    ],
    "Organic & Food Processing Waste": [
        "food", "organic", "grain", "husk", "pulp", "peel",
        "brewery", "spent",
    ],
    "Industrial Chemicals & Oils": [
        "chemical", "solvent", "acid", "oil", "lubricant", "sludge",
    ],
    "Glass & Ceramic Cullet": [
        "glass", "cullet", "ceramic", "silica",
    ],
    "Paper & Cardboard Recyclables": [
        "paper", "cardboard", "carton", "kraft",
    ],
}

FALLBACK_CATEGORY = "Mixed Industrial By-Products"

BUYERS_BY_CATEGORY: dict[str, list[str]] = {
    "Polymer & Plastic Scrap": [
        "GreenLoop Polymers", "ReMold Industries", "CircuPack Solutions",
    ],
    "Ferrous & Non-Ferrous Metals": [
        "Apex Metal Recovery", "ForgeCycle Ltd.", "UrbanOre Traders",
    ],
    "Wood & Biomass By-Products": [
        "TimberCycle Co.", "BioChip Energy", "Sawdust & Beyond",
    ],
    "Textile & Fiber Waste": [
        "ReWeave Textiles", "FiberLoop Mills", "Second Thread Co.",
    ],
    "Organic & Food Processing Waste": [
        "TerraCompost Group", "BioGas Valley", "FeedForward Farms",
    ],
    "Industrial Chemicals & Oils": [
        "ChemCycle Solutions", "PetroRenew Ltd.", "SolventPure Inc.",
    ],
    "Glass & Ceramic Cullet": [
        "ClearLoop Glassworks", "CulletMax Recycling", "SilicaSphere Ltd.",
    ],
    "Paper & Cardboard Recyclables": [
        "PulpWorks Recycling", "KraftCycle Mills", "BoxLoop Industries",
    ],
    FALLBACK_CATEGORY: [
        "TerraCycle Partners", "Verdant Resources Co.", "LoopWorks Industrial",
    ],
}


# ---------------------------------------------------------------------------
# Service: text-based waste analysis
# ---------------------------------------------------------------------------


def analyze_waste(description: str) -> tuple[str, int]:
    """
    Categorize a waste description via keyword + fuzzy matching.

    Returns (material_category, base_match_score).
    """
    words = [w.strip(".,;:!?()") for w in description.lower().split()]

    best_category = FALLBACK_CATEGORY
    best_hits = 0

    for category, keywords in MATERIAL_KEYWORDS.items():
        hits = 0
        for word in words:
            # Exact keyword hit
            if word in keywords:
                hits += 2
            # Fuzzy hit — catches typos like "aluminun" or "plastik"
            elif get_close_matches(word, keywords, n=1, cutoff=0.85):
                hits += 1
        if hits > best_hits:
            best_hits = hits
            best_category = category

    # Score: strong keyword evidence -> higher confidence, capped at 99.
    if best_hits == 0:
        base_score = 76
    else:
        base_score = min(85 + best_hits * 3, 99)

    return best_category, base_score


def build_matches(category: str, base_score: int) -> list[MatchResult]:
    """Build three simulated buyer matches, ranked by descending score."""
    buyers = BUYERS_BY_CATEGORY.get(category, BUYERS_BY_CATEGORY[FALLBACK_CATEGORY])
    return [
        MatchResult(
            material_category=category,
            match_percentage=max(base_score - rank * 4, 50),
            buyer_name=buyer,
        )
        for rank, buyer in enumerate(buyers)
    ]


# ---------------------------------------------------------------------------
# Service: Gemini Vision scrap assessment
# ---------------------------------------------------------------------------

VISION_SYSTEM_PROMPT = """You are an expert industrial scrap and recycling assessor for an eco-logistics platform.
Your job is to analyze images of waste/scrap provided by users and return a structured JSON response.

Analyze the image and provide the following:
1. "material_category": The broad category (e.g., "Polymer & Plastic Scrap", "Ferrous Metals").
2. "specific_materials": A list of specific materials detected (e.g., ["HDPE", "Copper Wire"]).
3. "estimated_weight_kg": A rough numerical estimation of the weight in kilograms based on the visual volume (return an integer).
4. "purity_assessment": A brief assessment of how clean or mixed the scrap is.
5. "hazard_flags": A list of any potential environmental or safety hazards (e.g., ["Contains motor oil", "Sharp edges"]). If none, return an empty list.
6. "carbon_saved_kg": An estimated number of kilograms of CO2 saved if this material is recycled instead of landfilled.
7. "confidence_score": An integer 0-100 representing how confident you are in the identification.
8. "market_value_inr": An integer, the estimated market value in ₹ per kg for the primary material.

OUTPUT STRICTLY IN VALID JSON FORMAT. Do not include markdown blocks like ```json. Just output the raw JSON object."""

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def get_gemini_client() -> genai.Client:
    """Build a Gemini client, failing clearly if the key is missing."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "GEMINI_API_KEY is not configured. "
                "Add it to backend/.env (GEMINI_API_KEY=...) and restart. "
                "Get a free key at https://aistudio.google.com/apikey"
            ),
        )
    return genai.Client(api_key=api_key)


def evaluate_scrap_image(image_bytes: bytes, content_type: str) -> ScrapAssessment:
    """
    Send a scrap photo to Gemini Vision and parse its structured assessment.
    """
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
        raise HTTPException(
            status_code=502,
            detail=f"Gemini API call failed: {exc}",
        ) from exc

    raw = (response.text or "").strip()

    # Defensive parse: strip markdown fences if the model adds them anyway.
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
    """Simple liveness check."""
    return {"status": "ok", "service": "EcoSync API", "version": "2.0.0"}


@app.post("/api/match", response_model=list[MatchResult])
def match_waste(payload: WasteInput) -> list[MatchResult]:
    """
    Analyze a waste description and return three simulated buyer matches.
    """
    category, base_score = analyze_waste(payload.description)
    return build_matches(category, base_score)


@app.post("/api/analyze")
def analyze_for_frontend(payload: WasteInput) -> dict:
    """
    Same analysis, shaped for the EcoSync React frontend
    (matches the response contract in src/services/api.js).
    """
    category, base_score = analyze_waste(payload.description)
    matches = build_matches(category, base_score)

    distances = ["4.2 km", "11.7 km", "18.3 km"]
    demands = ["High", "Medium", "High"]
    capacities = ["120 tonnes/month", "45 tonnes/month", "80 tonnes/month"]
    ratings = [4.8, 4.6, 4.9]

    return {
        "matchScore": base_score,
        "materialType": category,
        "matches": [
            {
                "id": i + 1,
                "name": m.buyer_name,
                "type": "Verified Buyer",
                "distance": distances[i],
                "demand": demands[i],
                "capacity": capacities[i],
                "rating": ratings[i],
                "initials": "".join(w[0] for w in m.buyer_name.split()[:2]).upper(),
            }
            for i, m in enumerate(matches)
        ],
    }


@app.post("/api/evaluate-scrap", response_model=ScrapAssessment)
async def evaluate_scrap(file: UploadFile = File(...)) -> ScrapAssessment:
    """
    Scrap-to-Cash: accept a scrap photo, send it to Gemini Vision, and
    return the full structured assessment (material, weight, purity,
    hazards, CO₂ savings, confidence, ₹/kg value).
    """
    # Validate the upload before spending API tokens on it.
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{file.content_type}'. "
                   f"Upload a JPEG, PNG, WebP, or GIF image.",
        )

    image_bytes = await file.read()

    max_size = 10 * 1024 * 1024  # 10 MB
    if len(image_bytes) > max_size:
        raise HTTPException(status_code=413, detail="Image exceeds the 10 MB limit.")
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    return evaluate_scrap_image(image_bytes, file.content_type)
