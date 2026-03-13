import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

function formatCOP(value) {
  const num = parseFloat(value || 0);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// Extraer conversaciones (mensajes) de los insights
function getConversations(insights) {
  const actions = insights?.actions || [];
  for (const a of actions) {
    if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') return parseInt(a.value || 0);
    if (a.action_type === 'onsite_conversion.messaging_first_reply') return parseInt(a.value || 0);
  }
  return 0;
}

// Extraer nombre de servicio del nombre de campaña (quita la ubicación y prefijos comunes)
function extractServiceName(campaignName, locations = []) {
  let name = campaignName;
  // Quitar ubicaciones del nombre
  for (const loc of locations) {
    name = name.replace(new RegExp(loc, 'gi'), '');
  }
  // Quitar separadores comunes y limpiar
  name = name.replace(/[-–—|]/g, ' ').replace(/\s+/g, ' ').trim();
  // Quitar prefijos como "EQ", "Tráfico", "Mensajes", etc.
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

  // Verificar acceso
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

  const { campaigns = [], dateRange, name, businessName, locations = [], resultLabel = 'Mensajes' } = data;

  // Filtrar campañas con gasto
  const campaignsWithSpend = campaigns.filter(c =>
    parseFloat(c.insightsYesterday?.spend || 0) > 0 ||
    parseFloat(c.insightsToday?.spend || 0) > 0
  );

  // Agrupar por ubicación
  const grouped = {};
  for (const c of campaignsWithSpend) {
    const location = detectLocation(c.name, locations);
    if (!grouped[location]) grouped[location] = [];
    grouped[location].push(c);
  }

  // Ordenar: ubicaciones conocidas primero, "Otros" al final
  const locationOrder = [...locations];
  const sortedLocations = Object.keys(grouped).sort((a, b) => {
    const idxA = locationOrder.indexOf(a);
    const idxB = locationOrder.indexOf(b);
    if (idxA === -1 && idxB === -1) return a.localeCompare(b);
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });

  // Calcular totales por campaña
  function getCampaignMetrics(c) {
    const spendY = parseFloat(c.insightsYesterday?.spend || 0);
    const spendT = parseFloat(c.insightsToday?.spend || 0);
    const msgsY = getConversations(c.insightsYesterday);
    const msgsT = getConversations(c.insightsToday);
    const totalSpend = spendY + spendT;
    const totalMsgs = msgsY + msgsT;
    const costPerMsg = totalMsgs > 0 ? totalSpend / totalMsgs : 0;
    return { spendY, spendT, totalSpend, msgsY, msgsT, totalMsgs, costPerMsg };
  }

  // Calcular totales por ubicación
  function getLocationTotals(campaignList) {
    let totalSpend = 0, totalMsgs = 0;
    for (const c of campaignList) {
      const m = getCampaignMetrics(c);
      totalSpend += m.totalSpend;
      totalMsgs += m.totalMsgs;
    }
    return { totalSpend, totalMsgs, costPerMsg: totalMsgs > 0 ? totalSpend / totalMsgs : 0 };
  }

  // Grand totals
  const grandTotals = getLocationTotals(campaignsWithSpend);

  // Formatear fecha para mostrar
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${parseInt(d)} ${months[parseInt(m) - 1]}`;
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
          <div className="report-date-badge">
            {formatDate(dateRange?.yesterday)} — {formatDate(dateRange?.today)}
          </div>
          {lastUpdate && (
            <span className="report-updated">
              Actualizado: {lastUpdate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
              {data.cached && ' (cache)'}
            </span>
          )}
        </div>
      </header>

      {/* Grand Total Summary */}
      <section className="report-grand-summary">
        <div className="report-grand-card">
          <span className="report-grand-label">Total {resultLabel}</span>
          <span className="report-grand-value">{grandTotals.totalMsgs}</span>
        </div>
        <div className="report-grand-card">
          <span className="report-grand-label">Inversión Total</span>
          <span className="report-grand-value">{formatCOP(grandTotals.totalSpend)}</span>
        </div>
        <div className="report-grand-card">
          <span className="report-grand-label">Costo Promedio</span>
          <span className="report-grand-value">{grandTotals.costPerMsg > 0 ? formatCOP(grandTotals.costPerMsg) : '-'}</span>
        </div>
      </section>

      {/* Grouped Tables */}
      {sortedLocations.map(location => {
        const locationCampaigns = grouped[location];
        const locTotals = getLocationTotals(locationCampaigns);

        return (
          <section key={location} className="report-location-group">
            <h2 className="report-location-title">{location}</h2>
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="report-th-service">Servicio</th>
                    <th className="report-th-num">{resultLabel}</th>
                    <th className="report-th-num">Costo/{resultLabel.toLowerCase().slice(0, 3)}</th>
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
                        <td className="report-td-num">{m.totalMsgs || '-'}</td>
                        <td className="report-td-num">{m.costPerMsg > 0 ? formatCOP(m.costPerMsg) : '-'}</td>
                        <td className="report-td-num">{formatCOP(m.totalSpend)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="report-location-totals">
                    <td><strong>Total {location}</strong></td>
                    <td className="report-td-num"><strong>{locTotals.totalMsgs || '-'}</strong></td>
                    <td className="report-td-num"><strong>{locTotals.costPerMsg > 0 ? formatCOP(locTotals.costPerMsg) : '-'}</strong></td>
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
                  <td className="report-td-num"><strong>{grandTotals.totalMsgs || '-'}</strong></td>
                  <td className="report-td-num"><strong>{grandTotals.costPerMsg > 0 ? formatCOP(grandTotals.costPerMsg) : '-'}</strong></td>
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
