import { useState } from 'react';
import RecentActivity from './RecentActivity.jsx';
import { addRecent, getRecent } from '../utils/recentActivity.js';

const Spinner = () => (
  <svg
    className="h-5 w-5 animate-spin text-white"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-90"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
    <path d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
  </svg>
);

const EXAMPLES = [
  'Plastic offcuts from injection molding, ~2 tonnes/week',
  'Aluminum shavings from CNC machining',
  'Spent grain from our brewery, 500 kg daily',
];

export default function UploadDashboard({ onAnalyze, isLoading }) {
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [recent, setRecent] = useState(() => getRecent('match'));

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = description.trim();
    if (trimmed.length < 10) {
      setError('Please describe your waste in a bit more detail (at least 10 characters).');
      return;
    }
    setError('');
    setRecent(addRecent('match', { primary: trimmed }));
    onAnalyze(trimmed);
  };

  return (
    <section id="upload" className="bg-forest-50 py-24 scroll-mt-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-forest-500">
            AI Waste Analyzer
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-forest-900 sm:text-4xl">
            List your by-product
          </h2>
          <p className="mt-4 text-lg text-forest-800/70">
            Describe your industrial waste in plain English. Our AI does the rest.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-12 max-w-3xl rounded-3xl border border-forest-100 bg-white p-8 shadow-card sm:p-10"
        >
          <label
            htmlFor="waste-description"
            className="block text-sm font-semibold text-forest-900"
          >
            Waste description
          </label>
          <textarea
            id="waste-description"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={isLoading}
            placeholder="e.g. We produce about 3 tonnes of HDPE plastic trimmings per week from our packaging line. Clean, single-polymer, baled on-site…"
            className="mt-3 w-full resize-none rounded-xl border border-forest-200 bg-forest-50/50 px-4 py-3.5 text-forest-900 placeholder:text-forest-400 transition-shadow focus:border-forest-500 focus:outline-none focus:ring-4 focus:ring-forest-500/10 disabled:opacity-60"
          />

          {error && (
            <p role="alert" className="mt-2 text-sm font-medium text-red-600">
              {error}
            </p>
          )}

          {/* Quick-fill examples */}
          <div className="mt-4 flex flex-wrap gap-2">
            {EXAMPLES.map((example) => (
              <button
                key={example}
                type="button"
                disabled={isLoading}
                onClick={() => setDescription(example)}
                className="rounded-full border border-forest-200 bg-white px-3.5 py-1.5 text-xs font-medium text-forest-700 transition-all hover:border-forest-400 hover:bg-forest-50 disabled:opacity-50"
              >
                {example}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-8 inline-flex w-full items-center justify-center gap-2.5 rounded-xl bg-forest-700 px-6 py-4 text-base font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-forest-600 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
          >
            {isLoading ? (
              <>
                <Spinner />
                Analyzing material…
              </>
            ) : (
              <>
                <SparkleIcon />
                Analyze &amp; Match (AI)
              </>
            )}
          </button>
        </form>

        {/* Recent submissions (localStorage) — click to reuse */}
        <RecentActivity
          title="Recent Submissions"
          items={recent}
          onSelect={(item) => {
            setDescription(item.primary);
            setError('');
          }}
        />
      </div>
    </section>
  );
}
