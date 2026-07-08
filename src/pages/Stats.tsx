import { useEffect, useState } from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const COLORS = ['#f1b251', '#66d19e', '#7c9bff', '#ff6b6b', '#c084fc', '#38bdf8'];

export default function Stats() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => { window.stud.getStats().then(setStats); }, []);

  if (!stats) return <div className="panel">Loading analytics...</div>;

  const radarData = Object.entries(stats.avgByCategory as Record<string, number>).map(([cat, val]) => ({
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    score: Math.round(val * 10) / 10
  }));

  const hasData = stats.totalReviews > 0;

  return (
    <>
      <div className="topbar">
        <div>
          <div className="title">Analytics</div>
          <div className="subtitle">Your watching habits, visualized.</div>
        </div>
      </div>

      {!hasData && (
        <div className="panel">
          <p className="subtitle">No reviews logged yet. Rate a few movies and this dashboard fills in automatically.</p>
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <div className="panel stat"><b>{stats.totalReviews}</b><div className="subtitle">Movies logged</div></div>
        <div className="panel stat"><b>{stats.totalHours}</b><div className="subtitle">Hours watched</div></div>
        <div className="panel stat"><b>{stats.topRated[0]?.title || '—'}</b><div className="subtitle">Top rated</div></div>
      </div>

      <div className="hero">
        <div className="panel">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Hours watched over time</div>
          {stats.monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={stats.monthly}>
                <defs>
                  <linearGradient id="hoursFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f1b251" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="#f1b251" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="month" stroke="#9d94aa" fontSize={12} />
                <YAxis stroke="#9d94aa" fontSize={12} />
                <Tooltip contentStyle={{ background: '#17131f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#f5efe6' }} />
                <Area type="monotone" dataKey="hours" stroke="#f1b251" strokeWidth={2} fill="url(#hoursFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="subtitle">Not enough data yet.</p>}
        </div>

        <div className="panel">
          <div className="eyebrow" style={{ marginBottom: 14 }}>Where you watch</div>
          {stats.byService.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={stats.byService} dataKey="count" nameKey="service" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {stats.byService.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#17131f', border: '1px solid rgba(255,255,255,.12)', borderRadius: 12, color: '#f5efe6' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="subtitle">Not enough data yet.</p>}
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ marginBottom: 14 }}>Average score by category</div>
        {radarData.some((d) => d.score > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,.12)" />
              <PolarAngleAxis dataKey="category" stroke="#9d94aa" fontSize={12} />
              <PolarRadiusAxis domain={[0, 5]} stroke="#9d94aa" fontSize={10} />
              <Radar dataKey="score" stroke="#f1b251" fill="#f1b251" fillOpacity={0.35} />
            </RadarChart>
          </ResponsiveContainer>
        ) : <p className="subtitle">Not enough data yet.</p>}
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ marginBottom: 14 }}>Top rated</div>
        {stats.topRated.length === 0 && <p className="subtitle">No ratings yet.</p>}
        {stats.topRated.map((r: any, i: number) => (
          <div key={i} className="feed-item split">
            <b>{i + 1}. {r.title}</b>
            <span className="avg-pill">{r.average?.toFixed?.(1) ?? r.average} / 5</span>
          </div>
        ))}
      </div>
    </>
  );
}
