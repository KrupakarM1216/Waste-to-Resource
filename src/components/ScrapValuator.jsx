import { useCallback, useRef, useState } from 'react';
import PriceTrendChart from './PriceTrendChart.jsx';
import RecentActivity from './RecentActivity.jsx';
import { co2FactorFor } from '../utils/co2.js';
import { addRecent, getRecent } from '../utils/recentActivity.js';

const API_URL = 'http://localhost:8080/api/evaluate-scrap';

const formatINR = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

/* ------------------------------------------------------------------ */
/* Icons                                                              */
/* ------------------------------------------------------------------ */

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-10 w-10" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
    />
  </svg>
);

const Spinner = () => (
  <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/* ------------------------------------------------------------------ */
/* Confidence badge — green >70, amber 40–70, red <40                 */
/* ------------------------------------------------------------------ */

function ConfidenceBadge({ score }) {
  const tone =
    score > 70
      ? 'bg-emerald-100 text-emerald-800'
      : score >= 40
        ? 'bg-amber-100 text-amber-800'
        : 'bg-red-100 text-red-700';
  const label = score > 70 ? 'High' : score >= 40 ? 'Medium' : 'Low';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${tone}`}
      title={`Model confidence: ${label}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}%
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Result data card                                                   */
/* ------------------------------------------------------------------ */

function DataCard({ label, value, sub, icon, delay, badge }) {
  return (
    <div
      className="animate-fade-up rounded-2xl border border-forest-100 bg-white p-6 text-center shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-forest-700 text-emerald-300">
        {icon}
      </div>
      <p className="mt-4 text-xs font-bold uppercase tracking-widest text-forest-500">{label}</p>
      <div className="mt-1.5 flex items-center justify-center gap-2">
        <p className="text-2xl font-extrabold tracking-tight text-forest-900">{value}</p>
        {badge}
      </div>
      {sub && <p className="mt-1 text-sm text-forest-800/60">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Total value + CO₂ calculator                                       */
/* ------------------------------------------------------------------ */

function ValueCalculator({ material, pricePerKg }) {
  const [quantity, setQuantity] = useState('');

  const qty = parseFloat(quantity);
  const hasQty = !Number.isNaN(qty) && qty > 0;
  const totalValue = hasQty ? Math.round(qty * pricePerKg) : 0;
  const co2Saved = hasQty ? Math.round(qty * co2FactorFor(material) * 10) / 10 : 0;

  return (
    <div className="animate-fade-up rounded-2xl border border-forest-100 bg-gradient-to-br from-forest-50 to-white p-6 shadow-card sm:p-8" style={{ animationDelay: '360ms' }}>
      <label htmlFor="scrap-quantity" className="block text-sm font-semibold text-forest-900">
        How much do you have? (kg)
      </label>
      <div className="mt-3 flex items-center gap-3">
        <input
          id="scrap-quantity"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="e.g. 250"
          className="w-40 rounded-xl border border-forest-200 bg-white px-4 py-3 text-forest-900 placeholder:text-forest-400 transition-shadow focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-500/10"
        />
        <span className="text-sm font-medium text-forest-800/60">
          × {formatINR(pricePerKg)}/kg
        </span>
      </div>

      {hasQty && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-forest-800 px-6 py-5 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-forest-200">
              Estimated Total Value
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-emerald-300 sm:text-4xl">
              {formatINR(totalValue)}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
              Environmental Impact
            </p>
            <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-800 sm:text-3xl">
              ≈ {co2Saved.toLocaleString('en-IN')} kg CO₂ saved
            </p>
            <p className="mt-1 text-xs text-emerald-700/70">
              Rough estimate vs. virgin production
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ScrapValuator                                                      */
/* ------------------------------------------------------------------ */

export default function ScrapValuator() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState(() => getRecent('valuation'));
  const inputRef = useRef(null);

  const acceptFile = useCallback((selected) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }
    setError('');
    setResult(null);
    setFile(selected);
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(selected);
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = async () => {
    if (!file || isLoading) return;
    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(API_URL, { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || `Valuation failed (${res.status})`);
      }
      setResult(data);
      setRecent(
        addRecent('valuation', {
          primary: data.material,
          secondary: `${formatINR(data.market_value_inr)}/kg · ${data.confidence_score}% confidence`,
        })
      );
    } catch (err) {
      setError(
        err.message === 'Failed to fetch'
          ? "We couldn't reach the EcoSync valuation service. Please check that the backend is running on port 8080 and try again."
          : err.message
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <section id="scrap-valuator" className="relative scroll-mt-20 overflow-hidden bg-white py-24">
      {/* Subtle background accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-96 w-96 rounded-full bg-emerald-50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-16 h-80 w-80 rounded-full bg-earth-100/60 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-forest-500">
            Scrap-to-Cash
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-forest-900 sm:text-4xl">
            Snap a photo. Know its worth.
          </h2>
          <p className="mt-4 text-lg text-forest-800/70">
            Upload a picture of your scrap and our AI vision engine identifies the
            material and estimates its market value in ₹ per kg.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          {/* Upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-10 text-center transition-all duration-200 ${
              isDragging
                ? 'border-forest-500 bg-forest-50 scale-[1.01]'
                : 'border-forest-200 bg-forest-50/50 hover:border-forest-400 hover:bg-forest-50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            {preview ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center sm:gap-6">
                <img
                  src={preview}
                  alt="Selected scrap"
                  className="h-36 w-36 rounded-2xl border border-forest-200 object-cover shadow-sm"
                />
                <div className="text-left">
                  <p className="font-semibold text-forest-900">{file?.name}</p>
                  <p className="mt-0.5 text-sm text-forest-800/60">
                    {(file?.size / 1024).toFixed(0)} KB — click or drop to replace
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-forest-500">
                <UploadIcon />
                <p className="text-base font-semibold text-forest-800">
                  Drag &amp; drop your scrap photo here
                </p>
                <p className="text-sm text-forest-800/60">
                  or <span className="font-semibold text-forest-600 underline underline-offset-2">browse files</span> — JPEG, PNG, WebP up to 10 MB
                </p>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-700">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={handleSubmit}
              disabled={!file || isLoading}
              className="inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-forest-700 px-8 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-forest-600 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Spinner />
                  Analyzing Material…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
                    <path d="M12 2.25a.75.75 0 01.75.75v.756a49.106 49.106 0 019.152 1 .75.75 0 01-.152 1.485h-1.918l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 0118.75 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84l2.474-10.124H12.75v13.28c1.293.076 2.534.343 3.697.776a.75.75 0 01-.262 1.453h-8.37a.75.75 0 01-.262-1.453c1.162-.433 2.404-.7 3.697-.775V6.24H6.332l2.474 10.124a.75.75 0 01-.375.84A6.723 6.723 0 015.25 18a6.723 6.723 0 01-3.181-.795.75.75 0 01-.375-.84L4.168 6.241H2.25a.75.75 0 01-.152-1.485 49.105 49.105 0 019.152-1V3a.75.75 0 01.75-.75z" />
                  </svg>
                  Evaluate Worth (AI)
                </>
              )}
            </button>

            {(file || result) && !isLoading && (
              <button
                onClick={handleReset}
                className="text-sm font-semibold text-forest-600 underline-offset-4 transition-colors hover:text-forest-500 hover:underline"
              >
                Start over
              </button>
            )}
          </div>

          {/* Results */}
          {result && (
            <div className="mt-12 space-y-8">
              <div>
                <h3 className="text-center text-sm font-bold uppercase tracking-widest text-forest-500">
                  AI Valuation Report
                </h3>
                <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <DataCard
                    label="Material"
                    value={result.material}
                    badge={<ConfidenceBadge score={result.confidence_score} />}
                    sub="Identified from photo"
                    delay={0}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                        />
                      </svg>
                    }
                  />
                  <DataCard
                    label="Estimated Value"
                    value={`${formatINR(result.market_value_inr)}`}
                    sub="per kg (market est.)"
                    delay={120}
                    icon={
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 8.25H9m6 3H9m3 6l-3-3h1.5a3 3 0 100-6M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  />
                </div>
              </div>

              {/* Total value + CO₂ calculator */}
              <ValueCalculator
                material={result.material}
                pricePerKg={result.market_value_inr}
              />

              {/* Illustrative price trend */}
              <PriceTrendChart
                material={result.material}
                currentValue={result.market_value_inr}
              />

              <p className="text-center text-xs text-forest-800/50">
                Estimates are AI-generated from a single photo and may vary from actual market prices.
              </p>
            </div>
          )}

          {/* Recent valuations (localStorage) */}
          <RecentActivity title="Recent Valuations" items={recent} />
        </div>
      </div>
    </section>
  );
}
