import { useState, useEffect } from 'react';
import MetaAdsService from '../services/metaAdsApi';
import './CampaignDashboard.css';

function CampaignDashboard({ apiKey, initialAdAccountId, onLogout }) {
  const [campaigns, setCampaigns] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [datePreset, setDatePreset] = useState('maximum'); // Por defecto: todo el tiempo de la campaña

  const metaService = new MetaAdsService(apiKey);

  const loadAdAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      const accounts = await metaService.getAdAccounts();
      setAdAccounts(accounts);

      // Si se proporcionó un ID de cuenta inicial, usarlo
      if (initialAdAccountId) {
        const normalizedId = metaService.normalizeAccountId(initialAdAccountId);
        setSelectedAccount(normalizedId);
      } else if (accounts.length > 0) {
        setSelectedAccount(accounts[0].id);
      }
    } catch (err) {
      // Si hay un ID de cuenta proporcionado pero falla la carga de cuentas, usar el ID proporcionado
      if (initialAdAccountId) {
        const normalizedId = metaService.normalizeAccountId(initialAdAccountId);
        setSelectedAccount(normalizedId);
        setError('');
      } else {
        const errorMsg = err.response?.data?.error?.message || err.message || 'Error desconocido';
        setError(`Error al cargar cuentas: ${errorMsg}. Verifica tu Access Token.`);
      }
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadCampaigns = async () => {
    if (!selectedAccount) return;

    try {
      setLoading(true);
      setError('');
      const campaignsData = await metaService.getCampaignsWithInsights(selectedAccount, datePreset);
      setCampaigns(campaignsData);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMsg = err.response?.data?.error?.message || err.message || 'Error desconocido';
      setError(`Error al cargar campañas: ${errorMsg}`);
      console.error('Error completo:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si se proporciona un ID de cuenta inicial, usarlo directamente
    if (initialAdAccountId) {
      const normalizedId = metaService.normalizeAccountId(initialAdAccountId);
      setSelectedAccount(normalizedId);
      setLoading(false);
    } else {
      loadAdAccounts();
    }
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadCampaigns();
      const interval = setInterval(() => {
        loadCampaigns();
      }, 30000); // Actualizar cada 30 segundos

      return () => clearInterval(interval);
    }
  }, [selectedAccount, datePreset]);

  const formatCurrency = (amount) => {
    const formatted = new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.round(amount || 0));
    return `$${formatted}`;
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('es-MX').format(num || 0);
  };

  // Mapeo global de tipos de acciones a etiquetas legibles
  const actionLabels = {
    'purchase': 'venta',
    'omni_purchase': 'venta',
    'offsite_conversion.fb_pixel_purchase': 'venta',
    'lead': 'lead',
    'onsite_conversion.messaging_conversation_started_7d': 'mensaje',
    'onsite_conversion.messaging_first_reply': 'mensaje',
    'onsite_conversion.lead_grouped': 'lead',
    'landing_page_view': 'vista de página',
    'link_click': 'clic',
    'post_engagement': 'interacción',
    'page_engagement': 'interacción',
    'video_view': 'vista de video',
    'onsite_conversion.post_save': 'guardado',
    'comment': 'comentario',
    'like': 'like',
    'ig_account_visit': 'visita perfil IG',
    'profile_visit': 'visita perfil'
  };

  // Obtener el costo por resultado según el tipo de campaña
  const getCostPerResult = (campaign, insights) => {
    if (!insights) return 'N/A';

    const spend = parseFloat(insights.spend || 0);
    if (spend === 0) return 'Sin gasto';

    const costPerAction = insights.cost_per_action_type || [];
    const actions = insights.actions || [];
    const campaignType = getCampaignType(campaign);

    // Debug: mostrar todos los cost_per_action_type disponibles
    console.log('Cost per action types disponibles:', costPerAction.map(a => `${a.action_type}: ${a.value}`));

    // Definir qué acción es el "resultado" según el tipo de campaña
    let targetActions = [];
    let resultLabel = 'resultado';

    if (campaignType === 'traffic_web') {
      targetActions = ['landing_page_view', 'link_click'];
      resultLabel = 'vista de página';
    } else if (campaignType === 'instagram') {
      // Todas las posibles variantes para visitas al perfil de Instagram
      targetActions = [
        'onsite_conversion.ig_account_visit',
        'ig_account_visit',
        'profile_visit',
        'onsite_conversion.profile_visit',
        'link_click'
      ];
      resultLabel = 'visita al perfil';
    } else {
      targetActions = ['landing_page_view', 'ig_account_visit', 'profile_visit', 'link_click'];
    }

    // Buscar en cost_per_action_type (valor pre-calculado por Meta)
    for (const type of targetActions) {
      const costAction = costPerAction.find(a => a.action_type === type);
      if (costAction) {
        const label = actionLabels[type] || resultLabel;
        console.log(`Encontrado cost_per_action para ${type}: ${costAction.value}`);
        return `${formatCurrency(parseFloat(costAction.value))} / ${label}`;
      }
    }

    // Calcular manualmente si no hay cost_per_action_type
    for (const type of targetActions) {
      const action = actions.find(a => a.action_type === type);
      if (action && parseFloat(action.value) > 0) {
        const cost = spend / parseFloat(action.value);
        const label = actionLabels[type] || resultLabel;
        console.log(`Calculando manualmente para ${type}: ${spend} / ${action.value} = ${cost}`);
        return `${formatCurrency(cost)} / ${label}`;
      }
    }

    return 'Sin resultados';
  };

  // Función para obtener el valor de una acción específica
  const getActionValue = (insights, actionTypes) => {
    if (!insights || !insights.actions) return 0;

    const actions = insights.actions;
    // actionTypes puede ser un string o un array de strings
    const types = Array.isArray(actionTypes) ? actionTypes : [actionTypes];

    for (const type of types) {
      const action = actions.find(a => a.action_type === type);
      if (action) {
        return parseInt(action.value) || 0;
      }
    }
    return 0;
  };

  // Detectar el tipo de campaña basado en las acciones disponibles (lo más confiable)
  const getCampaignType = (campaign) => {
    const actions = campaign.insights?.actions || [];

    // Buscar acciones específicas (incluir variantes con prefijo onsite_conversion)
    const hasIGVisits = actions.some(a =>
      ['ig_account_visit', 'profile_visit', 'onsite_conversion.ig_account_visit', 'onsite_conversion.profile_visit'].includes(a.action_type)
    );
    const hasLandingPageViews = actions.some(a =>
      a.action_type === 'landing_page_view'
    );

    // Debug
    console.log('Acciones detectadas:', actions.map(a => a.action_type));
    console.log('hasIGVisits:', hasIGVisits, 'hasLandingPageViews:', hasLandingPageViews);

    // Lógica simple: si tiene vistas de página = web, si tiene visitas IG = instagram
    if (hasLandingPageViews && !hasIGVisits) {
      return 'traffic_web';
    }
    if (hasIGVisits && !hasLandingPageViews) {
      return 'instagram';
    }
    // Si tiene ambos, priorizar por cantidad
    if (hasLandingPageViews && hasIGVisits) {
      const lpvCount = getActionValue(campaign.insights, 'landing_page_view');
      const igCount = getActionValue(campaign.insights, ['ig_account_visit', 'profile_visit', 'onsite_conversion.ig_account_visit']);
      return lpvCount > igCount ? 'traffic_web' : 'instagram';
    }

    return 'general';
  };

  // Obtener las métricas relevantes según el tipo de campaña
  const getRelevantMetrics = (campaign, insights) => {
    const campaignType = getCampaignType(campaign);
    const metrics = [];

    // Action types para Instagram (todas las variantes)
    const igVisitTypes = ['ig_account_visit', 'profile_visit', 'onsite_conversion.ig_account_visit', 'onsite_conversion.profile_visit'];

    if (campaignType === 'instagram') {
      // Métricas específicas para Instagram
      metrics.push(
        { label: 'Visitas al perfil IG', value: getActionValue(insights, igVisitTypes) },
        { label: 'Clics en enlace', value: getActionValue(insights, 'link_click') },
        { label: 'Interacciones', value: getActionValue(insights, ['post_engagement', 'page_engagement']) }
      );
    } else if (campaignType === 'traffic_web') {
      // Métricas específicas para Tráfico Web
      metrics.push(
        { label: 'Vistas de página', value: getActionValue(insights, 'landing_page_view') },
        { label: 'Clics en enlace', value: getActionValue(insights, 'link_click') }
      );
    } else {
      // Métricas generales - mostrar lo que tenga valor
      const possibleMetrics = [
        { label: 'Vistas de página', value: getActionValue(insights, 'landing_page_view') },
        { label: 'Visitas perfil IG', value: getActionValue(insights, igVisitTypes) },
        { label: 'Clics en enlace', value: getActionValue(insights, 'link_click') },
        { label: 'Interacciones', value: getActionValue(insights, ['post_engagement', 'page_engagement']) }
      ];
      possibleMetrics.forEach(m => {
        if (m.value > 0) metrics.push(m);
      });
    }

    return { type: campaignType, metrics };
  };

  // Obtener etiqueta legible del tipo de campaña
  const getCampaignTypeLabel = (type) => {
    const labels = {
      'instagram': 'Instagram',
      'traffic_web': 'Sitio Web',
      'general': 'General'
    };
    return labels[type] || type;
  };

  const getBudgetInfo = (campaign) => {
    // Para COP (pesos colombianos), probamos sin dividir por 100
    // ya que la API parece devolver valores directamente en pesos
    const dailyBudget = campaign.daily_budget ? parseFloat(campaign.daily_budget) : null;
    const lifetimeBudget = campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) : null;
    const spent = campaign.insights?.spend ? parseFloat(campaign.insights.spend) : 0;
    const budgetRemaining = campaign.budget_remaining ? parseFloat(campaign.budget_remaining) : null;

    // Debug para ver los valores originales
    console.log('Budget debug:', {
      daily_budget_raw: campaign.daily_budget,
      lifetime_budget_raw: campaign.lifetime_budget,
      budget_remaining_raw: campaign.budget_remaining,
      dailyBudget,
      lifetimeBudget,
      budgetRemaining,
      spent
    });

    if (dailyBudget) {
      return {
        budget: formatCurrency(dailyBudget),
        spent: formatCurrency(spent),
        remaining: budgetRemaining !== null ? formatCurrency(budgetRemaining) : 'N/A',
        type: 'Diario'
      };
    }

    if (lifetimeBudget) {
      return {
        budget: formatCurrency(lifetimeBudget),
        spent: formatCurrency(spent),
        remaining: budgetRemaining !== null ? formatCurrency(budgetRemaining) : 'N/A',
        type: 'Total'
      };
    }

    return {
      budget: 'N/A',
      spent: formatCurrency(spent),
      remaining: 'N/A',
      type: 'N/A'
    };
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>Meta Ads Dashboard</h1>
          <p className="last-update">Última actualización: {lastUpdate.toLocaleTimeString()}</p>
        </div>
        <button onClick={onLogout} className="logout-button">Cerrar Sesión</button>
      </header>

      <div className="account-selector">
        <label htmlFor="account-select">Cuenta:</label>
        {adAccounts.length > 0 ? (
          <select
            id="account-select"
            value={selectedAccount || ''}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="account-select"
          >
            {adAccounts.map(account => (
              <option key={account.id} value={account.id}>
                {account.name} ({account.id})
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={selectedAccount || ''}
            className="account-select"
            disabled
            placeholder="Usando ID proporcionado"
          />
        )}

        <label htmlFor="date-select">Período:</label>
        <select
          id="date-select"
          value={datePreset}
          onChange={(e) => setDatePreset(e.target.value)}
          className="date-select"
        >
          <option value="maximum">Todo el tiempo</option>
          <option value="today">Hoy</option>
          <option value="yesterday">Ayer</option>
          <option value="last_7d">Últimos 7 días</option>
          <option value="last_14d">Últimos 14 días</option>
          <option value="last_30d">Últimos 30 días</option>
          <option value="this_month">Este mes</option>
          <option value="last_month">Mes pasado</option>
        </select>

        <button onClick={loadCampaigns} className="refresh-button">Actualizar</button>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {loading && campaigns.length === 0 ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Cargando campañas...</p>
        </div>
      ) : (
        <div className="campaigns-grid">
          {campaigns.length === 0 ? (
            <div className="no-campaigns">
              <p>No se encontraron campañas en esta cuenta.</p>
              <p className="no-campaigns-hint">Verifica que el ID de cuenta sea correcto y que tengas campañas creadas.</p>
            </div>
          ) : (
            campaigns.map(campaign => {
              const budgetInfo = getBudgetInfo(campaign);
              const insights = campaign.insights || {};
              const { type: campaignType, metrics: relevantMetrics } = getRelevantMetrics(campaign, insights);

              return (
                <div key={campaign.id} className="campaign-card">
                  <div className="campaign-header">
                    <h3 className="campaign-name">{campaign.name}</h3>
                    <span className={`campaign-status status-${campaign.status?.toLowerCase()}`}>
                      {campaign.status === 'ACTIVE' ? 'ACTIVA' : campaign.status === 'PAUSED' ? 'PAUSADA' : campaign.status}
                    </span>
                  </div>

                  <div className="campaign-tags">
                    <span className={`campaign-type type-${campaignType}`}>
                      {getCampaignTypeLabel(campaignType)}
                    </span>
                    <span className="campaign-objective-tag">
                      {campaign.objective?.replace('OUTCOME_', '').replace(/_/g, ' ') || 'N/A'}
                    </span>
                  </div>

                  <div className="metrics-section">
                    <h4 className="metrics-title">Presupuesto y Gasto</h4>
                    <div className="metrics-grid">
                      <div className="metric">
                        <span className="metric-label">Costo por Resultado</span>
                        <span className="metric-value highlight">{getCostPerResult(campaign, insights)}</span>
                      </div>

                      <div className="metric">
                        <span className="metric-label">Presupuesto {budgetInfo.type}</span>
                        <span className="metric-value">{budgetInfo.budget}</span>
                      </div>

                      <div className="metric">
                        <span className="metric-label">Gastado</span>
                        <span className="metric-value">{budgetInfo.spent}</span>
                      </div>

                      <div className="metric">
                        <span className="metric-label">Restante</span>
                        <span className="metric-value">{budgetInfo.remaining}</span>
                      </div>
                    </div>
                  </div>

                  <div className="metrics-section">
                    <h4 className="metrics-title">Alcance</h4>
                    <div className="metrics-grid">
                      <div className="metric">
                        <span className="metric-label">Alcance</span>
                        <span className="metric-value">{formatNumber(insights.reach)}</span>
                      </div>

                      <div className="metric">
                        <span className="metric-label">Impresiones</span>
                        <span className="metric-value">{formatNumber(insights.impressions)}</span>
                      </div>
                    </div>
                  </div>

                  {relevantMetrics.length > 0 && (
                    <div className="metrics-section">
                      <h4 className="metrics-title">Resultados ({getCampaignTypeLabel(campaignType)})</h4>
                      <div className="metrics-grid">
                        {relevantMetrics.map((metric, index) => (
                          <div key={index} className="metric">
                            <span className="metric-label">{metric.icon} {metric.label}</span>
                            <span className="metric-value">{formatNumber(metric.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default CampaignDashboard;
