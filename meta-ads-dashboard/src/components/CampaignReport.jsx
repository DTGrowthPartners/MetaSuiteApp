import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

function formatCOP(value) {
  const num = parseFloat(value || 0);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Extraer resultado principal según objetivo de campaña
function getResult(insights, objective) {
  const actions = insights?.actions || [];
  let conversations = 0, firstReplies = 0, leads = 0, linkClicks = 0, lpv = 0;

  for (const a of actions) {
    if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conversations = parseInt(a.value || 0);
    if (a.action_type === 'onsite_conversion.messaging_first_reply') firstReplies = parseInt(a.value || 0);
    if (a.action_type === 'lead') leads = parseInt(a.value || 0);
    if (a.action_type === 'link_click') linkClicks = parseInt(a.value || 0);
    if (a.action_type === 'landing_page_view') lpv = parseInt(a.value || 0);
  }

  const msgs = Math.max(conversations, firstReplies);
  const obj = (objective || '').toUpperCase();

  // Tráfico: mostrar visitas a la página (landing_page_view), NO link_clicks
  if (obj.includes('TRAFFIC')) {
    if (lpv > 0) return { count: lpv, label: 'Visitas' };
    if (linkClicks > 0) return { count: linkClicks, label: 'Clicks' };
  }

  // Todo lo demás: mensajes primero (WhatsApp/Messenger), luego leads, luego clicks
  if (msgs > 0) return { count: msgs, label: 'Mensajes' };
  if (leads > 0) return { count: leads, label: 'Leads' };
  if (linkClicks > 0) return { count: linkClicks, label: 'Clicks' };
  if (lpv > 0) return { count: lpv, label: 'Visitas' };
  return { count: 0, label: 'Resultados' };
}

function detectLocation(campaignName, locations = []) {
  const nameLower = campaignName.toLowerCase();
  for (const loc of locations) {
    if (nameLower.includes(loc.toLowerCase())) return loc;
  }
  return 'Otros';
}

function cleanName(campaignName, locations = []) {
  let name = campaignName;
  for (const loc of locations) {
    name = name.replace(new RegExp(loc, 'gi'), '');
  }
  name = name.replace(/[-–—|:]/g, ' ').replace(/\s+/g, ' ').trim();
  name = name.replace(/^(EQ|Equilibrio|Tráfico|Trafico|Mensajes|Campaña|Campaign)\s*/i, '').trim();
  return name || campaignName;
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
    if (!adAccounts || adAccounts.length === 0) { setHasAccess(false); return; }
    setHasAccess(null);
  }, [adAccounts, loadingAccounts, slug]);

  const fetchReport = useCallback(async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch(`${API_BASE}/report/${slug}?accessToken=${encodeURIComponent(accessToken)}`);
      const json = await resp.json();
      if (!json.success) throw new Error(json.error || 'Error cargando reporte');

      const reportAccountId = json.accountId;
      if (reportAccountId && adAccounts.length > 0) {
        const has = adAccounts.some(a => a.id === reportAccountId || a.id === reportAccountId.replace('act_', ''));
        setHasAccess(has);
        if (!has) { setLoading(false); return; }
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
    if (!loadingAccounts && accessToken) fetchReport();
    const interval = setInterval(() => { if (accessToken) fetchReport(); }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchReport, loadingAccounts, accessToken]);

  if (loadingAccounts || (loading && !data)) {
    return (<div className="report-page"><div className="report-loading"><div className="report-spinner" /><p>Cargando reporte...</p></div></div>);
  }
  if (hasAccess === false) {
    return (<div className="report-page"><div className="report-error"><h2>Sin Acceso</h2><p>Tu cuenta de Facebook no tiene acceso a esta cuenta publicitaria.</p></div></div>);
  }
  if (error && !data) {
    return (<div className="report-page"><div className="report-error"><h2>Error</h2><p>{error}</p><button onClick={fetchReport} className="report-retry-btn">Reintentar</button></div></div>);
  }
  if (!data) return null;

  const { campaigns = [], dateRange, name, businessName, locations = [] } = data;
  const insightsKey = viewMode === 'yesterday' ? 'insightsYesterday' : viewMode === 'today' ? 'insightsToday' : 'insightsLastMonth';

  // Campañas con gasto en el periodo
  const active = campaigns.filter(c => parseFloat(c[insightsKey]?.spend || 0) > 0);

  // Agrupar por ubicación
  const grouped = {};
  for (const c of active) {
    const loc = detectLocation(c.name, locations);
    if (!grouped[loc]) grouped[loc] = [];
    grouped[loc].push(c);
  }

  const sortedLocs = Object.keys(grouped).sort((a, b) => {
    const iA = locations.indexOf(a), iB = locations.indexOf(b);
    if (iA === -1 && iB === -1) return a.localeCompare(b);
    if (iA === -1) return 1;
    if (iB === -1) return -1;
    return iA - iB;
  });

  // Totales
  function getGroupTotals(list) {
    let spend = 0;
    const byLabel = {};
    for (const c of list) {
      const ins = c[insightsKey];
      spend += parseFloat(ins?.spend || 0);
      const r = getResult(ins, c.objective);
      if (!byLabel[r.label]) byLabel[r.label] = 0;
      byLabel[r.label] += r.count;
    }
    const total = Object.values(byLabel).reduce((s, v) => s + v, 0);
    return { spend, byLabel, total, costPer: total > 0 ? spend / total : 0 };
  }

  function fmtResults(byLabel) {
    const e = Object.entries(byLabel).filter(([, v]) => v > 0);
    return e.length ? e.map(([l, c]) => `${c} ${l}`).join(', ') : '-';
  }

  const grand = getGroupTotals(active);

  function formatDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${parseInt(day)} ${months[parseInt(m)-1]} ${y}`;
  }

  return (
    <div className="report-page">
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
          <button className={`report-day-btn ${viewMode === 'yesterday' ? 'report-day-btn--active' : ''}`} onClick={() => setViewMode('yesterday')}>
            Ayer<span className="report-day-date">{formatDate(dateRange?.yesterday)}</span>
          </button>
          <button className={`report-day-btn ${viewMode === 'today' ? 'report-day-btn--active' : ''}`} onClick={() => setViewMode('today')}>
            Hoy<span className="report-day-date">{formatDate(dateRange?.today)}</span>
          </button>
          <button className={`report-day-btn ${viewMode === 'lastMonth' ? 'report-day-btn--active' : ''}`} onClick={() => setViewMode('lastMonth')}>
            Mes pasado<span className="report-day-date">{dateRange?.lastMonth?.label || ''}</span>
          </button>
        </div>
      </div>

      {/* Summary */}
      <section className="report-grand-summary">
        <div className="report-grand-card">
          <span className="report-grand-label">Resultados</span>
          <span className="report-grand-value">{fmtResults(grand.byLabel)}</span>
        </div>
        <div className="report-grand-card">
          <span className="report-grand-label">Inversión Total</span>
          <span className="report-grand-value">{formatCOP(grand.spend)}</span>
        </div>
        <div className="report-grand-card">
          <span className="report-grand-label">Costo Promedio</span>
          <span className="report-grand-value">{grand.costPer > 0 ? formatCOP(grand.costPer) : '-'}</span>
        </div>
      </section>

      {active.length === 0 && (
        <div className="report-no-data">Sin datos para {viewMode === 'yesterday' ? 'ayer' : viewMode === 'today' ? 'hoy' : 'el mes pasado'}</div>
      )}

      {/* Grouped Tables */}
      {sortedLocs.map(loc => {
        const list = grouped[loc];
        const totals = getGroupTotals(list);

        return (
          <section key={loc} className="report-location-group">
            <h2 className="report-location-title">{loc}</h2>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="report-th-service">Campaña</th>
                    <th className="report-th-num">Resultado</th>
                    <th className="report-th-num">Costo/res</th>
                    <th className="report-th-num">Gastado</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map(c => {
                    const ins = c[insightsKey];
                    const spend = parseFloat(ins?.spend || 0);
                    const r = getResult(ins, c.objective);
                    const costPer = r.count > 0 ? spend / r.count : 0;
                    return (
                      <tr key={c.id}>
                        <td className="report-td-service">{cleanName(c.name, locations)}</td>
                        <td className="report-td-num">
                          {r.count > 0 ? <span>{r.count} <small className="report-result-label">{r.label}</small></span> : '-'}
                        </td>
                        <td className="report-td-num">{costPer > 0 ? formatCOP(costPer) : '-'}</td>
                        <td className="report-td-num">{formatCOP(spend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="report-location-totals">
                    <td><strong>Total {loc}</strong></td>
                    <td className="report-td-num"><strong>{fmtResults(totals.byLabel)}</strong></td>
                    <td className="report-td-num"><strong>{totals.costPer > 0 ? formatCOP(totals.costPer) : '-'}</strong></td>
                    <td className="report-td-num"><strong>{formatCOP(totals.spend)}</strong></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        );
      })}

      {sortedLocs.length > 1 && (
        <section className="report-grand-total-section">
          <div className="report-table-wrap">
            <table className="report-table">
              <tbody>
                <tr className="report-grand-total-row">
                  <td className="report-th-service"><strong>TOTAL GENERAL</strong></td>
                  <td className="report-td-num"><strong>{fmtResults(grand.byLabel)}</strong></td>
                  <td className="report-td-num"><strong>{grand.costPer > 0 ? formatCOP(grand.costPer) : '-'}</strong></td>
                  <td className="report-td-num"><strong>{formatCOP(grand.spend)}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      <footer className="report-footer">
        <span>Meta Suite — DT Growth Partners</span>
        <button onClick={fetchReport} className="report-refresh-btn" disabled={loading}>
          {loading ? 'Actualizando...' : 'Actualizar'}
        </button>
      </footer>
    </div>
  );
}
