import { useState, useEffect } from 'react';
import './FacebookLogin.css';

function FacebookLogin({ onLoginSuccess, onManualToken }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [manualAccountId, setManualAccountId] = useState('');

  useEffect(() => {
    // Esperar a que el SDK de Facebook se cargue
    window.fbAsyncInit = function() {
      window.FB.init({
        appId: '2784679235288284',
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });

      // Verificar si ya está logueado
      window.FB.getLoginStatus(function(response) {
        setLoading(false);
        if (response.status === 'connected') {
          handleLoginSuccess(response.authResponse.accessToken);
        }
      });
    };

    // Si el SDK ya está cargado
    if (window.FB) {
      window.FB.getLoginStatus(function(response) {
        setLoading(false);
        if (response.status === 'connected') {
          handleLoginSuccess(response.authResponse.accessToken);
        }
      });
    }
  }, []);

  const handleLoginSuccess = (token) => {
    onLoginSuccess({ apiKey: token, adAccountId: '' });
  };

  const handleFacebookLogin = () => {
    setError('');
    setLoading(true);

    window.FB.login(function(response) {
      setLoading(false);
      if (response.authResponse) {
        handleLoginSuccess(response.authResponse.accessToken);
      } else {
        setError('No se pudo iniciar sesión con Facebook. Por favor intenta nuevamente.');
      }
    }, {
      scope: 'ads_read,ads_management,business_management',
      return_scopes: true
    });
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const cleanToken = manualToken.trim().replace(/\s+/g, '');

    console.log('Token length:', cleanToken.length);
    console.log('Token preview:', cleanToken.substring(0, 30) + '...');

    if (!cleanToken) {
      setError('Por favor ingresa un Access Token válido');
      return;
    }
    onManualToken({ apiKey: cleanToken, adAccountId: manualAccountId.trim() });
  };

  if (loading) {
    return (
      <div className="fb-login-container">
        <div className="fb-login-card">
          <div className="spinner"></div>
          <p>Cargando Facebook SDK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-login-container">
      <div className="fb-login-card">
        <h1>Meta Ads Dashboard</h1>
        <p className="subtitle">Conecta tu cuenta de Facebook para ver tus campañas</p>

        {!showManualInput ? (
          <>
            <button onClick={handleFacebookLogin} className="fb-login-button">
              <svg className="fb-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Iniciar sesión con Facebook
            </button>

            {error && <p className="error-message">{error}</p>}

            <div className="divider">
              <span>o</span>
            </div>

            <button
              onClick={() => setShowManualInput(true)}
              className="manual-token-button"
            >
              Ingresar token manualmente
            </button>

            <div className="info-box">
              <p className="info-title">¿Por qué necesito iniciar sesión?</p>
              <p className="info-text">
                Necesitamos acceso a tu cuenta de Meta para poder mostrar tus campañas
                publicitarias. Solo solicitamos permisos de lectura.
              </p>
            </div>
          </>
        ) : (
          <>
            <form onSubmit={handleManualSubmit}>
              <div className="input-group">
                <label htmlFor="manualToken">Access Token</label>
                <textarea
                  id="manualToken"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  placeholder="Pega aquí tu Access Token completo (empieza con EAAL...)"
                  className="token-input token-textarea"
                  rows={3}
                />
                <p className="token-hint">El token debe ser largo (100+ caracteres) y empezar con EAAL</p>
              </div>

              <div className="input-group">
                <label htmlFor="manualAccountId">
                  ID de Cuenta Publicitaria <span className="optional">(Opcional)</span>
                </label>
                <input
                  id="manualAccountId"
                  type="text"
                  value={manualAccountId}
                  onChange={(e) => setManualAccountId(e.target.value)}
                  placeholder="781485172384812"
                  className="token-input"
                />
              </div>

              {error && <p className="error-message">{error}</p>}

              <div className="button-group">
                <button type="submit" className="submit-button">
                  Conectar
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="back-button"
                >
                  Volver
                </button>
              </div>
            </form>

            <div className="info-box">
              <p className="info-title">¿Cómo obtener el token?</p>
              <ol>
                <li>Ve a <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer">Graph API Explorer</a></li>
                <li>Selecciona tu aplicación</li>
                <li>Genera un token con permisos: ads_read, ads_management</li>
                <li>Copia y pega el token aquí</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default FacebookLogin;
