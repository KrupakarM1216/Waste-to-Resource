import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

/**
 * Illustrative 6-month price trend for the valued material, ending at the
 * current AI estimate. The series is deterministically generated from the
 * material name + value (same input → same curve), and clearly labeled as
 * illustrative — it is NOT real market data.
 */
function buildTrend(material, currentValue) {
  // Small deterministic hash so each material gets its own wiggle.
  let hash = 0;
  for (let i = 0; i < material.length; i++) {
    hash = (hash * 31 + material.charCodeAt(i)) % 1000;
  }

  const shape = [0.86, 0.91, 0.85, 0.93, 0.97, 1.0];
  const now = new Date();

  return shape.map((f, i) => {
    // Last point is exactly the current estimate; earlier points wiggle ±3%.
    const wiggle = i === shape.length - 1 ? 0 : (((hash >> i) % 7) - 3) / 100;
    const date = new Date(now.getFullYear(), now.getMonth() - (shape.length - 1 - i), 1);
    return {
      month: date.toLocaleString('en', { month: 'short' }),
      price: Math.max(1, Math.round(currentValue * (f + wiggle))),
    };
  });
}

const formatINR = (v) => `₹${Number(v).toLocaleString('en-IN')}`;

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-forest-100 bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-forest-500">{label}</p>
      <p className="text-sm font-bold text-forest-900">{formatINR(payload[0].value)}/kg</p>
    </div>
  );
}

export default function PriceTrendChart({ material, currentValue }) {
  const data = buildTrend(material, currentValue);

  return (
    <div className="rounded-2xl border border-forest-100 bg-white p-6 shadow-card">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="text-sm font-bold text-forest-900">
          {material} — 6-month price trend (₹/kg)
        </h4>
        <span className="shrink-0 rounded-full bg-earth-100 px-2.5 py-0.5 text-[11px] font-semibold text-earth-700">
          Illustrative
        </span>
      </div>

      <div className="mt-4 h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#dcebe0" strokeDasharray="3 5" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: '#3f7f5e', fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#dcebe0' }}
            />
            <YAxis
              tickFormatter={formatINR}
              tick={{ fill: '#3f7f5e', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={64}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#8fbda2', strokeWidth: 1 }} />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#2d6a4f"
              strokeWidth={2}
              dot={{ r: 3, fill: '#2d6a4f', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#2d6a4f', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-xs text-forest-800/50">
        Simulated trend for demonstration — not real market data. Final point is today's AI estimate.
      </p>
    </div>
  );
}
