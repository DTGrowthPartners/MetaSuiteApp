import { useState, useEffect, useCallback, useRef } from 'react';
import CreativeBuilder from './components/CreativeBuilder';
import AccountDashboard from './components/AccountDashboard';
import CampaignReport from './components/CampaignReport';
import AudienceCreator from './components/AudienceCreator';
import MetaAdsService from './services/metaAdsApi';
import { LogOut, Loader2, BarChart3 } from 'lucide-react';
import tr from './translations';
import './App.css';

// ============================================
// PARTICLE BACKGROUND - Reusable canvas
// ============================================
function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    };
    resize();
    window.addEventListener('resize', resize);

    const particles = [];
    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        r: Math.random() * 2 + 0.3,
        opacity: Math.random() * 0.5 + 0.05
      });
    }

    let rafId;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 159, 255, ${p.opacity})`;
        ctx.fill();
      });
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(74, 159, 255, ${0.06 * (1 - dist / 140)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="particle-bg" />;
}

// ============================================
// SPLASH SCREEN - Animated loading
// ============================================
function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onFinish(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div className={`splash-screen splash-${phase}`}>
      <ParticleBackground />
      <div className="splash-content">
        <div className="splash-logo-wrapper">
          <div className="splash-glow" />
          <img
            src="/DT-GROWTH-LOGO-DYCI6Arf.png"
            alt="DT Growth Partners"
            className="splash-logo"
          />
        </div>
        <div className="splash-bar-track">
          <div className="splash-bar-fill" />
        </div>
        <p className="splash-tagline">Faro DT</p>
      </div>
    </div>
  );
}

// ============================================
// LOGIN SCREEN - Facebook Login
// ============================================
function LoginScreen({ onLogin, lang, setLang }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fbReady, setFbReady] = useState(false);

  // Wait for FB SDK to be ready
  useEffect(() => {
    const checkFB = () => {
      if (window.FB) {
        setFbReady(true);
        return;
      }
      // Keep checking every 500ms
      const interval = setInterval(() => {
        if (window.FB) {
          setFbReady(true);
          clearInterval(interval);
        }
      }, 500);
      // Stop after 10s
      setTimeout(() => clearInterval(interval), 10000);
    };
    checkFB();
  }, []);

  const handleFacebookLogin = () => {
    setLoading(true);
    setError('');

    if (!window.FB) {
      setError('Facebook SDK no cargado. Recarga la página.');
      setLoading(false);
      return;
    }

    window.FB.login((response) => {
      if (response.authResponse) {
        const token = response.authResponse.accessToken;
        // Verify token works by checking /me
        window.FB.api('/me', { fields: 'name,picture' }, (userInfo) => {
          onLogin(token, {
            name: userInfo?.name || 'Usuario',
            picture: userInfo?.picture?.data?.url || null,
            userId: response.authResponse.userID
          });
        });
      } else {
        setError('Login cancelado');
      }
      setLoading(false);
    }, {
      scope: 'ads_management,pages_show_list,business_management,pages_read_engagement,ads_read,whatsapp_business_management,instagram_basic,leads_retrieval,pages_manage_ads'
    });
  };

  return (
    <div className="login-screen">
      {/* Animated background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6.75 7.5 L2.25 4.5" stroke="url(#g1)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M17.25 7.5 L21.75 4.5" stroke="url(#g1)" strokeWidth="1.2" strokeLinecap="round" />
              <path d="M9 6.75 L15 6.75 L12 3 Z" fill="url(#g1)" />
              <rect x="9.75" y="6.75" width="4.5" height="2.6" fill="url(#g1)" />
              <path d="M10.1 9.4 L13.9 9.4 L15.75 20.25 L8.25 20.25 Z" fill="url(#g1)" />
              <defs><linearGradient id="g1" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#4A9FFF"/><stop offset="1" stopColor="#7C5CFC"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className="login-title">Faro DT</h1>
          <span className="login-brand">by DT Growth Partners</span>
        </div>
        <p className="login-subtitle">{tr('login_subtitle', lang)}</p>

        {/* Facebook Login Button */}
        <button
          onClick={handleFacebookLogin}
          disabled={loading || !fbReady}
          className="login-fb-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {loading ? tr('login_connecting', lang) : tr('login_button', lang)}
        </button>

        {/* Language Switch — positioned at bottom of card */}
        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0, display: 'flex', justifyContent: 'center' }}>
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '12px', fontWeight: 500, padding: '4px 8px' }}>
            {lang === 'es' ? '🇺🇸 English' : '🇨🇴 Español'}
          </button>
        </div>

        {/* Error */}
        {error && <div className="login-error">{error}</div>}
      </div>
    </div>
  );
}

// ============================================
// MAIN APP
// ============================================
function App() {
  const [lang, setLang] = useState('es');
  const [showSplash, setShowSplash] = useState(true);

  // Detectar si es una ruta de reporte (ej: /eq-cartagena)
  const pathname = window.location.pathname;

  // Legal pages — cargar desde el servidor y renderizar
  const legalPages = ['/privacy', '/terms', '/data-deletion'];
  const isLegalPage = legalPages.includes(pathname);
  const [legalHtml, setLegalHtml] = useState(null);
  useEffect(() => {
    if (!isLegalPage) return;
    const apiBase = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';
    fetch(`${apiBase}${pathname.replace('/', '/legal/')}${window.location.search}`)
      .then(r => r.text())
      .then(html => setLegalHtml(html))
      .catch(() => setLegalHtml('<p>Error cargando la página</p>'));
  }, [isLegalPage, pathname]);
  if (isLegalPage) {
    if (!legalHtml) return <div style={{ background: '#0f172a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>Cargando...</div>;
    return <div dangerouslySetInnerHTML={{ __html: legalHtml }} />;
  }

  // /reportes = hub que lista todas las cuentas. /reportes/act_xxx también acepta.
  const isReportsHub = pathname === '/reportes' || pathname === '/reportes/';
  const reportSlug = !isReportsHub && pathname !== '/' && !pathname.startsWith('/assets') && !pathname.startsWith('/api')
    ? pathname.replace(/^\//, '').replace(/\/$/, '')
    : null;

  const [accessToken, setAccessToken] = useState(() => {
    return localStorage.getItem('meta_access_token') || null;
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('meta_user_name') || null;
  });
  const [userPicture, setUserPicture] = useState(() => {
    return localStorage.getItem('meta_user_picture') || null;
  });

  const [adAccounts, setAdAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState(null);

  // Hash-based routing: #dashboard, #audiences → different views
  const [page, setPage] = useState(() => {
    const hash = window.location.hash;
    if (hash === '#dashboard') return 'dashboard';
    if (hash === '#audiences') return 'audiences';
    return 'main';
  });
  useEffect(() => {
    const onHash = () => {
      const hash = window.location.hash;
      if (hash === '#dashboard') setPage('dashboard');
      else if (hash === '#audiences') setPage('audiences');
      else setPage('main');
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleLogin = useCallback((token, userInfo = {}) => {
    localStorage.setItem('meta_access_token', token);
    localStorage.setItem('meta_user_name', userInfo.name || 'Usuario');
    if (userInfo.picture) localStorage.setItem('meta_user_picture', userInfo.picture);
    setAccessToken(token);
    setUserName(userInfo.name || 'Usuario');
    setUserPicture(userInfo.picture || null);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('meta_access_token');
    localStorage.removeItem('meta_user_name');
    localStorage.removeItem('meta_user_picture');
    setAccessToken(null);
    setUserName(null);
    setUserPicture(null);
    setAdAccounts([]);
    setAccountsError(null);
    // Try FB logout too
    if (window.FB) {
      try { window.FB.logout(); } catch (e) { /* ignore */ }
    }
  }, []);

  // Load ad accounts when token changes
  useEffect(() => {
    if (!accessToken) {
      setLoadingAccounts(false);
      return;
    }

    const loadAdAccounts = async () => {
      setLoadingAccounts(true);
      setAccountsError(null);
      try {
        console.log('Loading ad accounts...');
        const metaService = new MetaAdsService(accessToken);
        const result = await metaService.getAllAdAccountsFromBusinesses();
        console.log('Ad accounts loaded:', result);
        setAdAccounts(result.adAccounts || []);
      } catch (err) {
        console.error('Error loading ad accounts:', err);
        setAccountsError(err.message || 'Error cargando cuentas');
      } finally {
        setLoadingAccounts(false);
      }
    };
    loadAdAccounts();
  }, [accessToken]);

  // Show splash screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // Show login if no token
  if (!accessToken) {
    return <LoginScreen onLogin={handleLogin} lang={lang} setLang={setLang} />;
  }

  return (
    <div className="app">
      <ParticleBackground />
      {/* Navigation Header */}
      <nav className="main-navigation">
        <div className="nav-brand">
          <img src="/DT-GROWTH-LOGO-DYCI6Arf.png" alt="DT Growth Partners" className="nav-logo-img" />
          <div className="nav-brand-text">
            <span className="nav-title">Faro DT</span>
          </div>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${page === 'main' && !reportSlug && !isReportsHub ? 'active' : ''}`}
            onClick={() => {
              if (window.location.pathname !== '/') { window.location.href = '/'; return; }
              window.location.hash = ''; setPage('main');
            }}
          >
            {tr('campaigns', lang)}
          </button>
          <button
            className={`nav-link ${page === 'audiences' && !reportSlug && !isReportsHub ? 'active' : ''}`}
            onClick={() => {
              if (window.location.pathname !== '/') { window.location.href = '/#audiences'; return; }
              window.location.hash = '#audiences'; setPage('audiences');
            }}
          >
            {tr('audiences', lang)}
          </button>
          <button
            className={`nav-link ${isReportsHub || reportSlug ? 'active' : ''}`}
            onClick={() => { window.location.href = '/reportes'; }}
          >
            <BarChart3 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />Reportes
          </button>
        </div>
        <div className="nav-info">
          {loadingAccounts ? (
            <span className="account-count"><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> {tr('loading', lang)}</span>
          ) : accountsError ? (
            <span className="account-count account-count--error">Error</span>
          ) : (
            <span className="account-count" title="Ad accounts loaded via business_management permission from all your Business Managers">
              {adAccounts.length} {tr('accounts_count', lang)}
              {(() => {
                const bmSet = new Set(adAccounts.map(a => a.business?.id).filter(Boolean));
                return bmSet.size > 0 ? ` · ${bmSet.size} ${tr('business_managers_count', lang)}` : '';
              })()}
            </span>
          )}

          {/* Language Switch */}
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
            {lang === 'es' ? '🇺🇸 EN' : '🇨🇴 ES'}
          </button>

          {/* User info + Logout */}
          <div className="nav-user">
            {userPicture && (
              <img
                src={userPicture}
                alt=""
                className="nav-user-avatar"
              />
            )}
            <span className="nav-user-name">
              {userName || 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              className="nav-logout-btn"
              title="Cerrar sesión y cambiar cuenta"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {isReportsHub ? (
          <ReportsHub adAccounts={adAccounts} loadingAccounts={loadingAccounts} accessToken={accessToken} />
        ) : reportSlug ? (
          <CampaignReport slug={reportSlug} accessToken={accessToken} adAccounts={adAccounts} loadingAccounts={loadingAccounts} lang={lang} />
        ) : page === 'dashboard' ? (
          <AccountDashboard
            adAccounts={adAccounts}
            onBack={() => { window.location.hash = ''; setPage('main'); }}
          />
        ) : page === 'audiences' ? (
          <AudienceCreator
            accessToken={accessToken}
            adAccounts={adAccounts}
            onBack={() => { window.location.hash = ''; setPage('main'); }}
          />
        ) : (
          <CreativeBuilder adAccounts={adAccounts} accessToken={accessToken} lang={lang} />
        )}
      </main>
    </div>
  );
}

