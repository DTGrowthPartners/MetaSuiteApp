import { useState, useEffect, useCallback, useRef } from 'react';
import CreativeBuilder from './components/CreativeBuilder';
import AccountDashboard from './components/AccountDashboard';
import CampaignReport from './components/CampaignReport';
import MetaAdsService from './services/metaAdsApi';
import { LogOut, Loader2 } from 'lucide-react';
import './App.css';

// ============================================
// SPLASH SCREEN - Animated loading
// ============================================
function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('enter'); // enter → hold → exit
  const canvasRef = useRef(null);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    const particles = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1
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
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(74, 159, 255, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
      rafId = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Timing
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('hold'), 100);
    const t2 = setTimeout(() => setPhase('exit'), 2200);
    const t3 = setTimeout(() => onFinish(), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onFinish]);

  return (
    <div className={`splash-screen splash-${phase}`}>
      <canvas ref={canvasRef} className="splash-particles" />
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
function LoginScreen({ onLogin }) {
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
      scope: 'ads_management,pages_show_list,business_management,pages_read_engagement,ads_read,whatsapp_business_management,instagram_basic,instagram_manage_insights'
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
        <p className="login-subtitle">Inicia sesión para administrar tus campañas publicitarias</p>

        {/* Facebook Login Button */}
        <button
          onClick={handleFacebookLogin}
          disabled={loading || !fbReady}
          className="login-fb-btn"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {loading ? 'Conectando...' : 'Continuar con Facebook'}
        </button>

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
  const [showSplash, setShowSplash] = useState(true);

  // Detectar si es una ruta de reporte (ej: /eq-cartagena)
  const pathname = window.location.pathname;
  const reportSlug = pathname !== '/' && !pathname.startsWith('/assets') && !pathname.startsWith('/api')
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

  // Hash-based routing: #dashboard → AccountDashboard
  const [page, setPage] = useState(() => window.location.hash === '#dashboard' ? 'dashboard' : 'main');
  useEffect(() => {
    const onHash = () => setPage(window.location.hash === '#dashboard' ? 'dashboard' : 'main');
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
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Navigation Header */}
      <nav className="main-navigation">
        <div className="nav-brand">
          <img src="/DT-GROWTH-LOGO-DYCI6Arf.png" alt="DT Growth Partners" className="nav-logo-img" />
          <div className="nav-brand-text">
            <span className="nav-title">MetaSuite</span>
          </div>
        </div>
        <div className="nav-info">
          {loadingAccounts ? (
            <span className="account-count"><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Cargando...</span>
          ) : accountsError ? (
            <span className="account-count account-count--error">Error</span>
          ) : (
            <span className="account-count">{adAccounts.length} cuentas</span>
          )}

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
        {reportSlug ? (
          <CampaignReport slug={reportSlug} accessToken={accessToken} adAccounts={adAccounts} loadingAccounts={loadingAccounts} />
        ) : page === 'dashboard' ? (
          <AccountDashboard
            adAccounts={adAccounts}
            onBack={() => { window.location.hash = ''; setPage('main'); }}
          />
        ) : (
          <CreativeBuilder adAccounts={adAccounts} accessToken={accessToken} />
        )}
      </main>
    </div>
  );
}

export default App;
