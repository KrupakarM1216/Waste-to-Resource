# 🌱 EcoSync — Turn Industrial Waste into Raw Value

EcoSync is an AI-powered B2B marketplace that helps businesses turn industrial 
by-products into revenue instead of disposal costs. Describe your waste in 
plain English and get instantly matched with local buyers — or snap a photo 
of scrap material and get an AI-powered market valuation in ₹/kg.

**Live demo:** https://waste-to-resource.vercel.app

## Features

- **AI Waste Analyzer** — Describe industrial by-products in plain English; 
  the AI categorizes the material, scores it, and matches it with relevant 
  buyers.
- **Scrap-to-Cash** — Upload a photo of scrap material and get an instant 
  AI-powered valuation (material type, confidence score, estimated ₹/kg).
- **Buyer Matching** — Simulated buyer network across 8 material categories 
  (plastics, metals, textiles, organic waste, chemicals, glass, paper, wood).

## Tech Stack

**Frontend**
- React + Vite
- Tailwind CSS
- Deployed on Vercel

**Backend**
- FastAPI (Python)
- Google Gemini (`gemini-flash-latest`) for vision-based scrap valuation and 
  waste categorization
- Deployed on Render

## How It Works

1. **Describe Your Waste** — Tell the AI about your industrial by-products in 
   plain English, no material science knowledge required.
2. **AI Categorizes & Scores** — The model classifies the material, estimates 
   market value, and computes a compatibility score.
3. **Match & Trade Locally** — Get connected with vetted local buyers who need 
   your material as raw input.

## Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
# Add your GEMINI_API_KEY to backend/.env
uvicorn main:app --reload --port 8080
```

**Frontend:**
```bash
npm install
npm run dev
```

Set `VITE_API_URL=http://localhost:8080` in a `.env` file at the project root 
for local development.

## Environment Variables

| Variable | Where | Description |
|---|---|---|
| `GEMINI_API_KEY` | `backend/.env` | Google Gemini API key for AI vision/text analysis |
| `VITE_API_URL` | frontend `.env` | Backend API base URL |

## Roadmap

- Real geolocation-based buyer distance sorting
- Total value calculator (quantity × market rate)
- CO₂ impact estimates per material category
- Persistent listings and user history

---

Built for 🔥 Idea2Impact by Krupakar M.
