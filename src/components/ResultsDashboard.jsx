import { useEffect, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Match score ring — animates from 0 to the target score             */
/* ------------------------------------------------------------------ */

function ScoreRing({ score }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let frame;
    const start = performance.now();
    const duration = 1200;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - displayed / 100);

  return (
    <div className="relative h-36 w-36">
      <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90">
        <circle cx="64" cy="64" r={radius} fill="none" stroke="#dcebe0" strokeWidth="10" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          fill="none"
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#2d6a4f" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-extrabold text-forest-900">{displayed}%</span>
        <span className="text-xs font-semibold uppercase tracking-wider text-forest-500">
          Match Score
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Business match card                                                */
/* ------------------------------------------------------------------ */

const demandStyles = {
  High: 'bg-emerald-100 text-emerald-800',
  Medium: 'bg-amber-100 text-amber-800',
  Low: 'bg-stone-100 text-stone-700',
};

// Placeholder number — replace with each buyer's real WhatsApp number.
const QUOTE_WHATSAPP_NUMBER = '8147379588';

function buildQuoteLink(business, materialType, description) {
  const message =
    `Hello ${business.name}, I found you on EcoSync.\n\n` +
    `I have *${materialType}* available and would like a quote.\n` +
    (description ? `Details: ${description}\n` : '') +
    `Quantity: ___ kg (please advise minimums)\n\n` +
    `Looking forward to your offer!`;
  return `https://wa.me/${QUOTE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

function BusinessCard({ business, index, materialType, description }) {
  return (
    <div
      className="group animate-fade-up rounded-2xl border border-forest-100 bg-white p-6 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-forest-300 hover:shadow-card-hover"
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-forest-600 to-forest-800 text-sm font-bold text-emerald-200 shadow-sm">
          {business.initials}
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            demandStyles[business.demand] ?? demandStyles.Low
          }`}
        >
          {business.demand} Demand
        </span>
      </div>

      <h4 className="mt-5 text-lg font-bold text-forest-900 transition-colors group-hover:text-forest-600">
        {business.name}
      </h4>
      <p className="text-sm font-medium text-forest-500">{business.type}</p>

      <dl className="mt-5 space-y-2.5 border-t border-forest-100 pt-5 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-forest-800/60">Distance</dt>
          <dd className="font-semibold text-forest-900">{business.distance}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-forest-800/60">Capacity</dt>
          <dd className="font-semibold text-forest-900">{business.capacity}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-forest-800/60">Rating</dt>
          <dd className="flex items-center gap-1 font-semibold text-forest-900">
            <svg viewBox="0 0 20 20" fill="#f59e0b" className="h-4 w-4" aria-hidden="true">
              <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
            </svg>
            {business.rating}
          </dd>
        </div>
      </dl>

      <a
        href={buildQuoteLink(business, materialType, description)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-forest-700 py-2.5 text-sm font-bold text-forest-700 transition-all duration-200 hover:bg-forest-700 hover:text-white"
      >
        <WhatsAppIcon />
        Request Quote
      </a>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Results dashboard                                                  */
/* ------------------------------------------------------------------ */

export default function ResultsDashboard({ results, onReset, description }) {
  if (!results) return null;

  const { matchScore, materialType, matches } = results;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Summary panel */}
        <div className="animate-scale-in mx-auto max-w-4xl overflow-hidden rounded-3xl border border-forest-100 bg-gradient-to-br from-forest-50 to-white shadow-card">
          <div className="flex flex-col items-center gap-8 p-8 sm:flex-row sm:gap-12 sm:p-12">
            <ScoreRing score={matchScore} />

            <div className="flex-1 text-center sm:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3.5 py-1 text-xs font-bold uppercase tracking-wide text-emerald-800">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                    clipRule="evenodd"
                  />
                </svg>
                Analysis Complete
              </span>
              <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-forest-900 sm:text-3xl">
                {materialType}
              </h3>
              <p className="mt-3 leading-relaxed text-forest-800/70">
                Our AI identified strong local demand for this material. Here are your
                top {matches.length} verified buyer matches, ranked by compatibility,
                proximity, and capacity.
              </p>
              <button
                onClick={onReset}
                className="mt-5 text-sm font-semibold text-forest-600 underline-offset-4 transition-colors hover:text-forest-500 hover:underline"
              >
                ← Analyze a different material
              </button>
            </div>
          </div>
        </div>

        {/* Match cards */}
        <div className="mx-auto mt-12 max-w-5xl">
          <h3 className="text-center text-sm font-bold uppercase tracking-widest text-forest-500">
            Matched Local Businesses
          </h3>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.map((business, index) => (
              <BusinessCard
                key={business.id}
                business={business}
                index={index}
                materialType={materialType}
                description={description}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
