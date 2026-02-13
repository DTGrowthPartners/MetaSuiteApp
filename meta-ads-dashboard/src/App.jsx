import { useState, useEffect, useCallback } from 'react';
import CampaignDashboard from './components/CampaignDashboard';
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
      scope: 'ads_management,pages_show_list,business_management,pages_read_engagement,ads_read'
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
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a1628 0%, #1a237e 50%, #0d47a1 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '48px 40px',
        maxWidth: '440px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        textAlign: 'center'
      }}>
        {/* Logo */}
        <div style={{ marginBottom: '8px', fontSize: '48px' }}>📊</div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1a1a2e', marginBottom: '8px' }}>
          Meta Suite
        </h1>
        <p style={{ color: '#666', fontSize: '15px', marginBottom: '32px' }}>
          Inicia sesión para administrar tus campañas
        </p>

        {/* Facebook Login Button */}
        <button
          onClick={handleFacebookLogin}
          disabled={loading || !fbReady}
          style={{
            width: '100%',
            padding: '14px 24px',
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            background: loading ? '#8b9dc3' : '#1877F2',
            border: 'none',
            borderRadius: '10px',
            cursor: loading || !fbReady ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'all 0.2s',
            opacity: fbReady ? 1 : 0.6
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          {loading ? 'Conectando...' : 'Continuar con Facebook'}
        </button>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '24px 0',
          gap: '12px'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
          <span style={{ color: '#999', fontSize: '13px' }}>o</span>
          <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
        </div>

        {/* Manual Token Toggle */}
        {!showManual ? (
          <button
            onClick={() => setShowManual(true)}
            style={{
              width: '100%',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '500',
              color: '#555',
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '10px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Usar Access Token manualmente
          </button>
        ) : (
          <div style={{ textAlign: 'left' }}>
            <label style={{ fontSize: '13px', color: '#555', fontWeight: '600', marginBottom: '6px', display: 'block' }}>
              Access Token de Meta
            </label>
            <textarea
              value={manualToken}
              onChange={(e) => { setManualToken(e.target.value); setError(''); }}
              placeholder="Pega tu Access Token aquí..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '13px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                resize: 'vertical',
                fontFamily: 'monospace',
                marginBottom: '12px'
              }}
            />
            <button
              onClick={handleManualLogin}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                background: '#333',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Conectar con Token
            </button>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Genera un token en{' '}
              <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer" style={{ color: '#1877F2' }}>
                Graph API Explorer
              </a>
              {' '}con permisos: ads_management, pages_show_list, business_management
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: '#fff0f0',
            border: '1px solid #ffcdd2',
            borderRadius: '8px',
            color: '#c62828',
            fontSize: '13px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}
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

  const [currentView, setCurrentView] = useState('dashboard');
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
        <div className="nav-tabs">
          <button
            className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="tab-icon">📈</span>
            Dashboard
          </button>
          <button
            className={`nav-tab ${currentView === 'creative-builder' ? 'active' : ''}`}
            onClick={() => setCurrentView('creative-builder')}
          >
            <span className="tab-icon">🎨</span>
            Creative Builder
          </button>
        </div>
        <div className="nav-info">
          {loadingAccounts ? (
            <span className="account-count">Cargando...</span>
          ) : accountsError ? (
            <span className="account-count" style={{ color: '#cc0000' }}>Error</span>
          ) : (
            <span className="account-count">{adAccounts.length} cuentas</span>
          )}

          {/* User info + Logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {userPicture && (
              <img
                src={userPicture}
                alt=""
                style={{ width: '30px', height: '30px', borderRadius: '50%' }}
              />
            )}
            <span style={{ fontSize: '13px', color: '#444', fontWeight: '500' }}>
              {userName || 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#666',
                background: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="Cerrar sesión y cambiar cuenta"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <CampaignDashboard
            apiKey={accessToken}
            initialAdAccountId=""
            businessId=""
            onLogout={handleLogout}
          />
        )}
        {currentView === 'creative-builder' && (
          <CreativeBuilder adAccounts={adAccounts} accessToken={accessToken} />
        )}
      </main>
    </div>
  );
}

export default App;
