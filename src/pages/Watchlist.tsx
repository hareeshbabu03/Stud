import { useEffect, useState } from 'react';
import { Trash2, PlayCircle } from 'lucide-react';

export default function Watchlist() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { window.stud.getWatchlist().then((m) => { setMovies(m); setLoading(false); }); }, []);

  async function remove(id: number) {
    setMovies(await window.stud.removeWatchlist(id));
  }

  async function rateNow(title: string) {
    await window.stud.openManualRating(title, 'Manual entry');
  }

  return (
    <>
      <div className="topbar">
        <div>
          <div className="title">Watchlist</div>
          <div className="subtitle">Movies you've saved to watch. Rate one any time — you don't have to wait for auto-detection.</div>
        </div>
      </div>

      <div className="panel">
        {loading && <p className="subtitle">Loading...</p>}
        {!loading && movies.length === 0 && (
          <p className="subtitle">Your watchlist is empty. Add movies from Discover.</p>
        )}
        <div className="grid">
          {movies.map((m) => (
            <div key={m.id} className="movie-card">
              <div className="poster">{m.posterPath ? <img src={m.posterPath} alt={m.title} /> : 'No poster'}</div>
              <div className="movie-body">
                <div className="movie-title">{m.title}</div>
                <div className="meta">{m.releaseDate?.slice(0, 4)} · ★ {m.rating?.toFixed?.(1) ?? m.rating}</div>
                <div className="row" style={{ marginTop: 10 }}>
                  <button className="ghost" onClick={() => rateNow(m.title)}><PlayCircle size={15} /> Rate now</button>
                  <button className="ghost" onClick={() => remove(m.id)}><Trash2 size={15} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
