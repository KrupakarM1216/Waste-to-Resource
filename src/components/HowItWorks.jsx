const steps = [
  {
    number: '01',
    title: 'Describe Your Waste',
    body: 'Tell us about your industrial by-products in plain English — no material science degree required.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z"
        />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'AI Categorizes & Scores',
    body: 'Our model classifies the material, estimates its market value, and computes a compatibility score.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
        />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Match & Trade Locally',
    body: 'Get connected with vetted local buyers who need your material as their raw input. Close the loop.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244"
        />
      </svg>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative overflow-hidden bg-white py-24">
      {/* Subtle radial accents to lift the flat white background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-10 h-96 w-96 rounded-full bg-forest-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-0 h-80 w-80 rounded-full bg-earth-100/70 blur-3xl"
      />
      <div className="relative mx-auto w-full max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-forest-500">
            How It Works
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-forest-900 sm:text-4xl">
            From liability to asset in three steps
          </h2>
        </div>

        <div className="mt-16 grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group relative min-w-0 rounded-2xl border border-forest-100 bg-forest-50/50 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-forest-200 hover:bg-white hover:shadow-card-hover sm:p-8"
            >
              <span className="absolute right-6 top-6 text-5xl font-extrabold text-forest-100 transition-colors duration-300 group-hover:text-forest-200">
                {step.number}
              </span>
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-forest-700 text-emerald-300 shadow-sm transition-transform duration-300 group-hover:scale-110">
                {step.icon}
              </div>
              <h3 className="mt-6 text-xl font-bold text-forest-900">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-forest-800/70">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
