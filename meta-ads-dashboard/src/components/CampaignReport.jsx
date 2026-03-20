import { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://metasuite.dtgrowthpartners.com/api';

function formatCOP(value) {
  const num = parseFloat(value || 0);
  return '$' + num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatCompact(value) {
  const num = parseFloat(value || 0);
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  return num.toLocaleString('es-CO');
}

function pctChange(current, previous) {
  if (!previous || previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

// Extraer métricas de actions
function extractActions(insights) {
  const actions = insights?.actions || [];
  let conversations = 0, firstReplies = 0, leads = 0, linkClicks = 0, lpv = 0;
  for (const a of actions) {
    if (a.action_type === 'onsite_conversion.messaging_conversation_started_7d') conversations = parseInt(a.value || 0);
    if (a.action_type === 'onsite_conversion.messaging_first_reply') firstReplies = parseInt(a.value || 0);
    if (a.action_type === 'lead') leads = parseInt(a.value || 0);
    if (a.action_type === 'link_click') linkClicks = parseInt(a.value || 0);
    if (a.action_type === 'landing_page_view') lpv = parseInt(a.value || 0);
  }
  return { conversations, firstReplies, leads, linkClicks, lpv, msgs: Math.max(conversations, firstReplies) };
}

// Extraer resultado principal según objetivo de campaña
function getResult(insights, objective) {
  const { msgs, leads, linkClicks, lpv } = extractActions(insights);
  const obj = (objective || '').toUpperCase();

  if (obj.includes('TRAFFIC')) {
    if (lpv > 0) return { count: lpv, label: 'Visitas' };
    if (linkClicks > 0) return { count: linkClicks, label: 'Clicks' };
  }
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
  return 'General';
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

// Agregar métricas de una lista de campañas
function aggregateCampaigns(list, insightsKey) {
  let spend = 0, impressions = 0, reach = 0, conversations = 0, firstReplies = 0;
  for (const c of list) {
    const ins = c[insightsKey] || {};
    spend += parseFloat(ins.spend || 0);
    impressions += parseInt(ins.impressions || 0);
    reach += parseInt(ins.reach || 0);
    const a = extractActions(ins);
    conversations += a.conversations;
    firstReplies += a.firstReplies;
  }
  const msgs = Math.max(conversations, firstReplies);
  return { spend, impressions, reach, conversations, firstReplies, msgs, cpr: msgs > 0 ? spend / msgs : 0 };
}

// Badge de cambio porcentual
function ChangeBadge({ current, previous, invertColor = false }) {
  const pct = pctChange(current, previous);
  if (pct === null) return null;
  const isUp = pct > 0;
  // Para CPR, subir es malo (invertColor=true)
  const isGood = invertColor ? !isUp : isUp;
  const color = isGood ? '#22c55e' : '#ef4444';
  const arrow = isUp ? '↑' : '↓';
  return (
    <span style={{ fontSize: '12px', color, fontWeight: 600 }}>
      {arrow} {Math.abs(pct).toFixed(1)}% vs mes anterior
    </span>
  );
}

// Detectar tipo de campaña usando patrones configurados
function detectCampaignType(campaignName, patterns = []) {
  if (!patterns.length) return { type: 'Otros', group: 'conversion' };
  const lower = campaignName.toLowerCase();
  for (const p of patterns) {
    if (p.patterns.some(pat => lower.includes(pat))) return { type: p.type, group: p.group };
  }
  return { type: 'Otros', group: 'conversion' };
}

// ===================== VISTA MENSUAL (estilo PDF) =====================
function MonthlyReportView({ data, locations }) {
  const { campaigns = [], dateRange, prevMonthTotals, campaignTypePatterns = [] } = data;
  const active = campaigns.filter(c => parseFloat(c.insightsLastMonth?.spend || 0) > 0);

  // Totales del mes actual
  const totals = aggregateCampaigns(active, 'insightsLastMonth');
  const prev = prevMonthTotals || {};

  // === Rendimiento por Sede ===
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

  const sedeTotals = sortedLocs.map(loc => {
    const t = aggregateCampaigns(grouped[loc], 'insightsLastMonth');
    return { loc, ...t, pctInversion: totals.spend > 0 ? (t.spend / totals.spend * 100) : 0 };
  });

  // === Rendimiento por Tipo de Campaña ===
  const byType = {};
  for (const c of active) {
    const { type, group } = detectCampaignType(c.name, campaignTypePatterns);
    if (!byType[type]) byType[type] = { campaigns: [], group };
    byType[type].campaigns.push(c);
  }

  // Separar conversión vs reconocimiento/tráfico
  const conversionTypes = [];
  const awarenessTypes = [];
  for (const [type, info] of Object.entries(byType)) {
    const t = aggregateCampaigns(info.campaigns, 'insightsLastMonth');
    const entry = { type, ...t, count: info.campaigns.length };
    if (info.group === 'awareness') {
      // Para awareness: obtener resultados principales (views, clicks, reach)
      let totalResults = 0;
      for (const c of info.campaigns) {
        const a = extractActions(c.insightsLastMonth);
        totalResults += a.lpv || a.linkClicks || a.msgs || 0;
      }
      entry.results = totalResults;
      awarenessTypes.push(entry);
    } else {
      conversionTypes.push(entry);
    }
  }
  conversionTypes.sort((a, b) => b.spend - a.spend);
  awarenessTypes.sort((a, b) => b.spend - a.spend);

  // === Top 5 campañas más eficientes ===
  const campaignsWithCPR = active
    .map(c => {
      const ins = c.insightsLastMonth;
      const a = extractActions(ins);
      const spend = parseFloat(ins?.spend || 0);
      return { name: c.name, msgs: a.conversations, firstReplies: a.firstReplies, spend, cpr: a.conversations > 0 ? spend / a.conversations : Infinity };
    })
    .filter(c => c.msgs > 0)
    .sort((a, b) => a.cpr - b.cpr)
    .slice(0, 5);

  // === Comparativa ===
  const compRows = [
    { label: 'Inversión Total', cur: totals.spend, prev: prev.spend, fmt: formatCOP },
    { label: 'Mensajes (Conv.)', cur: totals.conversations, prev: prev.conversations, fmt: v => formatCompact(v) },
    { label: 'Nuevos Contactos', cur: totals.firstReplies, prev: prev.firstReplies, fmt: v => formatCompact(v) },
    { label: 'CPR Mensajes', cur: totals.cpr, prev: prev.conversations > 0 ? prev.spend / prev.conversations : 0, fmt: formatCOP },
    { label: 'Alcance', cur: totals.reach, prev: prev.reach, fmt: v => formatCompact(v) },
  ];

  // === Insights automáticos ===
  const bestSede = sedeTotals.length > 0 ? [...sedeTotals].sort((a, b) => (a.cpr || Infinity) - (b.cpr || Infinity))[0] : null;
  const bestCampaign = campaignsWithCPR[0];
  const msgChange = pctChange(totals.conversations, prev.conversations);

  return (
    <div className="monthly-report">
      {/* Sección 1: Resumen Ejecutivo */}
      <section className="monthly-section">
        <h2 className="monthly-section-title">Resumen Ejecutivo</h2>
        <div className="monthly-summary-grid">
          <div className="monthly-metric-card">
            <span className="monthly-metric-value">{formatCOP(totals.spend)}</span>
            <span className="monthly-metric-label">Inversión Total</span>
            <ChangeBadge current={totals.spend} previous={prev.spend} />
          </div>
          <div className="monthly-metric-card">
            <span className="monthly-metric-value">{formatCompact(totals.conversations)}</span>
            <span className="monthly-metric-label">Mensajes</span>
            <ChangeBadge current={totals.conversations} previous={prev.conversations} />
          </div>
          <div className="monthly-metric-card">
            <span className="monthly-metric-value">{totals.cpr > 0 ? formatCOP(totals.cpr) : '-'}</span>
            <span className="monthly-metric-label">Costo por Resultado</span>
            <ChangeBadge current={totals.cpr} previous={prev.conversations > 0 ? prev.spend / prev.conversations : 0} invertColor />
          </div>
          <div className="monthly-metric-card">
            <span className="monthly-metric-value">{formatCompact(totals.reach)}</span>
            <span className="monthly-metric-label">Alcance</span>
            <ChangeBadge current={totals.reach} previous={prev.reach} />
          </div>
          <div className="monthly-metric-card">
            <span className="monthly-metric-value">{formatCompact(totals.impressions)}</span>
            <span className="monthly-metric-label">Impresiones</span>
            <ChangeBadge current={totals.impressions} previous={prev.impressions} />
          </div>
          <div className="monthly-metric-card">
            <span className="monthly-metric-value">{formatCompact(totals.firstReplies)}</span>
            <span className="monthly-metric-label">Nuevos Contactos</span>
            <ChangeBadge current={totals.firstReplies} previous={prev.firstReplies} />
          </div>
        </div>
      </section>

      {/* Sección 2: Rendimiento por Sede */}
      {sedeTotals.length > 0 && (
        <section className="monthly-section">
          <h2 className="monthly-section-title">Rendimiento por Sede</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="report-th-service">Sede</th>
                  <th className="report-th-num">Inversión</th>
                  <th className="report-th-num">Mensajes</th>
                  <th className="report-th-num">Nuevos Contactos</th>
                  <th className="report-th-num">CPR</th>
                  <th className="report-th-num">% Inversión</th>
                </tr>
              </thead>
              <tbody>
                {sedeTotals.map(s => (
                  <tr key={s.loc}>
                    <td className="report-td-service">{s.loc}</td>
                    <td className="report-td-num">{formatCOP(s.spend)}</td>
                    <td className="report-td-num">{s.conversations.toLocaleString('es-CO')}</td>
                    <td className="report-td-num">{s.firstReplies.toLocaleString('es-CO')}</td>
                    <td className="report-td-num">{s.cpr > 0 ? formatCOP(s.cpr) : '-'}</td>
                    <td className="report-td-num">{s.pctInversion.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="report-location-totals">
                  <td><strong>Total</strong></td>
                  <td className="report-td-num"><strong>{formatCOP(totals.spend)}</strong></td>
                  <td className="report-td-num"><strong>{totals.conversations.toLocaleString('es-CO')}</strong></td>
                  <td className="report-td-num"><strong>{totals.firstReplies.toLocaleString('es-CO')}</strong></td>
                  <td className="report-td-num"><strong>{totals.cpr > 0 ? formatCOP(totals.cpr) : '-'}</strong></td>
                  <td className="report-td-num"><strong>100%</strong></td>
                </tr>
              </tfoot>
            </table>
            {grouped['General'] && (
              <p className="monthly-footnote">* Campañas generales: reconocimiento de marca, tráfico al perfil de Instagram y campañas que cubren ambas sedes.</p>
            )}
          </div>
        </section>
      )}

      {/* Sección 3: Comparativa mensual */}
      {prev.spend > 0 && (
        <section className="monthly-section">
          <h2 className="monthly-section-title">Comparativa {dateRange?.monthBeforeLast?.label} vs {dateRange?.lastMonth?.label}</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="report-th-service">Métrica</th>
                  <th className="report-th-num">{dateRange?.monthBeforeLast?.label}</th>
                  <th className="report-th-num">{dateRange?.lastMonth?.label}</th>
                  <th className="report-th-num">Cambio</th>
                </tr>
              </thead>
              <tbody>
                {compRows.map(r => {
                  const change = pctChange(r.cur, r.prev);
                  return (
                    <tr key={r.label}>
                      <td className="report-td-service">{r.label}</td>
                      <td className="report-td-num">{r.fmt(r.prev)}</td>
                      <td className="report-td-num">{r.fmt(r.cur)}</td>
                      <td className="report-td-num">
                        {change !== null ? (
                          <span style={{ color: change > 0 ? '#22c55e' : '#ef4444' }}>
                            {change > 0 ? '↑' : '↓'} {Math.abs(change).toFixed(1)}%
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sección 4: Rendimiento por Tipo de Campaña */}
      {conversionTypes.length > 0 && (
        <section className="monthly-section">
          <h2 className="monthly-section-title">Rendimiento por Tipo de Campaña</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="report-th-service">Tipo de Campaña</th>
                  <th className="report-th-num">Inversión</th>
                  <th className="report-th-num">Mensajes</th>
                  <th className="report-th-num">Nuevos</th>
                  <th className="report-th-num">CPR</th>
                </tr>
              </thead>
              <tbody>
                {conversionTypes.map(t => (
                  <tr key={t.type}>
                    <td className="report-td-service">{t.type}</td>
                    <td className="report-td-num">{formatCOP(t.spend)}</td>
                    <td className="report-td-num">{t.conversations.toLocaleString('es-CO')}</td>
                    <td className="report-td-num">{t.firstReplies.toLocaleString('es-CO')}</td>
                    <td className="report-td-num">{t.cpr > 0 ? formatCOP(t.cpr) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sección 4b: Campañas de Reconocimiento y Tráfico */}
      {awarenessTypes.length > 0 && (
        <section className="monthly-section">
          <h2 className="monthly-section-title">Campañas de Reconocimiento y Tráfico</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="report-th-service">Tipo</th>
                  <th className="report-th-num">Inversión</th>
                  <th className="report-th-num">Resultados</th>
                  <th className="report-th-num">Alcance</th>
                </tr>
              </thead>
              <tbody>
                {awarenessTypes.map(t => (
                  <tr key={t.type}>
                    <td className="report-td-service">{t.type}</td>
                    <td className="report-td-num">{formatCOP(t.spend)}</td>
                    <td className="report-td-num">{formatCompact(t.results)}</td>
                    <td className="report-td-num">{formatCompact(t.reach)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sección 5: Top 5 Campañas más eficientes */}
      {campaignsWithCPR.length > 0 && (
        <section className="monthly-section">
          <h2 className="monthly-section-title">Top 5 Campañas Más Eficientes</h2>
          <div className="report-table-wrap">
            <table className="report-table">
              <thead>
                <tr>
                  <th className="report-th-service">Campaña</th>
                  <th className="report-th-num">Mensajes</th>
                  <th className="report-th-num">CPR</th>
                  <th className="report-th-num">Inversión</th>
                </tr>
              </thead>
              <tbody>
                {campaignsWithCPR.map((c, i) => (
                  <tr key={i}>
                    <td className="report-td-service">{c.name}</td>
                    <td className="report-td-num">{c.msgs}</td>
                    <td className="report-td-num">{formatCOP(c.cpr)}</td>
                    <td className="report-td-num">{formatCOP(c.spend)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Sección 6: Insights */}
      <section className="monthly-section">
        <h2 className="monthly-section-title">Insights y Aprendizajes</h2>
        <div className="monthly-insights">
          {msgChange !== null && (
            <div className="monthly-insight-card">
              <h3>{msgChange > 0 ? 'Crecimiento' : 'Disminución'} de {Math.abs(msgChange).toFixed(0)}% en mensajes</h3>
              <p>
                En {dateRange?.lastMonth?.label} se generaron {totals.conversations.toLocaleString('es-CO')} conversaciones
                vs {(prev.conversations || 0).toLocaleString('es-CO')} en {dateRange?.monthBeforeLast?.label}.
                La inversión fue de {formatCOP(totals.spend)} vs {formatCOP(prev.spend || 0)}.
              </p>
            </div>
          )}
          {bestSede && bestSede.cpr > 0 && (
            <div className="monthly-insight-card">
              <h3>{bestSede.loc} lidera en eficiencia</h3>
              <p>
                {bestSede.loc} logró un CPR de {formatCOP(bestSede.cpr)} por mensaje,
                con {bestSede.conversations.toLocaleString('es-CO')} mensajes y una inversión de {formatCOP(bestSede.spend)}.
              </p>
            </div>
          )}
          {bestCampaign && (
            <div className="monthly-insight-card">
              <h3>Campaña estrella: CPR de {formatCOP(bestCampaign.cpr)}</h3>
              <p>
                La campaña &ldquo;{bestCampaign.name}&rdquo; logró {bestCampaign.msgs} mensajes con un costo por resultado
                de solo {formatCOP(bestCampaign.cpr)}. Es el mejor rendimiento del mes.
              </p>
            </div>
          )}
        </div>
      </section>

      {active.length === 0 && (
        <div className="report-no-data">Sin datos para el mes pasado</div>
      )}
    </div>
  );
}

// ===================== VISTA DIARIA (original) =====================
function DailyReportView({ campaigns, insightsKey, viewMode, locations }) {
  const active = campaigns.filter(c => parseFloat(c[insightsKey]?.spend || 0) > 0);

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

  return (
    <>
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
        <div className="report-no-data">Sin datos para {viewMode === 'yesterday' ? 'ayer' : 'hoy'}</div>
      )}

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
    </>
  );
}

// ===================== COMPONENTE PRINCIPAL =====================
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

      {/* Content */}
      {viewMode === 'lastMonth' ? (
        <MonthlyReportView data={data} locations={locations} />
      ) : (
        <DailyReportView
          campaigns={campaigns}
          insightsKey={viewMode === 'yesterday' ? 'insightsYesterday' : 'insightsToday'}
          viewMode={viewMode}
          locations={locations}
        />
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
