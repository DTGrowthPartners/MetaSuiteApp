import { useState } from 'react';
import FacebookLogin from './components/FacebookLogin';
import CampaignDashboard from './components/CampaignDashboard';
import './App.css';

function App() {
  const [credentials, setCredentials] = useState(null);

  const handleLoginSuccess = (creds) => {
    setCredentials(creds);
  };

  const handleLogout = () => {
    setCredentials(null);
    // Cerrar sesión de Facebook también
    if (window.FB) {
      window.FB.logout();
    }
  };

  return (
    <div className="app">
      {!credentials ? (
        <FacebookLogin
          onLoginSuccess={handleLoginSuccess}
          onManualToken={handleLoginSuccess}
        />
      ) : (
        <CampaignDashboard
          apiKey={credentials.apiKey}
          initialAdAccountId={credentials.adAccountId}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}

export default App;
