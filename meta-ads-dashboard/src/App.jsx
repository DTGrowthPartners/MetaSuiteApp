import { useState, useEffect, useCallback } from 'react';
import CreativeBuilder from './components/CreativeBuilder';
import MetaAdsService from './services/metaAdsApi';
import './App.css';

// ============================================
// LOGIN SCREEN - Facebook Login + Token Manual
// ============================================
function LoginScreen({ onLogin }) {
  const [manualToken, setManualToken] = useState('');
  const [showManual, setShowManual] = useState(false);
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
      scope: 'ads_management,pages_show_list,business_management,pages_read_engagement,ads_read,whatsapp_business_management,pages_manage_ads,instagram_basic,instagram_manage_insights'
    });
  };

  const handleManualLogin = () => {
    const token = manualToken.trim();
    if (!token) {
      setError('Pega un Access Token válido');
      return;
    }
    if (token.length < 50) {
      setError('El token parece muy corto. Asegúrate de copiar el token completo.');
      return;
    }
    onLogin(token, { name: 'Token Manual', picture: null, userId: null });
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
          <h1 className="login-title">Meta Suite</h1>
        </div>
        <p className="login-subtitle">Administra y optimiza tus campañas publicitarias</p>

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

        {/* Divider */}
        <div className="login-divider">
          <span>o</span>
        </div>

        {/* Manual Token Toggle */}
        {!showManual ? (
          <button onClick={() => setShowManual(true)} className="login-manual-btn">
            Usar Access Token manualmente
          </button>
        ) : (
          <div className="login-token-form">
            <label>Access Token de Meta</label>
            <textarea
              value={manualToken}
              onChange={(e) => { setManualToken(e.target.value); setError(''); }}
              placeholder="Pega tu Access Token aquí..."
              rows={3}
            />
            <button onClick={handleManualLogin} className="login-token-submit">
              Conectar con Token
            </button>
            <p className="login-token-hint">
              Genera un token en{' '}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">
                Graph API Explorer
              </a>
              {' '}con permisos: ads_management, pages_show_list, business_management
            </p>
          </div>
        )}

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

  // Show login if no token
  if (!accessToken) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Navigation Header */}
      <nav className="main-navigation">
        <div className="nav-brand">
          <span className="nav-logo">📊</span>
          <span className="nav-title">Meta Suite</span>
        </div>
        <div className="nav-info">
          {loadingAccounts ? (
            <span className="account-count">Cargando...</span>
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
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <CreativeBuilder adAccounts={adAccounts} accessToken={accessToken} />
      </main>
    </div>
  );
}

export default App;
