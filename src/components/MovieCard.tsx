import type { Movie } from '../types/global';

type Props = {
  movie: Movie;
  onAdd?: (movie: Movie) => Promise<void> | void;
  onRemove?: () => Promise<void> | void;
  isAdded?: boolean;
};

export default function MovieCard({ movie, onAdd, onRemove, isAdded = false }: Props) {
  const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : '—';

  return (
    <div className="movie-card">
      <div className="poster">
        {movie.posterPath ? <img src={movie.posterPath} alt={movie.title} /> : <span>No poster</span>}
      </div>
      <div className="movie-body">
        <div className="movie-title">{movie.title}</div>
        <div className="meta">{year} · ⭐ {movie.rating ? movie.rating.toFixed(1) : '—'}</div>
        <p className="overview">{movie.overview || 'No overview available.'}</p>

        {onAdd && (
          <button
            className={isAdded ? 'added wide' : 'primary wide'}
            onClick={() => !isAdded && onAdd(movie)}
            disabled={isAdded}
          >
            {isAdded ? '✓ Added to Watchlist' : '+ Add to Watchlist'}
          </button>
        )}

        {onRemove && <button className="ghost wide" onClick={onRemove}>Remove</button>}
      </div>
    </div>
  );
}
