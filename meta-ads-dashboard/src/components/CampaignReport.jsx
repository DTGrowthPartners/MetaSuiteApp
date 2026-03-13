import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

function formatCOP(value) {
  const num = parseFloat(value || 0);
  return num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatNumber(value) {
  const num = parseInt(value || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toLocaleString('es-CO');
}

function formatPercent(value) {
  return parseFloat(value || 0).toFixed(2) + '%';
}

// Extraer acciones relevantes de los insights
function getActions(insights) {
  const actions = insights?.actions || [];
  const costPerAction = insights?.cost_per_action_type || [];
  const result = {};

  for (const a of actions) {
    if (a.action_type === 'link_click') result.clicks = parseInt(a.value || 0);
    if (a.action_type === 'landing_page_view') result.landingPageViews = parseInt(a.value || 0);
    if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') result.conversations = parseInt(a.value || 0);
    if (a.action_type === 'onsite_conversion.messaging_first_reply') result.firstReplies = parseInt(a.value || 0);
    if (a.action_type === 'lead') result.leads = parseInt(a.value || 0);
    if (a.action_type === 'purchase') result.purchases = parseInt(a.value || 0);
    if (a.action_type === 'post_engagement') result.engagement = parseInt(a.value || 0);
  }

  for (const c of costPerAction) {
    if (c.action_type === 'link_click') result.costPerClick = parseFloat(c.value || 0);
    if (c.action_type === 'landing_page_view') result.costPerLPV = parseFloat(c.value || 0);
    if (c.action_type === 'onsite_conversion.messaging_conversation_started_7d') result.costPerConversation = parseFloat(c.value || 0);
    if (c.action_type === 'lead') result.costPerLead = parseFloat(c.value || 0);
  }

  // Fallback: inline_link_clicks
  if (!result.clicks && insights?.inline_link_clicks) {
    result.clicks = parseInt(insights.inline_link_clicks);
  }

  return result;
}

// Sumar insights de múltiples campañas
function sumInsights(campaigns, key) {
  return campaigns.reduce((totals, c) => {
    const insights = c[key] || {};
    const actions = getActions(insights);
    return {
      spend: totals.spend + parseFloat(insights.spend || 0),
      impressions: totals.impressions + parseInt(insights.impressions || 0),
      reach: totals.reach + parseInt(insights.reach || 0),
      clicks: totals.clicks + (actions.clicks || 0),
      conversations: totals.conversations + (actions.conversations || 0),
      leads: totals.leads + (actions.leads || 0),
      landingPageViews: totals.landingPageViews + (actions.landingPageViews || 0),
      engagement: totals.engagement + (actions.engagement || 0)
    };
  }, { spend: 0, impressions: 0, reach: 0, clicks: 0, conversations: 0, leads: 0, landingPageViews: 0, engagement: 0 });
}

export default function CampaignReport({ slug, accessToken, adAccounts = [], loadingAccounts = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hasAccess, setHasAccess] = useState(null); // null = checking, true/false

  // Verificar si el usuario tiene acceso a la cuenta
  useEffect(() => {
    if (loadingAccounts) return;
    if (!adAccounts || adAccounts.length === 0) {
      setHasAccess(false);
      return;
    }
    // Buscar si el slug corresponde a alguna cuenta del usuario
    // El servidor devuelve el accountId, y verificamos si el usuario lo tiene
    setHasAccess(null); // se verificará después de cargar los datos
  }, [adAccounts, loadingAccounts, slug]);

  const fetchReport = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const url = `${API_BASE}/report/${slug}?accessToken=${encodeURIComponent(accessToken)}`;
      const resp = await fetch(url);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Error cargando reporte');

      // Verificar acceso: el usuario debe tener la cuenta publicitaria
      const reportAccountId = json.accountId;
      if (reportAccountId && adAccounts.length > 0) {
        const userHasAccount = adAccounts.some(a =>
          a.id === reportAccountId || a.id === reportAccountId.replace('act_', '')
        );
        setHasAccess(userHasAccount);
        if (!userHasAccount) {
          setLoading(false);
          return;
        }
      } else {
        // Si no hay cuentas aún o no hay accountId, permitir (se valida por token)
        setHasAccess(true);
      }

      setData(json);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, accessToken, adAccounts]);

  useEffect(() => {
    if (!loadingAccounts && accessToken) {
      fetchReport();
    }
    // Auto-refresh cada 30 minutos
    const interval = setInterval(() => {
      if (accessToken) fetchReport();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchReport, loadingAccounts, accessToken]);

  if (loadingAccounts || (loading && !data)) {
    return (
      <div className="report-page">
        <div className="report-loading">
          <div className="report-spinner" />
          <p>Cargando reporte...</p>
        </div>
      </div>
    );
  }

  if (hasAccess === false) {
    return (
      <div className="report-page">
        <div className="report-error">
          <h2>Sin Acceso</h2>
          <p>Tu cuenta de Facebook no tiene acceso a esta cuenta publicitaria.</p>
          <p style={{ fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
            Inicia sesión con una cuenta que tenga permisos sobre esta cuenta publicitaria.
          </p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="report-page">
        <div className="report-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={fetchReport} className="report-retry-btn">Reintentar</button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { campaigns = [], dateRange, name, businessName } = data;
  const totalsYesterday = sumInsights(campaigns, 'insightsYesterday');
  const totalsToday = sumInsights(campaigns, 'insightsToday');

  // Campañas activas con gasto
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE');
  const campaignsWithSpend = campaigns.filter(c =>
    parseFloat(c.insightsYesterday?.spend || 0) > 0 ||
    parseFloat(c.insightsToday?.spend || 0) > 0
  );

  return (
    <div className="report-page">
      {/* Header */}
      <header className="report-header">
        <div className="report-header-info">
          <h1 className="report-title">{name}</h1>
          <span className="report-business">{businessName}</span>
        </div>
        <div className="report-header-meta">
          <div className="report-date-range">
            <span className="report-date-label">Periodo</span>
            <span className="report-date-value">{dateRange?.yesterday} — {dateRange?.today}</span>
          </div>
          {lastUpdate && (
            <span className="report-updated">
              Actualizado: {lastUpdate.toLocaleTimeString('es-CO')}
              {data.cached && ' (cache)'}
            </span>
          )}
        </div>
      </header>

      {/* Summary Cards */}
      <section className="report-summary">
        <h2 className="report-section-title">Resumen General</h2>
        <div className="report-cards">
          <div className="report-card">
            <span className="report-card-label">Campañas Activas</span>
            <span className="report-card-value">{activeCampaigns.length}</span>
            <span className="report-card-sub">{campaignsWithSpend.length} con gasto</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Gasto Ayer</span>
            <span className="report-card-value">${formatCOP(totalsYesterday.spend)}</span>
            <span className="report-card-sub">COP</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Gasto Hoy</span>
            <span className="report-card-value">${formatCOP(totalsToday.spend)}</span>
            <span className="report-card-sub">COP</span>
          </div>
          <div className="report-card">
            <span className="report-card-label">Gasto Total</span>
            <span className="report-card-value">${formatCOP(totalsYesterday.spend + totalsToday.spend)}</span>
            <span className="report-card-sub">2 días</span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="report-cards report-cards--metrics">
          <div className="report-card report-card--small">
            <span className="report-card-label">Impresiones</span>
            <span className="report-card-value">{formatNumber(totalsYesterday.impressions + totalsToday.impressions)}</span>
          </div>
          <div className="report-card report-card--small">
            <span className="report-card-label">Alcance</span>
            <span className="report-card-value">{formatNumber(totalsYesterday.reach + totalsToday.reach)}</span>
          </div>
          <div className="report-card report-card--small">
            <span className="report-card-label">Clicks</span>
            <span className="report-card-value">{formatNumber(totalsYesterday.clicks + totalsToday.clicks)}</span>
          </div>
          {(totalsYesterday.conversations + totalsToday.conversations) > 0 && (
            <div className="report-card report-card--small">
              <span className="report-card-label">Conversaciones</span>
              <span className="report-card-value">{formatNumber(totalsYesterday.conversations + totalsToday.conversations)}</span>
            </div>
          )}
          {(totalsYesterday.leads + totalsToday.leads) > 0 && (
            <div className="report-card report-card--small">
              <span className="report-card-label">Leads</span>
              <span className="report-card-value">{formatNumber(totalsYesterday.leads + totalsToday.leads)}</span>
            </div>
          )}
        </div>
      </section>

      {/* Campaign Table */}
      <section className="report-campaigns">
        <h2 className="report-section-title">Campañas ({campaignsWithSpend.length})</h2>
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th className="report-th-name">Campaña</th>
                <th>Estado</th>
                <th className="report-th-num">Gasto Ayer</th>
                <th className="report-th-num">Gasto Hoy</th>
                <th className="report-th-num">Impresiones</th>
                <th className="report-th-num">Alcance</th>
                <th className="report-th-num">Clicks</th>
                <th className="report-th-num">CTR</th>
                <th className="report-th-num">CPC</th>
                <th className="report-th-num">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {campaignsWithSpend.map(c => {
                const yActions = getActions(c.insightsYesterday);
                const tActions = getActions(c.insightsToday);
                const totalClicks = (yActions.clicks || 0) + (tActions.clicks || 0);
                const totalImpressions = parseInt(c.insightsYesterday?.impressions || 0) + parseInt(c.insightsToday?.impressions || 0);
                const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
                const totalSpend = parseFloat(c.insightsYesterday?.spend || 0) + parseFloat(c.insightsToday?.spend || 0);
                const cpc = totalClicks > 0 ? (totalSpend / totalClicks).toFixed(0) : '-';

                // Resultado principal (conversaciones > leads > clicks)
                const totalConvos = (yActions.conversations || 0) + (tActions.conversations || 0);
                const totalLeads = (yActions.leads || 0) + (tActions.leads || 0);
                const totalLPV = (yActions.landingPageViews || 0) + (tActions.landingPageViews || 0);
                let resultLabel = '';
                let resultValue = '';
                if (totalConvos > 0) { resultLabel = 'Convos'; resultValue = totalConvos; }
                else if (totalLeads > 0) { resultLabel = 'Leads'; resultValue = totalLeads; }
                else if (totalLPV > 0) { resultLabel = 'LPV'; resultValue = totalLPV; }
                else if (totalClicks > 0) { resultLabel = 'Clicks'; resultValue = totalClicks; }

                return (
                  <tr key={c.id} className={c.status === 'PAUSED' ? 'report-row-paused' : ''}>
                    <td className="report-td-name">{c.name}</td>
                    <td>
                      <span className={`report-status report-status--${c.status?.toLowerCase()}`}>
                        {c.status === 'ACTIVE' ? 'Activa' : 'Pausada'}
                      </span>
                    </td>
                    <td className="report-td-num">${formatCOP(c.insightsYesterday?.spend)}</td>
                    <td className="report-td-num">${formatCOP(c.insightsToday?.spend)}</td>
                    <td className="report-td-num">{formatNumber(totalImpressions)}</td>
                    <td className="report-td-num">{formatNumber(parseInt(c.insightsYesterday?.reach || 0) + parseInt(c.insightsToday?.reach || 0))}</td>
                    <td className="report-td-num">{totalClicks || '-'}</td>
                    <td className="report-td-num">{ctr}%</td>
                    <td className="report-td-num">{cpc !== '-' ? `$${formatCOP(cpc)}` : '-'}</td>
                    <td className="report-td-num">
                      {resultValue ? (
                        <span className="report-result">
                          <strong>{resultValue}</strong> <small>{resultLabel}</small>
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="report-totals-row">
                <td className="report-td-name"><strong>TOTAL</strong></td>
                <td></td>
                <td className="report-td-num"><strong>${formatCOP(totalsYesterday.spend)}</strong></td>
                <td className="report-td-num"><strong>${formatCOP(totalsToday.spend)}</strong></td>
                <td className="report-td-num"><strong>{formatNumber(totalsYesterday.impressions + totalsToday.impressions)}</strong></td>
                <td className="report-td-num"><strong>{formatNumber(totalsYesterday.reach + totalsToday.reach)}</strong></td>
                <td className="report-td-num"><strong>{(totalsYesterday.clicks + totalsToday.clicks) || '-'}</strong></td>
                <td className="report-td-num">
                  <strong>
                    {(totalsYesterday.impressions + totalsToday.impressions) > 0
                      ? (((totalsYesterday.clicks + totalsToday.clicks) / (totalsYesterday.impressions + totalsToday.impressions)) * 100).toFixed(2) + '%'
                      : '-'}
                  </strong>
                </td>
                <td className="report-td-num">
                  <strong>
                    {(totalsYesterday.clicks + totalsToday.clicks) > 0
                      ? `$${formatCOP(((totalsYesterday.spend + totalsToday.spend) / (totalsYesterday.clicks + totalsToday.clicks)).toFixed(0))}`
                      : '-'}
                  </strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Footer */}
      <footer className="report-footer">
        <span>Meta Suite — DT Growth Partners</span>
        <button onClick={fetchReport} className="report-refresh-btn" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </footer>
    </div>
  );
}
