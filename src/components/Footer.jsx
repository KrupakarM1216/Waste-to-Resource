import Logo from './Logo.jsx';

export default function Footer() {
  return (
    <footer className="bg-forest-950 py-12 text-forest-300">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-8">
        <div className="flex items-center gap-2 text-emerald-400">
          <Logo className="h-7 w-7" />
          <span className="text-lg font-bold text-white">EcoSync</span>
        </div>

        <p className="text-sm">
          © {new Date().getFullYear()} EcoSync. Closing the loop on industrial waste.
        </p>

        <div className="flex gap-6 text-sm font-medium">
          <a href="#" className="transition-colors hover:text-white">Privacy</a>
          <a href="#" className="transition-colors hover:text-white">Terms</a>
          <a href="#" className="transition-colors hover:text-white">Contact</a>
        </div>
      </div>
    </footer>
  );
}
