import { useState } from 'react';
import CampaignDashboard from './components/CampaignDashboard';
import './App.css';

// Token de acceso de 3 meses para Dtgrowth Partners
const ACCESS_TOKEN = 'EAALFI7ZB5B9MBQjZAIECshdnZAGz5D2JGTcdVaFaBDMZAZCxyG7UUGA0mV1wiuYUsQZAZAbF7Cz5S0jDn65ZCx7f9p55ZCrtSZCZBwvjx0GfFO7tulv4nP2wfHxI32WFTqDSfOiN3ZBpAKZAQI7OVvPNkYrjI7fJdkfH9uFoXN5ivU00RUVyqLP3Vx2LZCZCWGzbPAqPP3d';

function App() {
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  const handleLogout = () => {
    setIsLoggedOut(true);
  };

  const handleLogin = () => {
    setIsLoggedOut(false);
  };

  if (isLoggedOut) {
    return (
      <div className="app">
        <div className="logout-screen">
          <h1>Meta Ads Dashboard</h1>
          <p>Has cerrado sesión</p>
          <button onClick={handleLogin} className="login-button">
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <CampaignDashboard
        apiKey={ACCESS_TOKEN}
        initialAdAccountId=""
        businessId=""
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
