/* ============================================
   FARO — Brand mark
   A beacon: lamp + projected beam of light. Scales crisp from 16px favicon
   to the splash hero. Palette: #199BE4 → #4CCCF4 gradient on white glyph.
   ============================================ */

let _uid = 0;

/** The beacon glyph inside a rounded gradient tile. */
export function FaroMark({ size = 32, radius = 0.25, glow = false, className = '' }) {
  const gid = `faro-g-${++_uid}`;
  const r = Math.round(size * radius);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      style={glow ? { filter: 'drop-shadow(0 0 14px rgba(25,155,228,0.5))' } : undefined}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#199BE4" />
          <stop offset="100%" stopColor="#4CCCF4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx={r * (32 / size)} fill={`url(#${gid})`} />
      {/* projected beam */}
      <path d="M16 12 L27 5.5 L27 9 L16 14 Z" fill="white" opacity="0.55" />
      <path d="M16 12 L27 18.5 L27 15 L16 10 Z" fill="white" opacity="0.28" />
      {/* lamp */}
      <circle cx="13" cy="12" r="3.4" fill="white" />
      {/* tower */}
      <path d="M11 15 L15 15 L16.4 26 L9.6 26 Z" fill="white" />
    </svg>
  );
}

/** Full lockup: mark + "Faro" wordmark. */
export default function FaroLogo({ size = 30, showWord = true, wordSize, glow = false, muted = false }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.34 }}>
      <FaroMark size={size} glow={glow} />
      {showWord && (
        <span
          className="font-display"
          style={{
            fontSize: wordSize || size * 0.72,
            fontWeight: 600,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            color: muted ? 'var(--text-primary)' : undefined,
            background: muted ? undefined : 'var(--gradient-accent)',
            WebkitBackgroundClip: muted ? undefined : 'text',
            backgroundClip: muted ? undefined : 'text',
            WebkitTextFillColor: muted ? undefined : 'transparent',
          }}
        >
          Faro
        </span>
      )}
    </span>
  );
}
