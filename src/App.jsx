import { useEffect, useRef, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Hero from './components/Hero.jsx';
import HowItWorks from './components/HowItWorks.jsx';
import UploadDashboard from './components/UploadDashboard.jsx';
import ResultsDashboard from './components/ResultsDashboard.jsx';
import ScrapValuator from './components/ScrapValuator.jsx';
import Footer from './components/Footer.jsx';
import { analyzeWaste } from './services/api.js';

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [apiError, setApiError] = useState('');
  const [lastDescription, setLastDescription] = useState('');
  const resultsRef = useRef(null);

  const scrollToUpload = () => {
    document.getElementById('upload')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAnalyze = async (description) => {
    setIsLoading(true);
    setApiError('');
    setResults(null);
    setLastDescription(description);
    try {
      const data = await analyzeWaste(description);
      setResults(data);
    } catch (err) {
      setApiError(
        err.message === 'Failed to fetch'
          ? "We couldn't reach the EcoSync matching service. Please check that the backend is running on port 8080 and try again."
          : err.message || 'Something went wrong on our side. Please try again in a moment.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    scrollToUpload();
  };

  // Scroll to results once they render.
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [results]);

  return (
    <div className="min-h-screen font-sans">
      <Navbar />

      <main>
        <Hero onCtaClick={scrollToUpload} />
        <HowItWorks />
        <UploadDashboard onAnalyze={handleAnalyze} isLoading={isLoading} />

        {apiError && (
          <div className="mx-auto max-w-3xl px-6 pb-12">
            <div
              role="alert"
              className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4 text-center font-medium text-red-700"
            >
              {apiError}
            </div>
          </div>
        )}

        <div ref={resultsRef} className="scroll-mt-24">
          <ResultsDashboard results={results} onReset={handleReset} description={lastDescription} />
        </div>

        <ScrapValuator />
      </main>

      <Footer />
    </div>
  );
}
