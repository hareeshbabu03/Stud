import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Check } from 'lucide-react';

export default function Discover() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<any[]>([]);
  const [watchlistIds, setWatchlistIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    window.stud.getWatchlist().then((list) => setWatchlistIds(new Set(list.map((m: any) => m.id))));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const handle = setTimeout(async () => {
      const results = query.trim() ? await window.stud.searchMovies(query) : await window.stud.trendingMovies();
      if (!cancelled) { setMovies(results); setLoading(false); }
    }, 350);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [query]);

  const heading = useMemo(() => (query.trim() ? `Results for "${query}"` : 'Trending this week'), [query]);

  async function addToWatchlist(movie: any) {
    setAddingId(movie.id);
    const updated = await window.stud.addWatchlist(movie);
    setWatchlistIds(new Set(updated.map((m: any) => m.id)));
    setAddingId(null);
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="title">Discover</div>
          <div className="subtitle">Search any movie and add it to your watchlist.</div>
        </div>
        <div className="row">
          <Search size={16} style={{ marginRight: -30, zIndex: 1, color: 'var(--muted)' }} />
          <input
            className="search"
            style={{ paddingLeft: 36 }}
            placeholder="Search movies..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="panel">
        <div className="eyebrow" style={{ marginBottom: 14 }}>{heading}</div>
        {loading && <p className="subtitle">Searching...</p>}
        {!loading && movies.length === 0 && <p className="subtitle">No results found.</p>}
        <div className="grid">
          {movies.map((m) => {
            const inList = watchlistIds.has(m.id);
            return (
              <div key={m.id} className="movie-card">
                <div className="poster">{m.posterPath ? <img src={m.posterPath} alt={m.title} /> : 'No poster'}</div>
                <div className="movie-body">
                  <div className="movie-title">{m.title}</div>
                  <div className="meta">{m.releaseDate?.slice(0, 4)} · ★ {m.rating?.toFixed?.(1) ?? m.rating}</div>
                  <div className="overview">{m.overview || 'No synopsis available.'}</div>
                  {inList ? (
                    <button className="added wide" disabled><Check size={15} /> In watchlist</button>
                  ) : (
                    <button className="ghost wide" onClick={() => addToWatchlist(m)} disabled={addingId === m.id}>
                      <Plus size={15} /> {addingId === m.id ? 'Adding...' : 'Add to watchlist'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
