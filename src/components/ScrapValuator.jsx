import { useState, useRef, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const RECENT_KEY = 'ecosync_recent_scrap_valuations';
const MAX_RECENT = 5;

// Rough CO2-saved-per-kg fallback, used only if the backend's own
// carbon_saved_kg / estimated_weight_kg ratio isn't usable (e.g. weight is 0).
// These are illustrative estimates, not verified LCA figures.
const CO2_FALLBACK_BY_CATEGORY = {
  'Polymer & Plastic Scrap': 1.8,
  'Ferrous & Non-Ferrous Metals': 2.1,
  'Wood & Biomass By-Products': 0.9,
  'Textile & Fiber Waste': 3.4,
  'Organic & Food Processing Waste': 0.5,
  'Industrial Chemicals & Oils': 2.8,
  'Glass & Ceramic Cullet': 0.6,
  'Paper & Cardboard Recyclables': 1.1,
  Undetermined: 1.0,
};

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRecent(entry) {
  try {
    const existing = readRecent();
    const updated = [entry, ...existing].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return readRecent();
  }
}

function confidenceStyle(score) {
  if (score > 70) {
    return { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-300' };
  }
  if (score >= 40) {
    return { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-300' };
  }
  return { bg: 'bg-rose-100', text: 'text-rose-700', ring: 'ring-rose-300' };
}

// Builds a plausible 6-month trend ending exactly at the real current value,
// clearly labeled as illustrative — not real market data.
function buildTrendData(currentValue) {
  const months = ['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
  const startValue = Math.max(1, Math.round(currentValue * (0.75 + Math.random() * 0.3)));
  const drift = (currentValue - startValue) / (months.length - 1);
  return months.map((month, i) => {
    if (i === months.length - 1) return { month, value: currentValue };
    const jitter = Math.round(Math.random() * 6 - 3);
    return { month, value: Math.max(1, Math.round(startValue + drift * i + jitter)) };
  });
}

export default function ScrapValuator() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);
  const [quantityKg, setQuantityKg] = useState('');
  const [recent, setRecent] = useState(readRecent());
  const inputRef = useRef(null);

  const resetForNewUpload = useCallback((selectedFile) => {
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setResult(null);
    setStatus('idle');
    setErrorMessage('');
    setQuantityKg('');
  }, []);

  const handleFiles = useCallback(
    (fileList) => {
      const selected = fileList?.[0];
      if (!selected) return;
      if (!selected.type.startsWith('image/')) {
        setStatus('error');
        setErrorMessage("That file doesn't look like an image. Please upload a JPEG, PNG, WebP, or GIF.");
        return;
      }
      resetForNewUpload(selected);
    },
    [resetForNewUpload]
  );

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const handleAnalyze = useCallback(async () => {
    if (!file) return;
    setStatus('loading');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_BASE_URL}/api/evaluate-scrap`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let detail = `Request failed with status ${response.status}.`;
        try {
          const body = await response.json();
          if (body?.detail) detail = body.detail;
        } catch {
          // response wasn't JSON — keep the generic message
        }
        throw new Error(detail);
      }

      const data = await response.json();
      setResult(data);
      setQuantityKg(String(data.estimated_weight_kg || ''));
      setStatus('success');

      const updated = writeRecent({
        id: Date.now(),
        materialCategory: data.material_category,
        marketValueInr: data.market_value_inr,
        confidenceScore: data.confidence_score,
        timestamp: new Date().toISOString(),
      });
      setRecent(updated);
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof TypeError
          ? "Couldn't reach the analysis service. Check your connection and try again."
          : err.message || 'Something went wrong analyzing that photo. Please try again.'
      );
    }
  }, [file]);

  const parsedQuantity = Number(quantityKg) || 0;
  const totalValue = result ? parsedQuantity * result.market_value_inr : 0;

  const co2PerKg =
    result && result.estimated_weight_kg > 0
      ? result.carbon_saved_kg / result.estimated_weight_kg
      : CO2_FALLBACK_BY_CATEGORY[result?.material_category] ?? 1.0;
  const totalCo2Saved = result ? Math.round(parsedQuantity * co2PerKg * 10) / 10 : 0;

  const trendData = result ? buildTrendData(result.market_value_inr) : [];
  const badge = result ? confidenceStyle(result.confidence_score) : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-emerald-900">AI Scrap Vision</h2>
        <p className="text-emerald-700/80 mt-1">
          Upload a photo to get a full material assessment — type, purity, hazards & CO₂ impact.
        </p>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-colors
          ${isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-emerald-300 bg-white'}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Scrap preview"
            className="mx-auto max-h-48 rounded-lg object-contain mb-3"
          />
        ) : (
          <p className="text-emerald-800">Drag & drop a photo here, or click to browse</p>
        )}
      </div>

      <button
        onClick={handleAnalyze}
        disabled={!file || status === 'loading'}
        className="mt-4 w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white
          transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
      >
        {status === 'loading' ? (
          <span className="inline-flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyzing photo…
          </span>
        ) : (
          'Analyze Photo'
        )}
      </button>

      {status === 'error' && (
        <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-rose-800 text-sm">
          {errorMessage}
        </div>
      )}

      {/* Results */}
      {status === 'success' && result && (
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
            <div>
              <h3 className="text-lg font-bold text-emerald-900">{result.material_category}</h3>
              {result.specific_materials?.length > 0 && (
                <p className="text-sm text-emerald-700/80">
                  {result.specific_materials.join(' · ')}
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.bg} ${badge.text} ${badge.ring}`}
            >
              {result.confidence_score}% confidence
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-900 mb-1">Purity assessment</h4>
              <p className="text-sm text-emerald-700/90">{result.purity_assessment}</p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
              <h4 className="text-sm font-semibold text-emerald-900 mb-2">Hazard flags</h4>
              {result.hazard_flags?.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {result.hazard_flags.map((flag) => (
                    <span
                      key={flag}
                      className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-rose-200"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
                  ✓ No hazards detected
                </span>
              )}
            </div>
          </div>

          {/* Value calculator */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-emerald-100">
            <label className="block text-sm font-semibold text-emerald-900 mb-2">
              Quantity (kg) — pre-filled from the photo, adjust as needed
            </label>
            <input
              type="number"
              min="0"
              value={quantityKg}
              onChange={(e) => setQuantityKg(e.target.value)}
              className="w-full rounded-lg border border-emerald-200 px-3 py-2 text-emerald-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-emerald-700/80">Estimated Total Value</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ₹{totalValue.toLocaleString('en-IN')}
                </p>
                <p className="text-xs text-emerald-700/60">
                  ₹{result.market_value_inr}/kg × {parsedQuantity || 0} kg
                </p>
              </div>
              <div>
                <p className="text-sm text-emerald-700/80">CO₂ Impact</p>
                <p className="text-2xl font-bold text-emerald-900">
                  ≈ {totalCo2Saved} kg CO₂ saved
                </p>
                <p className="text-xs text-emerald-700/60">Rough estimate if recycled vs. landfilled</p>
              </div>
            </div>
          </div>

          {/* Price trend chart */}
          <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-emerald-100">
            <h4 className="text-sm font-semibold text-emerald-900 mb-1">6-Month Price Trend</h4>
            <p className="text-xs text-emerald-700/60 mb-3">
              Illustrative / estimated data — not a verified market feed.
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trendData}>
                <XAxis dataKey="month" stroke="#047857" fontSize={12} />
                <YAxis stroke="#047857" fontSize={12} width={40} />
                <Tooltip formatter={(v) => [`₹${v}/kg`, 'Est. value']} />
                <Line type="monotone" dataKey="value" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {recent.length > 0 && (
        <div className="mt-10">
          <h4 className="text-sm font-semibold text-emerald-900 mb-2">Recent Activity</h4>
          <ul className="space-y-2">
            {recent.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between rounded-lg bg-white px-4 py-2 text-sm shadow-sm ring-1 ring-emerald-100"
              >
                <span className="text-emerald-900">{entry.materialCategory}</span>
                <span className="text-emerald-700/70">
                  ₹{entry.marketValueInr}/kg · {entry.confidenceScore}% confidence
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}