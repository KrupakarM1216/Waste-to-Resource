"""
EcoSync API — FastAPI backend for the Green Tech waste-matching platform.

Features:
  1. Text-based waste matching  — keyword/fuzzy categorization + buyer matches.
  2. Scrap-to-Cash valuation    — Gemini Vision analyzes a scrap photo and
                                  estimates market value in ₹/kg.

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

app = FastAPI(
    title="EcoSync API",
    description="AI-powered matching and valuation of industrial by-products.",
    version="1.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|172\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+):5173|https://.*\.vercel\.app",
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


class ScrapValuation(BaseModel):
    """Gemini Vision valuation of an uploaded scrap photo."""

    material: str
    confidence_score: int = Field(..., ge=0, le=100)
    market_value_inr: int = Field(..., description="Estimated ₹ per kg")


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
# Service: Gemini Vision scrap valuation
# ---------------------------------------------------------------------------

VISION_SYSTEM_PROMPT = (
    "You are an industrial scrap valuation expert. Analyze the uploaded "
    "image and identify the primary scrap material. You must respond ONLY "
    "with a raw JSON object containing three keys: material (string), "
    "confidence_score (integer 0-100), and market_value_inr (integer, "
    "estimated value in ₹ per kg). Do not include markdown formatting."
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


def get_gemini_client() -> genai.Client:
    """Configure Gemini, failing clearly if the key is missing."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail=(
                "GEMINI_API_KEY is not configured. "
                "Add it to backend/.env (GEMINI_API_KEY=...) and restart."
            ),
        )
    return genai.Client(api_key=api_key)


def evaluate_scrap_image(image_bytes: bytes, content_type: str) -> ScrapValuation:
    """
    Send a scrap photo to Gemini and parse its JSON valuation.
    """
    client = get_gemini_client()

    image_part = types.Part.from_bytes(data=image_bytes, mime_type=content_type)

    try:
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=[
                VISION_SYSTEM_PROMPT,
                "Evaluate the scrap material in this photo.",
                image_part,
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Gemini request failed: {exc}",
        ) from exc

    raw = response.text.strip()

    # Defensive parse: strip markdown fences if the model adds them anyway.
    if raw.startswith("```"):
        raw = raw.strip("`")
        if raw.lower().startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    # Defensive parse: extract just the first {...} block in case the
    # model appends stray characters (extra braces, trailing text, etc).
    start = raw.find("{")
    end = raw.rfind("}")
    if start != -1 and end != -1 and end > start:
        raw = raw[start:end + 1]

    try:
        data = json.loads(raw)
        return ScrapValuation(**data)
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
    return {"status": "ok", "service": "EcoSync API", "version": "1.1.0"}


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


@app.post("/api/evaluate-scrap", response_model=ScrapValuation)
async def evaluate_scrap(file: UploadFile = File(...)) -> ScrapValuation:
    """
    Scrap-to-Cash: accept a scrap photo, send it to Gemini Vision,
    and return {material, confidence_score, market_value_inr}.
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