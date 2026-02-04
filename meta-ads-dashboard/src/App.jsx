import { useState, useEffect } from 'react';
import CampaignDashboard from './components/CampaignDashboard';
import CreativeBuilder from './components/CreativeBuilder';
import MetaAdsService from './services/metaAdsApi';
import './App.css';

// Token de acceso de 3 meses con permisos: pages_show_list, ads_management, ads_read, business_management, pages_read_engagement
const ACCESS_TOKEN = 'EAALFI7ZB5B9MBQrzKEhsGwlcsa820qgiSn6ZA4XlfCZBTNGZBfZAHY6UN4ttDdRKjsuO2EFEBM6DA4hdSR5NFfxniZBhrdkneOaSA6YwuUGjiMYn59UyQSKTfhPkahJF4ZBOvBeevWAWnYa46nXKzKvfWOcZAEdS6K9TGkST76XXOrPcshkgnPmZCmSt7ls4XHx95';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, creative-builder
  const [adAccounts, setAdAccounts] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [accountsError, setAccountsError] = useState(null);

  useEffect(() => {
    const loadAdAccounts = async () => {
      setLoadingAccounts(true);
      setAccountsError(null);
      try {
        console.log('Loading ad accounts...');
        const metaService = new MetaAdsService(ACCESS_TOKEN);
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
  }, []);

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
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        {currentView === 'dashboard' && (
          <CampaignDashboard
            apiKey={ACCESS_TOKEN}
            initialAdAccountId=""
            businessId=""
            onLogout={() => {}}
          />
        )}
        {currentView === 'creative-builder' && (
          <CreativeBuilder adAccounts={adAccounts} />
        )}
      </main>
    </div>
  );
}

export default App;
