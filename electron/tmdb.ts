const BASE = 'https://api.themoviedb.org/3';

export type Movie = {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  rating: number;
};

function mapMovie(item: any): Movie {
  return {
    id: item.id,
    title: item.title || item.name || 'Untitled',
    overview: item.overview || '',
    posterPath: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
    backdropPath: item.backdrop_path ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}` : null,
    releaseDate: item.release_date || item.first_air_date || '',
    rating: item.vote_average || 0
  };
}

async function tmdb(path: string, apiKey: string) {
  const sep = path.includes('?') ? '&' : '?';
  const res = await fetch(`${BASE}${path}${sep}api_key=${apiKey}`);
  if (!res.ok) throw new Error(`TMDb error ${res.status}`);
  return res.json();
}

export async function trendingMovies(apiKey: string | undefined) {
  if (!apiKey) return demoMovies;
  try {
    const data = await tmdb('/trending/movie/week?language=en-US', apiKey);
    return data.results.map(mapMovie);
  } catch {
    return demoMovies;
  }
}

export async function searchMovies(query: string, apiKey: string | undefined) {
  if (!query.trim()) return trendingMovies(apiKey);
  if (!apiKey) return demoMovies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
  try {
    const data = await tmdb(`/search/movie?language=en-US&query=${encodeURIComponent(query)}`, apiKey);
    return data.results.map(mapMovie);
  } catch {
    return demoMovies.filter((m) => m.title.toLowerCase().includes(query.toLowerCase()));
  }
}

const demoMovies: Movie[] = [
  { id: 1, title: 'Interstellar', overview: 'A team travels through a wormhole to find humanity a new home.', posterPath: null, backdropPath: null, releaseDate: '2014', rating: 8.7 },
  { id: 2, title: 'Inception', overview: 'A thief enters dreams to steal and plant ideas.', posterPath: null, backdropPath: null, releaseDate: '2010', rating: 8.4 },
  { id: 3, title: 'The Dark Knight', overview: 'Batman faces the Joker in Gotham.', posterPath: null, backdropPath: null, releaseDate: '2008', rating: 8.5 }
];
