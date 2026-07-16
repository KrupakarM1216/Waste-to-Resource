import { timeAgo } from '../utils/recentActivity.js';

/**
 * Compact "Recent Activity" list rendered below a feature section.
 * Entries: { primary, secondary?, ts }. If onSelect is passed, rows
 * become clickable (used to refill the waste-description form).
 */
export default function RecentActivity({ title, items, onSelect }) {
  if (!items?.length) return null;

  return (
    <div className="mx-auto mt-10 max-w-3xl">
      <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest-500">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {title}
      </h4>
      <ul className="mt-3 divide-y divide-forest-100 overflow-hidden rounded-2xl border border-forest-100 bg-white">
        {items.map((item, i) => {
          const row = (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-forest-900">{item.primary}</p>
                {item.secondary && (
                  <p className="mt-0.5 truncate text-xs text-forest-800/60">{item.secondary}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-forest-800/50">{timeAgo(item.ts)}</span>
            </>
          );
          return (
            <li key={`${item.ts}-${i}`}>
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => onSelect(item)}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-forest-50"
                >
                  {row}
                </button>
              ) : (
                <div className="flex items-center gap-4 px-5 py-3.5">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
