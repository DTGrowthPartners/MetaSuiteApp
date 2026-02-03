import { useState, useEffect } from 'react';
import MetaAdsService from '../services/metaAdsApi';
import './CampaignDashboard.css';

function CampaignDashboard({ apiKey, initialAdAccountId, businessId, onLogout }) {
  const [campaigns, setCampaigns] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [adAccounts, setAdAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [datePreset, setDatePreset] = useState('maximum'); // Por defecto: todo el tiempo de la campaña
  const [togglingCampaigns, setTogglingCampaigns] = useState({}); // Track campaigns being toggled

  const metaService = new MetaAdsService(apiKey);

  // Función para activar/pausar una campaña
  const handleToggleCampaign = async (campaignId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    // Marcar campaña como en proceso de cambio
    setTogglingCampaigns(prev => ({ ...prev, [campaignId]: true }));

    const result = await metaService.updateCampaignStatus(campaignId, newStatus);

    if (result.success) {
      // Actualizar el estado local de la campaña
      setCampaigns(prev => prev.map(c =>
        c.id === campaignId ? { ...c, status: newStatus } : c
      ));
    } else {
      setError(`Error al cambiar estado: ${result.error}`);
    }

    // Quitar el estado de carga
    setTogglingCampaigns(prev => ({ ...prev, [campaignId]: false }));
  };

  const loadAdAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      let accounts = [];
      let biz = [];

      // Si se proporcionó un Business ID específico, obtener cuentas de ese business
      if (businessId) {
        const { businesses: bizList, adAccounts: bizAccounts } = await metaService.getAdAccountsFromSpecificBusiness(businessId);
        biz = bizList;
        accounts = bizAccounts;
      } else {
        // Obtener todas las cuentas de todos los portafolios comerciales
        const result = await metaService.getAllAdAccountsFromBusinesses();
        biz = result.businesses;
        accounts = result.adAccounts;
      }

      setBusinesses(biz);
      setAdAccounts(accounts);

      // Si no se encontraron cuentas y no hay Business ID, mostrar mensaje informativo
      if (accounts.length === 0 && !businessId && !initialAdAccountId) {
        setError('No se encontraron cuentas publicitarias. Si usas un Page Token, necesitas un User Access Token. También puedes proporcionar el Business Manager ID directamente.');
      }

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

        // Mensaje más amigable para Page Tokens
        if (errorMsg.includes('Page')) {
          setError('El token proporcionado es de una Página, no de un Usuario. Necesitas un User Access Token del Graph API Explorer, o proporciona el ID del Business Manager.');
        } else {
          setError(`Error al cargar cuentas: ${errorMsg}. Verifica tu Access Token.`);
        }
      }
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
    'post_engagement': 'resultado',
    'page_engagement': 'resultado',
    'video_view': 'vista de video',
    'onsite_conversion.post_save': 'guardado',
    'comment': 'comentario',
    'like': 'like',
    'ig_account_visit': 'visita perfil',
    'profile_visit': 'visita perfil',
    'onsite_conversion.ig_account_visit': 'visita perfil',
    'onsite_conversion.profile_visit': 'visita perfil'
  };

  // Obtener el costo por resultado según el tipo de campaña
  const getCostPerResult = (campaign, insights) => {
    if (!insights) return 'N/A';

    const spend = parseFloat(insights.spend || 0);
    if (spend === 0) return 'Sin gasto';

    const costPerAction = insights.cost_per_action_type || [];
    const actions = insights.actions || [];
    const costPerResult = insights.cost_per_result || [];
    const campaignType = getCampaignType(campaign);

    // Usar cost_per_result de Meta si está disponible (es el valor más preciso)
    if (costPerResult.length > 0) {
      const result = costPerResult[0];
      if (result.values && result.values.length > 0) {
        const value = parseFloat(result.values[0].value);
        const indicator = result.indicator || 'resultado';
        const labelMap = {
          'profile_visit_view': 'visita perfil',
          'landing_page_view': 'vista de página',
          'link_click': 'clic',
          'purchase': 'venta',
          'lead': 'lead'
        };
        const label = labelMap[indicator] || 'resultado';
        return `${formatCurrency(value)} / ${label}`;
      }
    }

    // Definir qué acción es el "resultado" según el tipo de campaña
    let targetActions = [];
    let resultLabel = 'resultado';

    if (campaignType === 'traffic_web') {
      targetActions = ['landing_page_view', 'link_click'];
      resultLabel = 'vista de página';
    } else if (campaignType === 'instagram') {
      // Para Instagram: visitas al perfil, o page_engagement como alternativa
      targetActions = [
        'onsite_conversion.ig_account_visit',
        'ig_account_visit',
        'profile_visit',
        'onsite_conversion.profile_visit',
        'page_engagement',
        'post_engagement',
        'link_click'
      ];
      resultLabel = 'interacción';
    } else {
      targetActions = ['landing_page_view', 'ig_account_visit', 'profile_visit', 'link_click'];
    }

    // Buscar en cost_per_action_type (valor pre-calculado por Meta)
    for (const type of targetActions) {
      const costAction = costPerAction.find(a => a.action_type === type);
      if (costAction) {
        const label = actionLabels[type] || resultLabel;
        return `${formatCurrency(parseFloat(costAction.value))} / ${label}`;
      }
    }

    // Calcular manualmente si no hay cost_per_action_type
    for (const type of targetActions) {
      const action = actions.find(a => a.action_type === type);
      if (action && parseFloat(action.value) > 0) {
        const cost = spend / parseFloat(action.value);
        const label = actionLabels[type] || resultLabel;
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

  // Detectar el tipo de campaña basado en las acciones y nombre
  const getCampaignType = (campaign) => {
    const actions = campaign.insights?.actions || [];
    const campaignName = (campaign.name || '').toLowerCase();

    // Buscar acciones específicas (incluir variantes con prefijo onsite_conversion)
    const hasIGVisits = actions.some(a =>
      ['ig_account_visit', 'profile_visit', 'onsite_conversion.ig_account_visit', 'onsite_conversion.profile_visit'].includes(a.action_type)
    );
    const hasLandingPageViews = actions.some(a =>
      a.action_type === 'landing_page_view'
    );

    // Detectar por nombre si contiene "instagram" o "perfil ig"
    const nameIndicatesIG = campaignName.includes('instagram') ||
                            campaignName.includes('perfil ig') ||
                            (campaignName.includes('perfil') && !campaignName.includes('web'));

    // Lógica: priorizar detección por acciones, luego por nombre
    if (hasLandingPageViews && !hasIGVisits && !nameIndicatesIG) {
      return 'traffic_web';
    }
    if (hasIGVisits || nameIndicatesIG) {
      return 'instagram';
    }
    if (hasLandingPageViews) {
      return 'traffic_web';
    }

    return 'general';
  };

  // Obtener el número de resultados desde cost_per_result
  const getResultsFromCostPerResult = (insights) => {
    const costPerResult = insights?.cost_per_result || [];
    const spend = parseFloat(insights?.spend || 0);

    if (costPerResult.length > 0 && spend > 0) {
      const result = costPerResult[0];
      if (result.values && result.values.length > 0) {
        const costValue = parseFloat(result.values[0].value);
        if (costValue > 0) {
          return Math.round(spend / costValue);
        }
      }
    }
    return 0;
  };

  // Obtener las métricas relevantes según el tipo de campaña
  const getRelevantMetrics = (campaign, insights) => {
    const campaignType = getCampaignType(campaign);
    const metrics = [];

    // Action types para Instagram (todas las variantes)
    const igVisitTypes = ['ig_account_visit', 'profile_visit', 'onsite_conversion.ig_account_visit', 'onsite_conversion.profile_visit'];

    if (campaignType === 'instagram') {
      // Calcular visitas al perfil desde cost_per_result si no está en actions
      let profileVisits = getActionValue(insights, igVisitTypes);
      if (profileVisits === 0) {
        profileVisits = getResultsFromCostPerResult(insights);
      }

      // Métricas específicas para Instagram
      metrics.push(
        { label: 'Visitas al perfil', value: profileVisits },
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
            {/* Agrupar cuentas por portafolio comercial */}
            {(() => {
              const grouped = {};
              adAccounts.forEach(account => {
                const bizName = account.business_name || 'Sin portafolio';
                if (!grouped[bizName]) grouped[bizName] = [];
                grouped[bizName].push(account);
              });

              return Object.entries(grouped).map(([bizName, accounts]) => (
                <optgroup key={bizName} label={bizName}>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({account.id.replace('act_', '')})
                    </option>
                  ))}
                </optgroup>
              ));
            })()}
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
                    <div className="campaign-controls">
                      <label className="toggle-switch">
                        <input
                          type="checkbox"
                          checked={campaign.status === 'ACTIVE'}
                          onChange={() => handleToggleCampaign(campaign.id, campaign.status)}
                          disabled={togglingCampaigns[campaign.id]}
                        />
                        <span className="toggle-slider"></span>
                      </label>
                      <span className={`campaign-status status-${campaign.status?.toLowerCase()}`}>
                        {togglingCampaigns[campaign.id] ? 'Cambiando...' : (campaign.status === 'ACTIVE' ? 'ACTIVA' : 'PAUSADA')}
                      </span>
                    </div>
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
