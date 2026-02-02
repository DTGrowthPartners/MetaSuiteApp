import { useState } from 'react';
import './ApiKeyInput.css';

function ApiKeyInput({ onApiKeySubmit }) {
  const [apiKey, setApiKey] = useState('');
  const [adAccountId, setAdAccountId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('Por favor ingresa un Access Token válido');
      return;
    }

    onApiKeySubmit({ apiKey: apiKey.trim(), adAccountId: adAccountId.trim() });
  };

  return (
    <div className="api-key-container">
      <div className="api-key-card">
        <h1>Meta Ads Dashboard</h1>
        <p className="subtitle">Ingresa tu Access Token de Meta Ads para comenzar</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="apiKey">Access Token</label>
            <input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="2784679235288284|KeeDZqKI5XBfwzQG2wlGOFD6RXc"
              className="api-key-input"
            />
          </div>

          <div className="input-group">
            <label htmlFor="adAccountId">
              ID de Cuenta Publicitaria <span className="optional">(Opcional)</span>
            </label>
            <input
              id="adAccountId"
              type="text"
              value={adAccountId}
              onChange={(e) => setAdAccountId(e.target.value)}
              placeholder="781485172384812"
              className="api-key-input"
            />
            <p className="input-hint">
              Si lo dejas vacío, se mostrarán todas tus cuentas disponibles
            </p>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="submit-button">
            Conectar
          </button>
        </form>

        <div className="info-box">
          <p className="info-title">¿Cómo obtener tu User Access Token?</p>
          <ol>
            <li>Ve a <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer">Meta Graph API Explorer</a></li>
            <li>Selecciona tu aplicación en "Meta App"</li>
            <li>Asegúrate que en "User or Page" esté tu usuario</li>
            <li>Haz clic en "Generate Access Token"</li>
            <li>Selecciona los permisos: <strong>ads_read</strong>, <strong>ads_management</strong>, <strong>business_management</strong></li>
            <li>Copia el token generado (será largo, no uses AppID|AppSecret)</li>
          </ol>
          <p className="warning-text">
            ⚠️ No uses el formato AppID|AppSecret. Necesitas un User Access Token real del Graph API Explorer.
          </p>
        </div>
      </div>
    </div>
  );
}

export default ApiKeyInput;
