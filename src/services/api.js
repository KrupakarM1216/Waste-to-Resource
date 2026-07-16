/**
 * EcoSync API service.
 *
 * Currently returns mocked data with simulated network latency.
 * When the backend is ready, flip USE_MOCK to false — every call
 * will hit the FastAPI server at BASE_URL (localhost:8080) instead,
 * no changes needed in the components.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const USE_MOCK = false;

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_MATERIAL_CATEGORIES = [
  {
    keywords: ['plastic', 'polymer', 'pet', 'hdpe', 'ldpe', 'polypropylene', 'nylon', 'resin'],
    category: 'Polymer & Plastic Scrap',
    baseScore: 94,
  },
  {
    keywords: ['metal', 'steel', 'aluminum', 'aluminium', 'copper', 'iron', 'swarf', 'shavings', 'offcut'],
    category: 'Ferrous & Non-Ferrous Metals',
    baseScore: 91,
  },
  {
    keywords: ['wood', 'sawdust', 'timber', 'pallet', 'lumber', 'chips', 'bark'],
    category: 'Wood & Biomass By-Products',
    baseScore: 89,
  },
  {
    keywords: ['textile', 'fabric', 'cotton', 'fiber', 'fibre', 'yarn', 'cloth', 'garment'],
    category: 'Textile & Fiber Waste',
    baseScore: 87,
  },
  {
    keywords: ['food', 'organic', 'grain', 'husk', 'pulp', 'peel', 'brewery', 'spent'],
    category: 'Organic & Food Processing Waste',
    baseScore: 92,
  },
  {
    keywords: ['chemical', 'solvent', 'acid', 'oil', 'lubricant', 'sludge'],
    category: 'Industrial Chemicals & Oils',
    baseScore: 84,
  },
  {
    keywords: ['glass', 'cullet', 'ceramic', 'silica'],
    category: 'Glass & Ceramic Cullet',
    baseScore: 88,
  },
  {
    keywords: ['paper', 'cardboard', 'carton', 'kraft'],
    category: 'Paper & Cardboard Recyclables',
    baseScore: 90,
  },
];

const MOCK_BUSINESSES = {
  'Polymer & Plastic Scrap': [
    {
      id: 1,
      name: 'GreenLoop Polymers',
      type: 'Plastic Reprocessor',
      distance: '4.2 km',
      demand: 'High',
      capacity: '120 tonnes/month',
      rating: 4.8,
      initials: 'GP',
    },
    {
      id: 2,
      name: 'ReMold Industries',
      type: 'Injection Molding',
      distance: '11.7 km',
      demand: 'Medium',
      capacity: '45 tonnes/month',
      rating: 4.6,
      initials: 'RI',
    },
    {
      id: 3,
      name: 'CircuPack Solutions',
      type: 'Sustainable Packaging',
      distance: '18.3 km',
      demand: 'High',
      capacity: '80 tonnes/month',
      rating: 4.9,
      initials: 'CS',
    },
  ],
  'Ferrous & Non-Ferrous Metals': [
    {
      id: 1,
      name: 'Apex Metal Recovery',
      type: 'Smelting & Refining',
      distance: '6.9 km',
      demand: 'High',
      capacity: '300 tonnes/month',
      rating: 4.7,
      initials: 'AM',
    },
    {
      id: 2,
      name: 'ForgeCycle Ltd.',
      type: 'Foundry Feedstock',
      distance: '14.1 km',
      demand: 'High',
      capacity: '150 tonnes/month',
      rating: 4.8,
      initials: 'FC',
    },
    {
      id: 3,
      name: 'UrbanOre Traders',
      type: 'Scrap Aggregator',
      distance: '9.5 km',
      demand: 'Medium',
      capacity: '90 tonnes/month',
      rating: 4.5,
      initials: 'UO',
    },
  ],
  default: [
    {
      id: 1,
      name: 'TerraCycle Partners',
      type: 'Material Recovery Facility',
      distance: '7.8 km',
      demand: 'High',
      capacity: '200 tonnes/month',
      rating: 4.7,
      initials: 'TP',
    },
    {
      id: 2,
      name: 'Verdant Resources Co.',
      type: 'Upcycling Manufacturer',
      distance: '12.4 km',
      demand: 'Medium',
      capacity: '60 tonnes/month',
      rating: 4.6,
      initials: 'VR',
    },
    {
      id: 3,
      name: 'LoopWorks Industrial',
      type: 'Circular Supply Chain',
      distance: '20.1 km',
      demand: 'High',
      capacity: '110 tonnes/month',
      rating: 4.9,
      initials: 'LW',
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function categorize(description) {
  const text = description.toLowerCase();
  for (const entry of MOCK_MATERIAL_CATEGORIES) {
    if (entry.keywords.some((kw) => text.includes(kw))) {
      return entry;
    }
  }
  return { category: 'Mixed Industrial By-Products', baseScore: 78 };
}

function scoreVariation(description) {
  // Deterministic small variation so the same input gives the same score.
  let hash = 0;
  for (let i = 0; i < description.length; i++) {
    hash = (hash * 31 + description.charCodeAt(i)) % 997;
  }
  return hash % 6; // 0–5
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Analyze a plain-English waste description and return AI match results.
 * @param {string} description
 * @returns {Promise<{matchScore: number, materialType: string, matches: Array}>}
 */
export async function analyzeWaste(description) {
  if (!USE_MOCK) {
    const res = await fetch(`${BASE_URL}/api/evaluate-scrap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });

    // 1. Catch the specific Gemini overload / retry exhaust errors (502/503)
    if (res.status === 502 || res.status === 503) {
      throw new Error("Our AI is currently experiencing heavy traffic. Please wait a moment and try again.");
    }

    // 2. Catch any other random server errors (404, 500, etc.)
    if (!res.ok) {
      throw new Error(`Analysis failed (${res.status}). Please try again.`);
    }

    return res.json();
  }

  // Simulate network + model inference latency.
  await delay(1800);

  const { category, baseScore } = categorize(description);
  const matches = MOCK_BUSINESSES[category] ?? MOCK_BUSINESSES.default;

  return {
    matchScore: Math.min(baseScore + scoreVariation(description), 99),
    materialType: category,
    matches,
  };
}

export default { analyzeWaste };