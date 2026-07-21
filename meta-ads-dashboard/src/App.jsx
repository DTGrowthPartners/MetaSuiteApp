import { useState, useEffect, useCallback, useRef } from 'react';
import CreativeBuilder from './components/CreativeBuilder';
import AccountDashboard from './components/AccountDashboard';
import CampaignReport from './components/CampaignReport';
import AudienceCreator from './components/AudienceCreator';
import MetaAdsService from './services/metaAdsApi';
import { LogOut, Loader2, BarChart3, Megaphone, Users, Menu, X, TrendingUp, Target, Wallet, Database, Search } from 'lucide-react';
import FaroLogo, { FaroMark } from './components/ui/FaroLogo';
import PageHero, { HeroStat } from './components/ui/PageHero';
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
        ctx.fillStyle = `rgba(76, 204, 244, ${p.opacity})`;
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
            ctx.strokeStyle = `rgba(25, 155, 228, ${0.07 * (1 - dist / 140)})`;
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
          <FaroMark size={96} radius={0.28} glow className="splash-mark" />
        </div>
        <p className="splash-wordmark font-display">Faro</p>
        <div className="splash-bar-track">
          <div className="splash-bar-fill" />
        </div>
        <p className="splash-tagline">Meta Ads Command Center</p>
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
    <div className="login-split">
      {/* ===== Brand side ===== */}
      <aside className="login-brandside">
        <div className="login-bg-orb login-bg-orb-1" />
        <div className="login-bg-orb login-bg-orb-2" />
        <div className="login-brandside-inner">
          <FaroLogo size={40} glow />
          <div className="login-hero">
            <h1 className="login-hero-title font-display">Tu centro de comando<br />para Meta Ads</h1>
            <p className="login-hero-sub">
              Crea campañas, construye públicos y monitorea el rendimiento de todas tus cuentas — desde un solo lugar.
            </p>
          </div>
          <ul className="login-features">
            <li><span className="login-feat-ic"><Megaphone size={18} /></span> Constructor de campañas con plantillas</li>
            <li><span className="login-feat-ic"><Users size={18} /></span> Creación de públicos personalizados</li>
            <li><span className="login-feat-ic"><BarChart3 size={18} /></span> Reportes en vivo con alertas de urgencia</li>
          </ul>
          <div className="login-brand-foot">Faro · Meta Ads Command Center</div>
        </div>
      </aside>

      {/* ===== Auth side ===== */}
      <main className="login-authside">
        <div className="login-auth-card">
          <div className="login-auth-mark"><FaroMark size={52} radius={0.3} glow /></div>
          <h2 className="login-auth-title font-display">Inicia sesión</h2>
          <p className="login-auth-sub">{tr('login_subtitle', lang)}</p>

          <button onClick={handleFacebookLogin} disabled={loading || !fbReady} className="login-fb-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {loading ? tr('login_connecting', lang) : tr('login_button', lang)}
          </button>

          {error && <div className="login-error">{error}</div>}

          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="login-lang">
            {lang === 'es' ? '🇺🇸 English' : '🇨🇴 Español'}
          </button>
        </div>
      </main>
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
    if (!legalHtml) return <div style={{ background: '#05070A', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EAF1F8' }}>Cargando...</div>;
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

  const [navOpen, setNavOpen] = useState(false);

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
      {/* ===== Sidebar ===== */}
      <aside className={`sidebar ${navOpen ? 'sidebar--open' : ''}`}>
        <div className="sidebar-top">
          <FaroLogo size={30} />
          <button className="sidebar-close" onClick={() => setNavOpen(false)} aria-label="Cerrar menú"><X size={18} /></button>
        </div>

        <nav className="sidebar-nav">
          <span className="sidebar-nav-label">Operación</span>
          <button
            className={`side-link ${page === 'main' && !reportSlug && !isReportsHub ? 'active' : ''}`}
            onClick={() => {
              setNavOpen(false);
              if (window.location.pathname !== '/') { window.location.href = '/'; return; }
              window.location.hash = ''; setPage('main');
            }}
          >
            <Megaphone size={19} /> <span>{tr('campaigns', lang)}</span>
          </button>
          <button
            className={`side-link ${page === 'audiences' && !reportSlug && !isReportsHub ? 'active' : ''}`}
            onClick={() => {
              setNavOpen(false);
              if (window.location.pathname !== '/') { window.location.href = '/#audiences'; return; }
              window.location.hash = '#audiences'; setPage('audiences');
            }}
          >
            <Users size={19} /> <span>{tr('audiences', lang)}</span>
          </button>
          <span className="sidebar-nav-label">Análisis</span>
          <button
            className={`side-link ${isReportsHub || reportSlug ? 'active' : ''}`}
            onClick={() => { window.location.href = '/reportes'; }}
          >
            <BarChart3 size={19} /> <span>Reportes</span>
          </button>
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-accounts">
            {loadingAccounts ? (
              <span className="account-count"><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> {tr('loading', lang)}</span>
            ) : accountsError ? (
              <span className="account-count account-count--error">Error de cuentas</span>
            ) : (
              <span className="account-count" title="Cuentas cargadas vía business_management">
                {adAccounts.length} {tr('accounts_count', lang)}
                {(() => {
                  const bmSet = new Set(adAccounts.map(a => a.business?.id).filter(Boolean));
                  return bmSet.size > 0 ? ` · ${bmSet.size} BM` : '';
                })()}
              </span>
            )}
          </div>
          <div className="sidebar-user">
            {userPicture
              ? <img src={userPicture} alt="" className="nav-user-avatar" />
              : <span className="nav-user-avatar nav-user-avatar--fallback">{(userName || 'U').charAt(0).toUpperCase()}</span>}
            <span className="nav-user-name">{userName || 'Usuario'}</span>
            <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} className="sidebar-lang" title="Cambiar idioma">
              {lang === 'es' ? 'EN' : 'ES'}
            </button>
            <button onClick={handleLogout} className="nav-logout-btn" title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
      {navOpen && <div className="sidebar-scrim" onClick={() => setNavOpen(false)} />}

      {/* ===== Main ===== */}
      <div className="app-main">
        <button className="mobile-nav-toggle" onClick={() => setNavOpen(true)} aria-label="Abrir menú">
          <Menu size={20} />
          <FaroLogo size={24} wordSize={16} />
        </button>
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
      <div style={{ padding: 60, textAlign: 'center', color: '#8FA3B5' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Cargando cuentas...
      </div>
    );
  }

  if (!adAccounts?.length) {
    return <div style={{ padding: 60, textAlign: 'center', color: '#8FA3B5' }}>No hay cuentas publicitarias disponibles.</div>;
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
    inactive: { color: '#8FA3B5', bg: 'rgba(148,163,184,0.10)', border: 'rgba(148,163,184,0.25)', label: 'INACTIVA' }
  };

  const KpiTile = ({ icon, label, value, sub, color, onClick, active }) => (
    <button
      onClick={onClick}
      style={{
        flex: 1, minWidth: 180, textAlign: 'left', cursor: onClick ? 'pointer' : 'default',
        background: active ? `${color}22` : 'rgba(10,14,20,0.6)',
        border: `1px solid ${active ? color : 'rgba(25,155,228,0.2)'}`,
        borderRadius: 14, padding: '16px 18px', color: '#EAF1F8',
        transition: 'all 0.15s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {icon}
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#8FA3B5' }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#566575', marginTop: 4 }}>{sub}</div>}
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
      <div className="hub-urgent-card" onClick={() => openReport(acc)}>
        <div className="hub-urgent-head">
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="hub-urgent-name">{acc.name}</div>
            <div className="hub-urgent-biz">{acc.business?.name || '—'}</div>
          </div>
          <span className="hub-urgent-tag">URGENTE</span>
        </div>
        <div className="hub-urgent-grid2">
          <div>
            <div className="hub-urgent-k">Ayer</div>
            <div className="hub-urgent-v tnum">{formatCOP(y.spend || 0)}</div>
            <div className="hub-urgent-sub">{y.results || 0} {y.label || 'resultados'}</div>
          </div>
          <div>
            <div className="hub-urgent-k">Hoy {pctSpend && <span style={{ color: (t.spend || 0) < (y.spend || 0) ? '#f87171' : '#4ade80' }}>· {pctSpend}</span>}</div>
            <div className="hub-urgent-v tnum">{formatCOP(t.spend || 0)}</div>
            <div className="hub-urgent-sub">{t.results || 0} {t.label || 'resultados'}</div>
          </div>
        </div>
        {alerts.slice(0, 2).map((a, i) => (
          <div key={i} className="hub-urgent-alert">⚠ {a}</div>
        ))}
      </div>
    );
  };

  const okCount = Object.values(summary).filter(s => s.ok).length;
  const spendTone = (formatPct(totalSpendToday, totalSpendYesterday) || '').startsWith('-') ? 'down' : 'up';
  const resTone = (formatPct(totalResultsToday, totalResultsYesterday) || '').startsWith('-') ? 'down' : 'up';

  const statusCards = [
    { key: 'urgent', label: 'Urgentes', sub: 'Gasto sin resultados', color: '#f87171', count: statusCounts.urgent },
    { key: 'review', label: 'En observación', sub: 'Anomalías detectadas', color: '#fbbf24', count: statusCounts.review },
    { key: 'healthy', label: 'Saludables', sub: 'Dentro de parámetros', color: '#4ade80', count: statusCounts.healthy },
    { key: 'inactive', label: 'Sin gasto', sub: 'Sin operación', color: '#8FA3B5', count: statusCounts.inactive },
  ];
  const tabs = [
    { key: 'all', label: `Todas (${enriched.length})`, dot: '#4CCCF4' },
    { key: 'urgent', label: `Urgentes (${statusCounts.urgent})`, dot: '#f87171' },
    { key: 'review', label: `Revisar (${statusCounts.review})`, dot: '#fbbf24' },
    { key: 'healthy', label: `Saludables (${statusCounts.healthy})`, dot: '#4ade80' },
    { key: 'inactive', label: `Inactivas (${statusCounts.inactive})`, dot: '#8FA3B5' },
  ];

  return (
    <>
      <PageHero
        kicker="Centro de reportes · Meta Ads"
        title="Reportes"
        subtitle="Rendimiento de todas tus cuentas publicitarias, ordenado por urgencia. Ve de un vistazo dónde se está gastando presupuesto sin resultados."
        stats={<>
          <HeroStat icon={<TrendingUp size={20} />} label="Gasto hoy" value={formatCOP(totalSpendToday)} delta={formatPct(totalSpendToday, totalSpendYesterday)} deltaTone={spendTone} />
          <HeroStat icon={<Target size={20} />} label="Resultados hoy" value={totalResultsToday.toLocaleString('es-CO')} delta={formatPct(totalResultsToday, totalResultsYesterday)} deltaTone={resTone} />
          <HeroStat icon={<Wallet size={20} />} label="Gasto ayer" value={formatCOP(totalSpendYesterday)} />
          <HeroStat icon={<Database size={20} />} label="Cuentas con datos" value={`${okCount} / ${adAccounts.length}`} />
        </>}
      />

      <div className="page-body">
        {/* Segmentación por estado (filtros) */}
        <section className="page-section">
          <div className="hub-status-grid">
            {statusCards.map(c => (
              <button key={c.key} className={`hub-status-card ${filter === c.key ? 'active' : ''}`} onClick={() => setFilter(c.key)}>
                <div className="hub-status-top">
                  <span className="hub-status-dot" style={{ background: c.color, color: c.color }} />
                  <span className="hub-status-label">{c.label}</span>
                </div>
                <div className="hub-status-count" style={{ color: c.count > 0 ? c.color : 'var(--text-muted)' }}>{c.count}</div>
                <div className="hub-status-sub">{c.sub}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Urgencias */}
        {urgentAccounts.length > 0 && (
          <section className="page-section">
            <div className="page-section-head">
              <h2 className="page-section-title">
                <span className="hub-status-dot" style={{ background: '#f87171', color: '#f87171' }} /> Urgencias de hoy
              </h2>
              <span className="page-section-note">{urgentAccounts.length} cuentas requieren decisión</span>
            </div>
            <div className="hub-urgent-grid">
              {urgentAccounts.slice(0, 9).map(acc => <UrgencyCard key={acc.normId} acc={acc} />)}
            </div>
          </section>
        )}

        {/* Todas las cuentas */}
        <section className="page-section">
          <div className="page-section-head">
            <h2 className="page-section-title">Todas las cuentas</h2>
            {loadingSummary && (
              <span className="page-section-note"><Loader2 size={14} style={{ animation: 'spin 1s linear infinite', verticalAlign: 'middle', marginRight: 6 }} />Cargando métricas…</span>
            )}
          </div>

          <div className="hub-toolbar">
            <label className="hub-search">
              <Search size={16} color="var(--text-muted)" />
              <input type="text" placeholder="Buscar cuenta o negocio…" value={query} onChange={e => setQuery(e.target.value)} />
            </label>
            <div className="hub-tabs">
              {tabs.map(t => (
                <button key={t.key} className={`hub-tab ${filter === t.key ? 'active' : ''}`} onClick={() => setFilter(t.key)}>
                  <span className="hub-tab-dot" style={{ background: t.dot }} />{t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hub-table">
            <div className="hub-thead">
              <div>Cuenta</div>
              <div>Estado</div>
              <div className="hub-cell-hide">Gasto ayer</div>
              <div className="hub-cell-hide">Gasto hoy</div>
              <div className="hub-cell-hide">Resultados hoy</div>
              <div style={{ textAlign: 'right' }}>Ver</div>
            </div>
            {ordered.length === 0 ? (
              <div className="hub-empty">{loadingSummary ? 'Cargando datos de las cuentas…' : 'No hay cuentas en esta categoría.'}</div>
            ) : ordered.map(acc => {
              const s = acc.summary;
              const stStyle = STATUS_STYLES[acc.status];
              return (
                <div key={acc.normId} className="hub-row" onClick={() => openReport(acc)}>
                  <div style={{ minWidth: 0 }}>
                    <div className="hub-acc-name">{acc.name}</div>
                    <div className="hub-acc-biz">{acc.business?.name || '—'}</div>
                  </div>
                  <div>
                    <span className="hub-badge" style={{ background: stStyle.bg, color: stStyle.color, border: `1px solid ${stStyle.border}` }}>{stStyle.label}</span>
                  </div>
                  <div className="hub-cell-num hub-cell-hide">{formatCOP(s?.yesterday?.spend || 0)}</div>
                  <div className="hub-cell-num hub-cell-hide">
                    {formatCOP(s?.today?.spend || 0)}
                    {s?.yesterday?.spend > 0 && (
                      <span style={{ fontSize: 11, marginLeft: 6, color: (s.today?.spend || 0) < (s.yesterday?.spend || 0) ? '#f87171' : '#4ade80' }}>
                        {formatPct(s.today?.spend || 0, s.yesterday?.spend || 0)}
                      </span>
                    )}
                  </div>
                  <div className="hub-cell-hide">
                    <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: (s?.today?.results || 0) === 0 && (s?.today?.spend || 0) > 0 ? '#f87171' : 'var(--text-primary)' }}>
                      {s?.today?.results || 0}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 5 }}>{s?.today?.label || ''}</span>
                  </div>
                  <div className="hub-see">Ver →</div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
