import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

interface TrendChartProps {
  data: { label: string; value: number }[];
}

export function TrendChart({ data }: TrendChartProps) {
  const { t } = useTranslation();
  if (data.length === 0)
    return <p style={{ color: 'var(--text3)', fontSize: 14, margin: 0 }}>{t('common:noData')}</p>;

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorOrange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--orange)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="var(--orange)" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="label" stroke="var(--border-bright)" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
          <YAxis stroke="var(--border-bright)" tick={{ fill: 'var(--text3)', fontSize: 12 }} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg2)', border: '1px solid var(--border)' }}
            itemStyle={{ color: 'var(--orange)' }}
            formatter={(value) => [`${value ?? 0} h`, t('analytics:panels.timeSeries')]}
          />
          <Area type="monotone" dataKey="value" stroke="var(--orange)" fillOpacity={1} fill="url(#colorOrange)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
