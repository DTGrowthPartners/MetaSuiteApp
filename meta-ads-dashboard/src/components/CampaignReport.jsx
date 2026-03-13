import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

function formatCOP(value) {
  const num = parseFloat(value || 0);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Extraer el resultado principal de los insights
function getResult(insights) {
  const actions = insights?.actions || [];
  let conversations = 0, leads = 0, linkClicks = 0, lpv = 0;

  for (const a of actions) {
    if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conversations += parseInt(a.value || 0);
    else if (a.action_type === 'onsite_conversion.messaging_first_reply' && conversations === 0) conversations += parseInt(a.value || 0);
    else if (a.action_type === 'lead') leads += parseInt(a.value || 0);
    else if (a.action_type === 'link_click') linkClicks += parseInt(a.value || 0);
    else if (a.action_type === 'landing_page_view') lpv += parseInt(a.value || 0);
  }
  if (!linkClicks && insights?.inline_link_clicks) {
    linkClicks = parseInt(insights.inline_link_clicks);
  }

  if (conversations > 0) return { count: conversations, label: 'Mensajes' };
  if (leads > 0) return { count: leads, label: 'Leads' };
  if (linkClicks > 0) return { count: linkClicks, label: 'Clicks' };
  if (lpv > 0) return { count: lpv, label: 'Visitas' };
  return { count: 0, label: 'Resultados' };
}

// Detectar ubicación por nombre (campaña o adset)
function detectLocation(name, locations = []) {
  const nameLower = name.toLowerCase();
  for (const loc of locations) {
    if (nameLower.includes(loc.toLowerCase())) return loc;
  }
  return null;
}

// Extraer nombre de servicio limpiando ubicación y prefijos
function cleanServiceName(name, locations = []) {
  let cleaned = name;
  for (const loc of locations) {
    cleaned = cleaned.replace(new RegExp(loc, 'gi'), '');
  }
  cleaned = cleaned.replace(/[-–—|:]/g, ' ').replace(/\s+/g, ' ').trim();
  cleaned = cleaned.replace(/^(EQ|Equilibrio|Tráfico|Trafico|Mensajes|Campaña|Campaign|Principal)\s*/i, '').trim();
  return cleaned || name;
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

  // Construir filas a partir de adsets (desglose por servicio)
  // Cada fila: { serviceName, location, spend, result }
  const rows = [];

  for (const campaign of campaigns) {
    const adsets = campaign.adsets || [];

    if (adsets.length > 0) {
      // Usar adsets para desglose
      for (const adset of adsets) {
        const insights = adset[insightsKey];
        const spend = parseFloat(insights?.spend || 0);
        if (spend === 0) continue;

        // Detectar ubicación: primero en adset, luego en campaña
        const location = detectLocation(adset.name, locations)
          || detectLocation(campaign.name, locations)
          || 'Otros';

        // Nombre del servicio: primero buscar en adset, luego en campaña
        const serviceName = cleanServiceName(adset.name, locations);

        const result = getResult(insights);
        rows.push({ id: adset.id, serviceName, location, spend, result });
      }
    } else {
      // Sin adsets, usar campaña directamente
      const insights = campaign[insightsKey];
      const spend = parseFloat(insights?.spend || 0);
      if (spend === 0) continue;

      const location = detectLocation(campaign.name, locations) || 'Otros';
      const serviceName = cleanServiceName(campaign.name, locations);
      const result = getResult(insights);
      rows.push({ id: campaign.id, serviceName, location, spend, result });
    }
  }

  // Agrupar por ubicación
  const grouped = {};
  for (const row of rows) {
    if (!grouped[row.location]) grouped[row.location] = [];
    grouped[row.location].push(row);
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

  // Totales por ubicación
  function getGroupTotals(rowList) {
    let totalSpend = 0;
    const resultsByLabel = {};
    for (const r of rowList) {
      totalSpend += r.spend;
      const lbl = r.result.label;
      if (!resultsByLabel[lbl]) resultsByLabel[lbl] = 0;
      resultsByLabel[lbl] += r.result.count;
    }
    const totalResults = Object.values(resultsByLabel).reduce((s, v) => s + v, 0);
    return { totalSpend, resultsByLabel, totalResults, costPer: totalResults > 0 ? totalSpend / totalResults : 0 };
  }

  function formatResultTotals(resultsByLabel) {
    const entries = Object.entries(resultsByLabel).filter(([, v]) => v > 0);
    if (entries.length === 0) return '-';
    return entries.map(([label, count]) => `${count} ${label}`).join(', ');
  }

  const grandTotals = getGroupTotals(rows);

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
          <span className="report-grand-value">{grandTotals.costPer > 0 ? formatCOP(grandTotals.costPer) : '-'}</span>
        </div>
      </section>

      {/* No data */}
      {rows.length === 0 && (
        <div className="report-no-data">
          Sin datos para {viewMode === 'yesterday' ? 'ayer' : 'hoy'}
        </div>
      )}

      {/* Grouped Tables */}
      {sortedLocations.map(location => {
        const locationRows = grouped[location];
        const locTotals = getGroupTotals(locationRows);

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
                  {locationRows.map(r => {
                    const costPer = r.result.count > 0 ? r.spend / r.result.count : 0;
                    return (
                      <tr key={r.id}>
                        <td className="report-td-service">{r.serviceName}</td>
                        <td className="report-td-num">
                          {r.result.count > 0
                            ? <span>{r.result.count} <small className="report-result-label">{r.result.label}</small></span>
                            : '-'}
                        </td>
                        <td className="report-td-num">{costPer > 0 ? formatCOP(costPer) : '-'}</td>
                        <td className="report-td-num">{formatCOP(r.spend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="report-location-totals">
                    <td><strong>Total {location}</strong></td>
                    <td className="report-td-num"><strong>{formatResultTotals(locTotals.resultsByLabel)}</strong></td>
                    <td className="report-td-num"><strong>{locTotals.costPer > 0 ? formatCOP(locTotals.costPer) : '-'}</strong></td>
                    <td className="report-td-num"><strong>{formatCOP(locTotals.totalSpend)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        );
      })}

      {/* Grand Total */}
      {sortedLocations.length > 1 && (
        <section className="report-grand-total-section">
          <div className="report-table-wrap">
            <table className="report-table">
              <tbody>
                <tr className="report-grand-total-row">
                  <td className="report-th-service"><strong>TOTAL GENERAL</strong></td>
                  <td className="report-td-num"><strong>{formatResultTotals(grandTotals.resultsByLabel)}</strong></td>
                  <td className="report-td-num"><strong>{grandTotals.costPer > 0 ? formatCOP(grandTotals.costPer) : '-'}</strong></td>
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