// ============================================
// REPORTS HUB — tablero de decisión operativa
// ============================================
function ReportsHub({ adAccounts, loadingAccounts, accessToken }) {
  const [summary, setSummary] = useState({}); // { accountId: { yesterday, today, ok } }
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('urgent'); // urgent, review, healthy, inactive, all

  // Cargar resumen de todas las cuentas al montar
  useEffect(() => {
    if (loadingAccounts || !adAccounts?.length || !accessToken) return;
    setLoadingSummary(true);
    const apiBase = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';
    const ids = adAccounts.map(a => (a.id.startsWith('act_') ? a.id : 'act_' + a.id)).join(',');
    fetch(`${apiBase}/reports-summary?accountIds=${encodeURIComponent(ids)}&accessToken=${encodeURIComponent(accessToken)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const map = {};
          for (const item of json.data) map[item.accountId] = item;
          setSummary(map);
        }
      })
      .catch(err => console.error('reports-summary failed:', err))
      .finally(() => setLoadingSummary(false));
  }, [adAccounts, loadingAccounts, accessToken]);

  if (loadingAccounts) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Cargando cuentas...
      </div>
    );
  }

  if (!adAccounts?.length) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#94a3b8' }}>No hay cuentas publicitarias disponibles.</div>;
  }

  // Clasificar cada cuenta en urgent / review / healthy / inactive
  const classify = (s) => {
    if (!s || !s.ok) return 'inactive';
    const tSpend = s.today?.spend || 0, tResults = s.today?.results || 0;
    const ySpend = s.yesterday?.spend || 0, yResults = s.yesterday?.results || 0;
    if (tSpend === 0 && ySpend === 0) return 'inactive';
    // Urgente: gasto notable sin ningún resultado
    if (tSpend >= 15000 && tResults === 0) return 'urgent';
    if (ySpend >= 15000 && yResults === 0) return 'urgent';
    // Revisar: frenó gasto hoy aunque ayer corría, o caída brusca de resultados
    if (ySpend > 0 && tSpend === 0) return 'review';
    if (yResults > 0 && tResults === 0 && tSpend > 0) return 'review';
    // Revisar: CPA se disparó (>80% vs ayer)
    if (yResults > 0 && tResults > 0) {
      const yCPA = ySpend / yResults;
      const tCPA = tSpend / tResults;
      if (tCPA > yCPA * 1.8 && tSpend > 10000) return 'review';
    }
    return 'healthy';
  };

  const formatCOP = (v) => '$' + Math.round(v || 0).toLocaleString('es-CO');
  const formatPct = (cur, prev) => {
    if (!prev) return null;
    const pct = ((cur - prev) / prev) * 100;
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(0)}%`;
  };

  // Normalizar ID a act_
  const normId = (id) => id?.startsWith('act_') ? id : 'act_' + id;

  // Enriquecer cada cuenta con su status y summary
  const enriched = adAccounts.map(a => {
    const id = normId(a.id);
    const s = summary[id];
    return { ...a, normId: id, status: classify(s), summary: s };
  });

  // Totales globales
  const statusCounts = { urgent: 0, review: 0, healthy: 0, inactive: 0 };
  let totalSpendToday = 0, totalResultsToday = 0, totalSpendYesterday = 0, totalResultsYesterday = 0;
  for (const a of enriched) {
    statusCounts[a.status]++;
    if (a.summary?.ok) {
      totalSpendToday += a.summary.today?.spend || 0;
      totalResultsToday += a.summary.today?.results || 0;
      totalSpendYesterday += a.summary.yesterday?.spend || 0;
      totalResultsYesterday += a.summary.yesterday?.results || 0;
    }
  }

  // Filtrado por búsqueda + tab
  const filtered = enriched.filter(a => {
    if (filter !== 'all' && a.status !== filter) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (a.name || '').toLowerCase().includes(q)
      || (a.business?.name || '').toLowerCase().includes(q)
      || (a.id || '').toLowerCase().includes(q);
  });

  // Orden: urgent primero, luego por gasto hoy desc
  const ordered = [...filtered].sort((a, b) => {
    const rank = { urgent: 0, review: 1, healthy: 2, inactive: 3 };
    if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
    return (b.summary?.today?.spend || 0) - (a.summary?.today?.spend || 0);
  });

  const urgentAccounts = enriched.filter(a => a.status === 'urgent')
    .sort((a, b) => (b.summary?.today?.spend || 0) - (a.summary?.today?.spend || 0));

  const openReport = (acc) => {
    const name = encodeURIComponent(acc.name || acc.id);
    const business = encodeURIComponent(acc.business?.name || '');
    window.location.href = `/${acc.normId}?name=${name}&business=${business}`;
  };

  // ========== Sub-componentes inline ==========
  const STATUS_STYLES = {
    urgent:   { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)', label: 'URGENTE' },
    review:   { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', label: 'REVISAR' },
    healthy:  { color: '#4ade80', bg: 'rgba(34,197,94,0.12)', border: 'rgba(34,197,94,0.35)', label: 'SALUDABLE' },
    inactive: { color: '#94a3b8', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)', label: 'INACTIVA' }
  };

  const KpiTile = ({ icon, label, value, sub, color, onClick, active }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 180, textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
        background: active ? `${color}22` : 'rgba(15,23,42,0.6)',
        border: `1px solid ${active ? color : 'rgba(99,102,241,0.2)'}`,
        borderRadius: 14, padding: '16px 18px', color: '#e2e8f0',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#94a3b8' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{sub}</div>}
    </button>
  );

  const UrgencyCard = ({ acc }) => {
    const s = acc.summary;
    const y = s?.yesterday || {}, t = s?.today || {};
    const alerts = [];
    if ((t.spend || 0) >= 15000 && (t.results || 0) === 0) alerts.push(`Sin resultados hoy con ${formatCOP(t.spend)} gastados`);
    if ((y.spend || 0) >= 15000 && (y.results || 0) === 0) alerts.push(`Ayer: ${formatCOP(y.spend)} sin resultados`);
    if ((y.spend || 0) > 0 && (t.spend || 0) === 0) alerts.push('Gasto detenido hoy');
    if (y.results > 0 && t.results === 0 && t.spend > 0) alerts.push('Caída de resultados vs ayer');
    const pctSpend = formatPct(t.spend || 0, y.spend || 0);

    return (
      <div
        onClick={() => openReport(acc)}
        style={{
          cursor: 'pointer',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(15,23,42,0.9))',
          border: '1px solid rgba(239,68,68,0.35)', borderRadius: 14, padding: 16,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.7)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
            <div style={{ fontSize: 10, color: '#64748b' }}>{acc.business?.name || '—'}</div>
          </div>
          <span style={{ fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 999, background: 'rgba(239,68,68,0.2)', color: '#f87171' }}>URGENTE</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10, paddingTop: 10, borderTop: '1px solid rgba(99,102,241,0.15)' }}>
          <div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Ayer</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{formatCOP(y.spend || 0)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{y.results || 0} {y.label || 'resultados'}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>Hoy {pctSpend && <span style={{ color: (t.spend || 0) < (y.spend || 0) ? '#f87171' : '#4ade80' }}>· {pctSpend}</span>}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{formatCOP(t.spend || 0)}</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.results || 0} {t.label || 'resultados'}</div>
          </div>
        </div>
        {alerts.slice(0, 2).map((a, i) => (
          <div key={i} style={{ fontSize: 10, color: '#fca5a5', padding: '4px 8px', background: 'rgba(239,68,68,0.1)', borderRadius: 6, marginTop: 4 }}>
            ⚠ {a}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ padding: '24px 20px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0', margin: 0, marginBottom: 4 }}>
          <BarChart3 size={24} style={{ verticalAlign: 'middle', marginRight: 10, color: '#a5b4fc' }} />
          Reportes
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: 13 }}>
          Campaign performance data from all your Meta ad accounts (loaded via business_management and ads_read). Accounts that need attention today, sorted by urgency.
        </p>
      </div>

      {/* KPI bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <KpiTile
          icon={<span style={{ fontSize: 14 }}>🔴</span>}
          label="Cuentas urgentes" value={statusCounts.urgent}
          sub="Gasto sin resultados" color="#f87171"
          active={filter === 'urgent'} onClick={() => setFilter('urgent')}
        />
        <KpiTile
          icon={<span style={{ fontSize: 14 }}>🟡</span>}
          label="En observación" value={statusCounts.review}
          sub="Anomalías detectadas" color="#fbbf24"
          active={filter === 'review'} onClick={() => setFilter('review')}
        />
        <KpiTile
          icon={<span style={{ fontSize: 14 }}>🟢</span>}
          label="Saludables" value={statusCounts.healthy}
          sub="Dentro de parámetros" color="#4ade80"
          active={filter === 'healthy'} onClick={() => setFilter('healthy')}
        />
        <KpiTile
          icon={<span style={{ fontSize: 14 }}>⚫</span>}
          label="Sin gasto" value={statusCounts.inactive}
          sub="Sin operación" color="#94a3b8"
          active={filter === 'inactive'} onClick={() => setFilter('inactive')}
        />
      </div>

      {/* Totales portafolio */}
      <div style={{
        display: 'flex', gap: 24, marginBottom: 20, padding: '12px 18px',
        background: 'rgba(15,23,42,0.5)', borderRadius: 12, border: '1px solid rgba(99,102,241,0.15)',
        flexWrap: 'wrap'
      }}>
        <div>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gasto hoy (portafolio)</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
            {formatCOP(totalSpendToday)} <span style={{ fontSize: 11, color: formatPct(totalSpendToday, totalSpendYesterday)?.startsWith('-') ? '#f87171' : '#4ade80', fontWeight: 500 }}>{formatPct(totalSpendToday, totalSpendYesterday)}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Resultados hoy</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>
            {totalResultsToday} <span style={{ fontSize: 11, color: formatPct(totalResultsToday, totalResultsYesterday)?.startsWith('-') ? '#f87171' : '#4ade80', fontWeight: 500 }}>{formatPct(totalResultsToday, totalResultsYesterday)}</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Gasto ayer</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{formatCOP(totalSpendYesterday)}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>Cuentas con datos</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#e2e8f0' }}>{Object.values(summary).filter(s => s.ok).length} / {adAccounts.length}</div>
        </div>
        {loadingSummary && <div style={{ color: '#94a3b8', fontSize: 12, alignSelf: 'center' }}><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle' }} /> Cargando métricas...</div>}
      </div>

      {/* Urgencias Hoy — cards grandes */}
      {urgentAccounts.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#f87171', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            🔴 Urgencias Hoy <span style={{ color: '#64748b', fontSize: 12, fontWeight: 500 }}>· {urgentAccounts.length} cuentas requieren decisión</span>
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {urgentAccounts.slice(0, 9).map(acc => <UrgencyCard key={acc.normId} acc={acc} />)}
          </div>
        </div>
      )}

      {/* Buscador + tabs */}
      <div style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="🔍 Buscar cuenta o negocio..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 10,
            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 10, color: '#e2e8f0', fontSize: 13, outline: 'none'
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `Todas (${enriched.length})` },
            { key: 'urgent', label: `🔴 Urgentes (${statusCounts.urgent})` },
            { key: 'review', label: `🟡 Revisar (${statusCounts.review})` },
            { key: 'healthy', label: `🟢 Saludables (${statusCounts.healthy})` },
            { key: 'inactive', label: `⚫ Inactivas (${statusCounts.inactive})` }
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: filter === t.key ? 'rgba(99,102,241,0.25)' : 'rgba(15,23,42,0.6)',
                border: `1px solid ${filter === t.key ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.15)'}`,
                color: filter === t.key ? '#e2e8f0' : '#94a3b8'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla compacta de todas las cuentas */}
      <div style={{
        background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(99,102,241,0.15)',
        borderRadius: 12, overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1.6fr 90px 1fr 1fr 1fr 90px',
          padding: '10px 14px', background: 'rgba(15,23,42,0.8)',
          borderBottom: '1px solid rgba(99,102,241,0.15)',
          fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5
        }}>
          <div>Cuenta</div>
          <div>Estado</div>
          <div>Gasto ayer</div>
          <div>Gasto hoy</div>
          <div>Resultados hoy</div>
          <div style={{ textAlign: 'right' }}>Acción</div>
        </div>
        {ordered.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
            {loadingSummary ? 'Cargando datos de las cuentas...' : 'No hay cuentas en esta categoría.'}
          </div>
        ) : ordered.map(acc => {
          const s = acc.summary;
          const stStyle = STATUS_STYLES[acc.status];
          return (
            <div
              key={acc.normId}
              onClick={() => openReport(acc)}
              style={{
                display: 'grid', gridTemplateColumns: '1.6fr 90px 1fr 1fr 1fr 90px',
                padding: '12px 14px', cursor: 'pointer',
                borderBottom: '1px solid rgba(99,102,241,0.08)',
                fontSize: 12, color: '#e2e8f0', alignItems: 'center',
                transition: 'background 0.1s ease'
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{acc.name}</div>
                <div style={{ fontSize: 10, color: '#64748b' }}>{acc.business?.name || '—'}</div>
              </div>
              <div>
                <span style={{
                  fontSize: 9, fontWeight: 700, padding: '3px 7px', borderRadius: 999,
                  background: stStyle.bg, color: stStyle.color, border: `1px solid ${stStyle.border}`
                }}>{stStyle.label}</span>
              </div>
              <div style={{ color: '#cbd5e1' }}>{formatCOP(s?.yesterday?.spend || 0)}</div>
              <div style={{ color: '#cbd5e1' }}>
                {formatCOP(s?.today?.spend || 0)}
                {s?.yesterday?.spend > 0 && (
                  <span style={{ fontSize: 10, marginLeft: 6, color: (s.today?.spend || 0) < (s.yesterday?.spend || 0) ? '#f87171' : '#4ade80' }}>
                    {formatPct(s.today?.spend || 0, s.yesterday?.spend || 0)}
                  </span>
                )}
              </div>
              <div>
                <span style={{ fontWeight: 600, color: (s?.today?.results || 0) === 0 && (s?.today?.spend || 0) > 0 ? '#f87171' : '#e2e8f0' }}>
                  {s?.today?.results || 0}
                </span>
                <span style={{ fontSize: 10, color: '#64748b', marginLeft: 4 }}>{s?.today?.label || ''}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 11, color: '#a5b4fc', fontWeight: 600 }}>Ver →</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default App;
