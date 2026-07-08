import { useEffect, useState } from 'react';
import { Compass, Star, BarChart3 } from 'lucide-react';

type Page = 'home' | 'discover' | 'watchlist' | 'friends' | 'profile' | 'settings' | 'stats';

export default function HomePage({ profile, go }: { profile: any; go: (p: Page) => void }) {
  const [stats, setStats] = useState<any>(null);
  const [trending, setTrending] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    window.stud.getStats().then(setStats);
    window.stud.trendingMovies().then((r) => setTrending(r.slice(0, 6)));
    window.stud.getReviews().then((r) => setReviews(r.slice(0, 3)));
  }, []);

  const displayName = profile?.name?.split(' ')[0] || 'there';

  return (
    <>
      <div className="topbar">
        <div>
          <div className="title">Welcome back, {displayName}</div>
          <div className="subtitle">Here's what's happening with your watching habits.</div>
        </div>
      </div>

      <div className="hero">
        <div className="panel hero-card">
          <div className="eyebrow">Your stats</div>
          <div className="stat-grid" style={{ marginTop: 14 }}>
            <div className="stat"><b>{stats ? stats.totalReviews : '—'}</b><div className="subtitle">Movies logged</div></div>
            <div className="stat"><b>{stats ? stats.totalHours : '—'}</b><div className="subtitle">Hours watched</div></div>
            <div className="stat"><b>{stats ? Object.values(stats.avgByCategory as Record<string, number>).filter(Boolean).length ? avgOf(stats.avgByCategory) : '—' : '—'}</b><div className="subtitle">Avg rating</div></div>
          </div>
          <div className="row" style={{ marginTop: 18 }}>
            <button className="primary" onClick={() => go('stats')}><BarChart3 size={16} /> View analytics</button>
            <button className="ghost" onClick={() => go('discover')}><Compass size={16} /> Discover movies</button>
          </div>
        </div>
        <div className="panel hero-card">
          <div className="eyebrow">Recently rated</div>
          {reviews.length === 0 && <p className="subtitle">Nothing logged yet — watch something and Stud will pick it up automatically, or log one manually from your Watchlist.</p>}
          {reviews.map((r) => (
            <div key={r.id} className="feed-item">
              <div className="split">
                <b>{r.title}</b>
                <span className="avg-pill">{r.average?.toFixed ? r.average.toFixed(1) : r.average} / 5</span>
              </div>
              <div className="tiny-muted">{r.service}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="split" style={{ marginBottom: 14 }}>
          <div className="eyebrow">Trending this week</div>
          <button className="ghost" onClick={() => go('discover')}><Star size={14} /> Browse all</button>
        </div>
        <div className="grid">
          {trending.map((m) => (
            <div key={m.id} className="movie-card">
              <div className="poster">
                {m.posterPath ? <img src={m.posterPath} alt={m.title} /> : 'No poster'}
              </div>
              <div className="movie-body">
                <div className="movie-title">{m.title}</div>
                <div className="meta">{m.releaseDate?.slice(0, 4)} · ★ {m.rating?.toFixed?.(1) ?? m.rating}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function avgOf(byCategory: Record<string, number>) {
  const vals = Object.values(byCategory).filter((v) => v > 0);
  if (!vals.length) return '—';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}
