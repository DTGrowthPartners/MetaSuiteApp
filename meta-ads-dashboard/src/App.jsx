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
        <p className="splash-tagline">MetaSuite</p>
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
              <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm13 0l4 8-4-1-4 1 4-8z" fill="url(#g1)" />
              <defs><linearGradient id="g1" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#4A9FFF"/><stop offset="1" stopColor="#7C5CFC"/></linearGradient></defs>
            </svg>
          </div>
          <h1 className="login-title">MetaSuite</h1>
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
    fetch(`${apiBase}${pathname.replace('/', '/legal/')}`)
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
            <span className="nav-title">MetaSuite</span>
          </div>
        </div>
        <div className="nav-links">
          <button
            className={`nav-link ${page === 'main' && !reportSlug ? 'active' : ''}`}
            onClick={() => { window.location.hash = ''; setPage('main'); }}
          >
            {tr('campaigns', lang)}
          </button>
          <button
            className={`nav-link ${page === 'audiences' ? 'active' : ''}`}
            onClick={() => { window.location.hash = '#audiences'; setPage('audiences'); }}
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
            <span className="account-count">{adAccounts.length} {tr('accounts_count', lang)}</span>
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
          <ReportsHub adAccounts={adAccounts} loadingAccounts={loadingAccounts} />
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
// REPORTS HUB — grid de tarjetas con todas las cuentas publicitarias
// ============================================
function ReportsHub({ adAccounts, loadingAccounts }) {
  const [query, setQuery] = useState('');

  if (loadingAccounts) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> Cargando cuentas...
      </div>
    );
  }

  if (!adAccounts || adAccounts.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
        No hay cuentas publicitarias disponibles.
      </div>
    );
  }

  const filtered = adAccounts.filter(a => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (a.name || '').toLowerCase().includes(q)
      || (a.business?.name || '').toLowerCase().includes(q)
      || (a.id || '').toLowerCase().includes(q);
  });

  // Agrupar por business
  const byBusiness = new Map();
  for (const acc of filtered) {
    const biz = acc.business?.name || 'Sin negocio';
    if (!byBusiness.has(biz)) byBusiness.set(biz, []);
    byBusiness.get(biz).push(acc);
  }
  const businessGroups = Array.from(byBusiness.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  const openReport = (acc) => {
    const name = encodeURIComponent(acc.name || acc.id);
    const business = encodeURIComponent(acc.business?.name || '');
    const id = acc.id.startsWith('act_') ? acc.id : 'act_' + acc.id;
    window.location.href = `/${id}?name=${name}&business=${business}`;
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#e2e8f0', margin: 0, marginBottom: 6 }}>
          <BarChart3 size={26} style={{ verticalAlign: 'middle', marginRight: 10, color: '#a5b4fc' }} />
          Reportes
        </h1>
        <p style={{ color: '#94a3b8', margin: 0, fontSize: 14 }}>
          Selecciona una cuenta para ver su reporte de Ayer, Hoy y Último Mes.
        </p>
      </div>

      <input
        type="text"
        placeholder="Buscar cuenta o negocio..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{
          width: '100%', padding: '12px 16px', marginBottom: 24,
          background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 10, color: '#e2e8f0', fontSize: 14, outline: 'none'
        }}
      />

      {businessGroups.map(([biz, accounts]) => (
        <div key={biz} style={{ marginBottom: 32 }}>
          <h3 style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, margin: '0 0 12px' }}>
            {biz} <span style={{ color: '#64748b', fontWeight: 400 }}>({accounts.length})</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {accounts.map(acc => {
              const status = acc.account_status === 1 ? 'active' : 'inactive';
              return (
                <button
                  key={acc.id}
                  onClick={() => openReport(acc)}
                  style={{
                    textAlign: 'left', cursor: 'pointer',
                    background: 'linear-gradient(135deg, rgba(30,41,59,0.7), rgba(15,23,42,0.7))',
                    border: '1px solid rgba(99,102,241,0.2)',
                    borderRadius: 12, padding: '16px 18px',
                    transition: 'all 0.15s ease',
                    color: '#e2e8f0'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <BarChart3 size={18} style={{ color: '#a5b4fc' }} />
                    <span style={{
                      fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 999,
                      background: status === 'active' ? 'rgba(34,197,94,0.15)' : 'rgba(148,163,184,0.15)',
                      color: status === 'active' ? '#4ade80' : '#94a3b8'
                    }}>
                      {status === 'active' ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>
                    {acc.name}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>
                    {acc.id} · {acc.currency || ''}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>
          No se encontraron cuentas que coincidan con "{query}".
        </div>
      )}
    </div>
  );
}

export default App;
