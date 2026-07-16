/**
 * Rough CO₂-avoidance multipliers: kg of CO₂ saved per kg of material
 * diverted from landfill/virgin production. These are coarse, directional
 * estimates for illustration — always labeled as approximate in the UI.
 */
const CO2_FACTORS = [
  { keywords: ['aluminium', 'aluminum'], factor: 9.0 },
  { keywords: ['copper'], factor: 4.0 },
  { keywords: ['brass', 'bronze'], factor: 2.5 },
  { keywords: ['steel', 'iron', 'metal'], factor: 1.8 },
  { keywords: ['e-waste', 'electronic', 'circuit', 'pcb', 'wire'], factor: 6.0 },
  { keywords: ['textile', 'fabric', 'cotton', 'garment'], factor: 3.0 },
  { keywords: ['plastic', 'hdpe', 'ldpe', 'pet', 'polymer', 'polypropylene', 'nylon'], factor: 1.5 },
  { keywords: ['wood', 'timber', 'sawdust', 'pallet'], factor: 1.1 },
  { keywords: ['paper', 'cardboard', 'carton'], factor: 0.9 },
  { keywords: ['glass', 'cullet'], factor: 0.3 },
  { keywords: ['organic', 'food', 'grain', 'compost'], factor: 0.5 },
];

const DEFAULT_FACTOR = 1.0;

/** Look up the CO₂ multiplier for a free-form material name. */
export function co2FactorFor(material) {
  const text = (material || '').toLowerCase();
  const hit = CO2_FACTORS.find((entry) =>
    entry.keywords.some((kw) => text.includes(kw))
  );
  return hit ? hit.factor : DEFAULT_FACTOR;
}
