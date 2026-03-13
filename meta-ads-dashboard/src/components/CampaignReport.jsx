import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

function formatCOP(value) {
  const num = parseFloat(value || 0);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Extraer el resultado principal de los insights según prioridad:
// Conversaciones (mensajes) > Leads > Clicks al enlace > Landing page views
function getResult(insights) {
  const actions = insights?.actions || [];
  const costPerAction = insights?.cost_per_action_type || [];

  let conversations = 0, leads = 0, linkClicks = 0, lpv = 0;

  for (const a of actions) {
    if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conversations += parseInt(a.value || 0);
    else if (a.action_type === 'onsite_conversion.messaging_first_reply' && conversations === 0) conversations += parseInt(a.value || 0);
    else if (a.action_type === 'lead') leads += parseInt(a.value || 0);
    else if (a.action_type === 'link_click') linkClicks += parseInt(a.value || 0);
    else if (a.action_type === 'landing_page_view') lpv += parseInt(a.value || 0);
  }

  // Fallback: inline_link_clicks
  if (!linkClicks && insights?.inline_link_clicks) {
    linkClicks = parseInt(insights.inline_link_clicks);
  }

  // Prioridad: conversaciones > leads > clicks > lpv
  if (conversations > 0) return { count: conversations, label: 'Mensajes', shortLabel: 'msn' };
  if (leads > 0) return { count: leads, label: 'Leads', shortLabel: 'lead' };
  if (linkClicks > 0) return { count: linkClicks, label: 'Clicks', shortLabel: 'click' };
  if (lpv > 0) return { count: lpv, label: 'Visitas', shortLabel: 'visita' };
  return { count: 0, label: 'Resultados', shortLabel: 'res' };
}

// Extraer nombre de servicio del nombre de campaña
function extractServiceName(campaignName, locations = []) {
  let name = campaignName;
  for (const loc of locations) {
    name = name.replace(new RegExp(loc, 'gi'), '');
  }
  name = name.replace(/[-–—|]/g, ' ').replace(/\s+/g, ' ').trim();
  name = name.replace(/^(EQ|Equilibrio|Tráfico|Trafico|Mensajes|Campaña|Campaign)\s*/i, '').trim();
  return name || campaignName;
}

// Detectar ubicación de una campaña por su nombre
function detectLocation(campaignName, locations = []) {
  const nameLower = campaignName.toLowerCase();
  for (const loc of locations) {
    if (nameLower.includes(loc.toLowerCase())) return loc;
  }
  return 'Otros';
}

export default function CampaignReport({ slug, accessToken, adAccounts = [], loadingAccounts = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [hasAccess, setHasAccess] = useState(null);
  const [viewMode, setViewMode] = useState('yesterday');

  useEffect(() => {
    if (loadingAccounts) return;
    if (!adAccounts || adAccounts.length === 0) {
      setHasAccess(false);
      return;
    }
    setHasAccess(null);
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

  const { campaigns = [], dateRange, name, businessName, locations = [] } = data;

  const insightsKey = viewMode === 'yesterday' ? 'insightsYesterday' : 'insightsToday';

  // Filtrar campañas con gasto en el periodo seleccionado
  const campaignsWithSpend = campaigns.filter(c =>
    parseFloat(c[insightsKey]?.spend || 0) > 0
  );

  // Agrupar por ubicación
  const grouped = {};
  for (const c of campaignsWithSpend) {
    const location = detectLocation(c.name, locations);
    if (!grouped[location]) grouped[location] = [];
    grouped[location].push(c);
  }

  const locationOrder = [...locations];
  const sortedLocations = Object.keys(grouped).sort((a, b) => {
    const idxA = locationOrder.indexOf(a);
    const idxB = locationOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // Métricas por campaña — resultado dinámico según tipo
  function getCampaignMetrics(c) {
    const insights = c[insightsKey];
    const spend = parseFloat(insights?.spend || 0);
    const result = getResult(insights);
    const costPer = result.count > 0 ? spend / result.count : 0;
    return { spend, result, costPer };
  }

  // Totales por ubicación — agrupa resultados por label
  function getLocationTotals(campaignList) {
    let totalSpend = 0;
    const resultsByLabel = {};

    for (const c of campaignList) {
      const m = getCampaignMetrics(c);
      totalSpend += m.spend;
      const lbl = m.result.label;
      if (!resultsByLabel[lbl]) resultsByLabel[lbl] = { count: 0, shortLabel: m.result.shortLabel };
      resultsByLabel[lbl].count += m.result.count;
    }

    return { totalSpend, resultsByLabel };
  }

  // Grand totals
  const grandTotals = getLocationTotals(campaignsWithSpend);

  // Totales de resultados formateados para mostrar
  function formatResultTotals(resultsByLabel) {
    const entries = Object.entries(resultsByLabel).filter(([, v]) => v.count > 0);
    if (entries.length === 0) return '-';
    return entries.map(([label, v]) => `${v.count} ${label}`).join(', ');
  }

  // Total count sumado de todos los tipos
  function totalResultCount(resultsByLabel) {
    return Object.values(resultsByLabel).reduce((sum, v) => sum + v.count, 0);
  }

  // Costo promedio global
  const grandResultCount = totalResultCount(grandTotals.resultsByLabel);
  const grandCostPer = grandResultCount > 0 ? grandTotals.totalSpend / grandResultCount : 0;

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]} ${y}`;
  }

  return (
    <div className="report-page">
      {/* Header */}
      <header className="report-header">
        <div className="report-header-info">
          <h1 className="report-title">{name}</h1>
          <span className="report-business">{businessName}</span>
        </div>
        <div className="report-header-meta">
          {lastUpdate && (
            <span className="report-updated">
              Actualizado: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              {data.cached && ' (cache)'}
            </span>
          )}
        </div>
      </header>

      {/* Day Switch */}
      <div className="report-day-switch-wrap">
        <div className="report-day-switch">
          <button
            className={`report-day-btn ${viewMode === 'yesterday' ? 'report-day-btn--active' : ''}`}
            onClick={() => setViewMode('yesterday')}
          >
            Ayer
            <span className="report-day-date">{formatDate(dateRange?.yesterday)}</span>
          </button>
          <button
            className={`report-day-btn ${viewMode === 'today' ? 'report-day-btn--active' : ''}`}
            onClick={() => setViewMode('today')}
          >
            Hoy
            <span className="report-day-date">{formatDate(dateRange?.today)}</span>
          </button>
        </div>
      </div>

      {/* Grand Total Summary */}
      <section className="report-grand-summary">
        <div className="report-grand-card">
          <span className="report-grand-label">Resultados</span>
          <span className="report-grand-value">{formatResultTotals(grandTotals.resultsByLabel)}</span>
        </div>
        <div className="report-grand-card">
          <span className="report-grand-label">Inversión Total</span>
          <span className="report-grand-value">{formatCOP(grandTotals.totalSpend)}</span>
        </div>
        <div className="report-grand-card">
          <span className="report-grand-label">Costo Promedio</span>
          <span className="report-grand-value">{grandCostPer > 0 ? formatCOP(grandCostPer) : '-'}</span>
        </div>
      </section>

      {/* No data message */}
      {campaignsWithSpend.length === 0 && (
        <div className="report-no-data">
          Sin datos para {viewMode === 'yesterday' ? 'ayer' : 'hoy'}
        </div>
      )}

      {/* Grouped Tables */}
      {sortedLocations.map(location => {
        const locationCampaigns = grouped[location];
        const locTotals = getLocationTotals(locationCampaigns);
        const locResultCount = totalResultCount(locTotals.resultsByLabel);
        const locCostPer = locResultCount > 0 ? locTotals.totalSpend / locResultCount : 0;

        return (
          <section key={location} className="report-location-group">
            <h2 className="report-location-title">{location}</h2>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="report-th-service">Servicio</th>
                    <th className="report-th-num">Resultado</th>
                    <th className="report-th-num">Costo/res</th>
                    <th className="report-th-num">Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {locationCampaigns.map(c => {
                    const m = getCampaignMetrics(c);
                    const serviceName = extractServiceName(c.name, locations);
                    return (
                      <tr key={c.id}>
                        <td className="report-td-service">{serviceName}</td>
                        <td className="report-td-num">
                          {m.result.count > 0
                            ? <span>{m.result.count} <small className="report-result-label">{m.result.label}</small></span>
                            : '-'}
                        </td>
                        <td className="report-td-num">{m.costPer > 0 ? formatCOP(m.costPer) : '-'}</td>
                        <td className="report-td-num">{formatCOP(m.spend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="report-location-totals">
                    <td><strong>Total {location}</strong></td>
                    <td className="report-td-num"><strong>{formatResultTotals(locTotals.resultsByLabel)}</strong></td>
                    <td className="report-td-num"><strong>{locCostPer > 0 ? formatCOP(locCostPer) : '-'}</strong></td>
                    <td className="report-td-num"><strong>{formatCOP(locTotals.totalSpend)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        );
      })}

      {/* Grand Total Row */}
      {sortedLocations.length > 1 && (
        <section className="report-grand-total-section">
          <div className="report-table-wrap">
            <table className="report-table">
              <tbody>
                <tr className="report-grand-total-row">
                  <td className="report-th-service"><strong>TOTAL GENERAL</strong></td>
                  <td className="report-td-num"><strong>{formatResultTotals(grandTotals.resultsByLabel)}</strong></td>
                  <td className="report-td-num"><strong>{grandCostPer > 0 ? formatCOP(grandCostPer) : '-'}</strong></td>
                  <td className="report-td-num"><strong>{formatCOP(grandTotals.totalSpend)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

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
