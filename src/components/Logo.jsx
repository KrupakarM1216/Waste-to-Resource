/**
 * EcoSync logo — a circular recycling loop (two chasing arrows) wrapped
 * around a leaf, drawn geometrically in the brand palette.
 *
 * The loop inherits `currentColor` so it adapts to light/dark contexts;
 * the leaf stays brand-mint for a consistent two-tone mark.
 */
export default function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      {/* Upper arc: sweeps clockwise from the left up over the top */}
      <path
        d="M8.2 30.5A17 17 0 0 1 35 11.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Arrowhead for the upper arc */}
      <path d="M33.2 4.6 36.3 12.4 28.2 13.7" fill="currentColor" />

      {/* Lower arc: sweeps clockwise from the right down under the bottom */}
      <path
        d="M39.8 17.5A17 17 0 0 1 13 36.5"
        stroke="currentColor"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      {/* Arrowhead for the lower arc */}
      <path d="M14.8 43.4 11.7 35.6 19.8 34.3" fill="currentColor" />

      {/* Leaf at the center — stem curves up into a filled blade */}
      <path
        d="M24 33c-1-6.5 1.5-11.5 8.5-14.5.8 8.6-2.3 13.3-8.5 14.5Z"
        fill="#34d399"
      />
      <path
        d="M24 33c-.2-5 1.6-9.4 5.6-12.6"
        stroke="#0a1a13"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.35"
      />
      <path
        d="M24 33c-3.8-1.6-5.8-4.4-6-8.5 4.3.6 6.4 3.3 6 8.5Z"
        fill="#5f9c7b"
      />
    </svg>
  );
}
