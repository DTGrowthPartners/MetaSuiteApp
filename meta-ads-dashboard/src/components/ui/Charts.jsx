/* ============================================
   FARO — Chart primitives (recharts, themed)
   Categorical series use a monochrome blue scale (#4CCCF4 → deep blue)
   to stay inside the palette. Status charts may use semáforo elsewhere.
   ============================================ */
import {
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from 'recharts';

const AXIS = '#8FA3B5';
const GRID = 'rgba(255,255,255,0.06)';

/* interpolate hex a→b at t∈[0,1] */
function lerpHex(a, b, t) {
  const pa = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)];
  const pb = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)];
  const c = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** A blue scale of n colors, light→deep, all within the Faro blue family. */
export function blueScale(n) {
  const light = '#4CCCF4';
  const deep = '#0C557E';
  if (n <= 1) return ['#199BE4'];
  return Array.from({ length: n }, (_, i) => lerpHex(light, deep, i / (n - 1)));
}

function FaroTooltip({ active, payload, label, fmt }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: 'rgba(5,7,10,0.94)', border: '1px solid rgba(25,155,228,0.35)',
      borderRadius: 10, padding: '9px 12px', boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
      fontSize: 12, color: '#EAF1F8', backdropFilter: 'blur(8px)',
    }}>
      {label != null && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#B7C4D0' }}>
          <span style={{ width: 9, height: 9, borderRadius: 3, background: p.color || p.fill || '#199BE4', display: 'inline-block' }} />
          <span>{p.name}:</span>
          <strong style={{ color: '#EAF1F8', fontVariantNumeric: 'tabular-nums' }}>{fmt ? fmt(p.value) : p.value}</strong>
        </div>
      ))}
    </div>
  );
}

/** Donut chart. data: [{name, value}]. */
export function DonutChart({ data, height = 220, fmt, centerLabel, centerValue }) {
  const colors = blueScale(data.length);
  const total = data.reduce((s, d) => s + (d.value || 0), 0);
  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name"
            cx="50%" cy="50%" innerRadius="62%" outerRadius="86%"
            paddingAngle={2} stroke="none"
          >
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Pie>
          <Tooltip content={<FaroTooltip fmt={fmt} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerValue) && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
        }}>
          {centerValue && <div style={{ fontSize: 22, fontWeight: 700, color: '#EAF1F8', fontVariantNumeric: 'tabular-nums' }}>{centerValue}</div>}
          {centerLabel && <div style={{ fontSize: 10, color: '#566575', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{centerLabel}</div>}
        </div>
      )}
      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', justifyContent: 'center', marginTop: 8 }}>
        {data.map((d, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#8FA3B5' }}>
            <span style={{ width: 9, height: 9, borderRadius: 3, background: colors[i] }} />
            {d.name}{total > 0 && <span style={{ color: '#566575' }}>· {Math.round((d.value / total) * 100)}%</span>}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Horizontal bar chart. data: [{name, value}]. */
export function HBarChart({ data, height, fmt, barLabel }) {
  const h = height || Math.max(120, data.length * 42 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 44, left: 8, bottom: 4 }}>
        <defs>
          <linearGradient id="faroHBar" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#199BE4" />
            <stop offset="100%" stopColor="#4CCCF4" />
          </linearGradient>
        </defs>
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis type="number" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} />
        <YAxis type="category" dataKey="name" width={118} tick={{ fill: '#EAF1F8', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: 'rgba(25,155,228,0.08)' }} content={<FaroTooltip fmt={fmt} />} />
        <Bar dataKey="value" fill="url(#faroHBar)" radius={[0, 6, 6, 0]} barSize={18} name={barLabel || 'Valor'}>
          <LabelList dataKey="value" position="right" formatter={fmt} style={{ fill: '#8FA3B5', fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Vertical comparison bars. data: [{name, a, b}] with seriesA/seriesB labels. */
export function CompareBars({ data, seriesA, seriesB, height = 240, fmt }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id="faroBarA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4CCCF4" /><stop offset="100%" stopColor="#2FA8DE" />
          </linearGradient>
          <linearGradient id="faroBarB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#199BE4" /><stop offset="100%" stopColor="#0F6EA6" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmt} width={48} />
        <Tooltip cursor={{ fill: 'rgba(25,155,228,0.08)' }} content={<FaroTooltip fmt={fmt} />} />
        <Bar dataKey="a" name={seriesA} fill="url(#faroBarA)" radius={[5, 5, 0, 0]} maxBarSize={38} />
        <Bar dataKey="b" name={seriesB} fill="url(#faroBarB)" radius={[5, 5, 0, 0]} maxBarSize={38} />
      </BarChart>
    </ResponsiveContainer>
  );
}
