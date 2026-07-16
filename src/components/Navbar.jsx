import { useEffect, useState } from 'react';
import Logo from './Logo.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // On the dark hero (not scrolled): light mint text on a subtle dark blur.
  // After scrolling (white bar): switch to dark forest text.
  const linkClass = scrolled
    ? 'text-forest-800 hover:text-forest-500'
    : 'text-forest-50 hover:text-emerald-300';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/90 shadow-sm backdrop-blur-md'
          : 'bg-forest-950/40 backdrop-blur-sm'
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <a
          href="#"
          className={`flex items-center gap-2.5 transition-colors ${
            scrolled ? 'text-forest-800 hover:text-forest-600' : 'text-white hover:text-emerald-200'
          }`}
        >
          <Logo className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight">EcoSync</span>
        </a>

        <div className="hidden items-center gap-8 text-sm font-semibold md:flex">
          <a href="#how-it-works" className={`transition-colors ${linkClass}`}>
            How It Works
          </a>
          <a href="#upload" className={`transition-colors ${linkClass}`}>
            AI Matching
          </a>
          <a href="#scrap-valuator" className={`transition-colors ${linkClass}`}>
            Scrap-to-Cash
          </a>
        </div>

        <a
          href="#upload"
          className={`rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            scrolled
              ? 'bg-forest-700 text-white hover:bg-forest-600'
              : 'bg-emerald-400 text-forest-950 hover:bg-emerald-300'
          }`}
        >
          Get Started
        </a>
      </nav>
    </header>
  );
}
