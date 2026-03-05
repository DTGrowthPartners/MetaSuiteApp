import { useState, useMemo } from 'react';

const ACCOUNT_STATUS_MAP = {
  1: { label: 'Activa', color: '#22c55e', icon: '✅' },
  2: { label: 'Deshabilitada', color: '#ef4444', icon: '🚫' },
  3: { label: 'Sin liquidar (Pago pendiente)', color: '#f97316', icon: '💳' },
  7: { label: 'Revision de riesgo pendiente', color: '#eab308', icon: '⏳' },
  8: { label: 'Liquidacion pendiente', color: '#eab308', icon: '⏳' },
  9: { label: 'En periodo de gracia', color: '#f97316', icon: '⚠️' },
  100: { label: 'Cierre pendiente', color: '#ef4444', icon: '🔒' },
  101: { label: 'Cerrada', color: '#6b7280', icon: '❌' },
  201: { label: 'Cualquiera activa', color: '#22c55e', icon: '✅' },
  202: { label: 'Cualquiera cerrada', color: '#6b7280', icon: '❌' },
};

const DISABLE_REASON_MAP = {
  0: 'Ninguno',
  1: 'Politica de integridad de anuncios',
  2: 'Revision IP de anuncios',
  3: 'Riesgo de pago',
  4: 'Cuenta gris cerrada',
  5: 'Revision AFC de anuncios',
  6: 'Integridad de negocio RAR',
  7: 'Cierre permanente',
  8: 'Cuenta de revendedor sin uso',
  9: 'Cuenta sin uso',
};

function AccountDashboard({ adAccounts, onBack }) {
  const [filter, setFilter] = useState('all'); // 'all', 'issues', 'active'

  const accounts = useMemo(() => {
    return adAccounts.map(acc => {
      const status = ACCOUNT_STATUS_MAP[acc.account_status] || { label: `Desconocido (${acc.account_status})`, color: '#6b7280', icon: '❓' };
      const disableReason = DISABLE_REASON_MAP[acc.disable_reason] || (acc.disable_reason ? `Codigo ${acc.disable_reason}` : 'N/A');
      const hasIssue = acc.account_status !== 1;
      const isPaymentIssue = acc.account_status === 3 || acc.disable_reason === 3;
      return { ...acc, statusInfo: status, disableReasonLabel: disableReason, hasIssue, isPaymentIssue };
    });
  }, [adAccounts]);

  const filtered = useMemo(() => {
    if (filter === 'issues') return accounts.filter(a => a.hasIssue);
    if (filter === 'active') return accounts.filter(a => !a.hasIssue);
    return accounts;
  }, [accounts, filter]);

  const issueCount = accounts.filter(a => a.hasIssue).length;
  const paymentCount = accounts.filter(a => a.isPaymentIssue).length;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={onBack}
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.15)',
            color: '#e0e0e0',
            borderRadius: 8,
            padding: '8px 16px',
            cursor: 'pointer',
            fontSize: 14
          }}
        >
          Volver
        </button>
        <h1 style={{ margin: 0, fontSize: 22, color: '#fff' }}>Estado de Cuentas Publicitarias</h1>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: '16px 20px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{accounts.length}</div>
          <div style={{ fontSize: 13, color: '#999' }}>Total cuentas</div>
        </div>
        <div style={{ background: issueCount > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)', borderRadius: 12, padding: '16px 20px', border: `1px solid ${issueCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: issueCount > 0 ? '#ef4444' : '#22c55e' }}>{issueCount}</div>
          <div style={{ fontSize: 13, color: '#999' }}>Con problemas</div>
        </div>
        <div style={{ background: paymentCount > 0 ? 'rgba(249,115,22,0.1)' : 'rgba(34,197,94,0.1)', borderRadius: 12, padding: '16px 20px', border: `1px solid ${paymentCount > 0 ? 'rgba(249,115,22,0.3)' : 'rgba(34,197,94,0.3)'}` }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: paymentCount > 0 ? '#f97316' : '#22c55e' }}>{paymentCount}</div>
          <div style={{ fontSize: 13, color: '#999' }}>Problema de pago</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {[
          { key: 'all', label: `Todas (${accounts.length})` },
          { key: 'issues', label: `Con problemas (${issueCount})` },
          { key: 'active', label: `Activas (${accounts.length - issueCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            style={{
              background: filter === tab.key ? 'rgba(74,159,255,0.2)' : 'rgba(255,255,255,0.06)',
              border: `1px solid ${filter === tab.key ? 'rgba(74,159,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: filter === tab.key ? '#4A9FFF' : '#ccc',
              borderRadius: 8,
              padding: '6px 14px',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Account list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
            {filter === 'issues' ? 'No hay cuentas con problemas' : 'No hay cuentas'}
          </div>
        )}
        {filtered.map(acc => (
          <div
            key={acc.id}
            style={{
              background: acc.isPaymentIssue ? 'rgba(249,115,22,0.08)' : acc.hasIssue ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${acc.isPaymentIssue ? 'rgba(249,115,22,0.3)' : acc.hasIssue ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {acc.name || acc.id}
              </div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                {acc.id}
                {acc.business?.name && <span> &middot; {acc.business.name}</span>}
                {acc.currency && <span> &middot; {acc.currency}</span>}
              </div>
              {acc.hasIssue && acc.disable_reason > 0 && (
                <div style={{ fontSize: 12, color: '#f97316', marginTop: 4 }}>
                  Razon: {acc.disableReasonLabel}
                </div>
              )}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              borderRadius: 20,
              background: `${acc.statusInfo.color}18`,
              border: `1px solid ${acc.statusInfo.color}40`,
              whiteSpace: 'nowrap',
              fontSize: 13,
              color: acc.statusInfo.color
            }}>
              <span>{acc.statusInfo.icon}</span>
              <span>{acc.statusInfo.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AccountDashboard;
