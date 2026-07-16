const stats = [
  { value: '2,400+', label: 'Businesses Connected' },
  { value: '38k t', label: 'Waste Diverted' },
  { value: '$12M+', label: 'Value Recovered' },
];

/**
 * Decorative concentric rings — echoes the circular-economy loop motif.
 * Purely ornamental (aria-hidden), kept at low opacity so hero text
 * stays comfortably above WCAG contrast.
 */
const CircularRings = ({ className }) => (
  <svg viewBox="0 0 400 400" fill="none" className={className} aria-hidden="true">
    {[190, 150, 110, 70].map((r) => (
      <circle
        key={r}
        cx="200"
        cy="200"
        r={r}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray={r > 120 ? '6 10' : 'none'}
      />
    ))}
    <circle cx="200" cy="10" r="5" fill="currentColor" />
    <circle cx="330" cy="290" r="4" fill="currentColor" />
    <circle cx="90" cy="320" r="3" fill="currentColor" />
  </svg>
);

export default function Hero({ onCtaClick }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-forest-900 via-forest-800 to-forest-700 pb-32 pt-36 text-white lg:pb-40 lg:pt-44">
      {/* --- Background layers (all decorative) --- */}
      {/* Soft color orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-16 h-96 w-96 rounded-full bg-forest-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-earth-400/10 blur-3xl"
      />
      {/* Circular-economy ring motifs */}
      <CircularRings className="pointer-events-none absolute -right-28 -top-28 h-[26rem] w-[26rem] text-emerald-300/15" />
      <CircularRings className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 text-forest-300/10" />
      {/* Fine dot grid for texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: 'radial-gradient(rgba(220, 235, 224, 0.6) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-forest-400/40 bg-forest-800/60 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-forest-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Circular Economy, Powered by AI
          </span>

          <h1 className="text-balance text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Turn Industrial Waste into{' '}
            <span className="bg-gradient-to-r from-emerald-300 to-earth-200 bg-clip-text text-transparent">
              Raw Value
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-forest-100/90">
            EcoSync's AI engine analyzes your by-products in plain English and instantly
            matches them with local businesses ready to buy — turning disposal costs
            into revenue streams.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              onClick={onCtaClick}
              className="group inline-flex items-center gap-2 rounded-full bg-emerald-400 px-8 py-4 text-base font-bold text-forest-950 shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-300 hover:shadow-xl hover:shadow-emerald-400/30"
            >
              List By-Product
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a.75.75 0 0 1 .75.75v10.638l3.96-4.158a.75.75 0 1 1 1.08 1.04l-5.25 5.5a.75.75 0 0 1-1.08 0l-5.25-5.5a.75.75 0 1 1 1.08-1.04l3.96 4.158V3.75A.75.75 0 0 1 10 3Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <a
              href="#how-it-works"
              className="rounded-full border border-forest-300/40 px-8 py-4 text-base font-semibold text-forest-100 transition-all duration-200 hover:border-forest-200 hover:bg-white/5"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <dl className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-forest-900/40 px-6 py-6 text-center">
              <dt className="order-2 mt-1 text-sm font-medium text-forest-200">{stat.label}</dt>
              <dd className="order-1 text-3xl font-extrabold tracking-tight text-white">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Wave divider into the white section below */}
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="absolute bottom-0 left-0 h-12 w-full text-white sm:h-16"
        aria-hidden="true"
      >
        <path
          d="M0 80h1440V28c-120 24-280 38-480 30S620 22 420 24 120 46 0 40v40Z"
          fill="currentColor"
        />
      </svg>
    </section>
  );
}
