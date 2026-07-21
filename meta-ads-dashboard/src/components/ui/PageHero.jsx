/* ============================================
   FARO — PageHero: premium hero band per page
   ============================================ */
export default function PageHero({ kicker, title, subtitle, actions, stats, align = 'left' }) {
  return (
    <header className={`page-hero page-hero--${align}`}>
      <div className="page-hero-bg" aria-hidden="true" />
      <div className="page-hero-inner">
        <div className="page-hero-head">
          <div className="page-hero-text">
            {kicker && <span className="page-hero-kicker">{kicker}</span>}
            <h1 className="page-hero-title font-display">{title}</h1>
            {subtitle && <p className="page-hero-sub">{subtitle}</p>}
          </div>
          {actions && <div className="page-hero-actions">{actions}</div>}
        </div>
        {stats && <div className="page-hero-stats">{stats}</div>}
      </div>
    </header>
  );
}

/** A single large stat cell for the hero band. */
export function HeroStat({ label, value, delta, deltaTone, icon }) {
  return (
    <div className="hero-stat">
      {icon && <div className="hero-stat-icon">{icon}</div>}
      <div className="hero-stat-body">
        <span className="hero-stat-label">{label}</span>
        <span className="hero-stat-value tnum">{value}</span>
        {delta != null && <span className={`hero-stat-delta hero-stat-delta--${deltaTone || 'neutral'}`}>{delta}</span>}
      </div>
    </div>
  );
}
