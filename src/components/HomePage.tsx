import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieCard } from "./MovieCard";
import { useEffect } from "react";

interface HomePageProps {
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string) => void;
}

export function HomePage({ setCurrentView, setSelectedMovieId }: HomePageProps) {
  const trendingMovies = useQuery(api.movies.getTrendingMovies, { limit: 12 });
  const trendingShows = useQuery(api.movies.getTrendingShows, { limit: 12 });
  const topRatedMovies = useQuery(api.movies.getTopRatedMovies, { limit: 12 });
  const populateSampleData = useAction(api.movies.populateSampleData);

  // Populate sample data if no content exists
  useEffect(() => {
    if (trendingMovies && trendingMovies.length === 0) {
      populateSampleData();
    }
  }, [trendingMovies, populateSampleData]);

  const handleMovieClick = (movieId: string) => {
    setSelectedMovieId(movieId);
    setCurrentView("movie");
  };

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 md:p-12">
        <div className="relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Discover Movies with
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> AI</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl">
            Chat with our AI to find the perfect movie or show. Just describe what you're in the mood for!
          </p>
          <button
            onClick={() => setCurrentView("chat")}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105"
          >
            Start Chatting
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10 backdrop-blur-3xl"></div>
      </section>

      {/* Trending Movies */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mr-3"></span>
          Trending Movies
        </h2>
        {trendingMovies ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trendingMovies.map((movie) => (
              <MovieCard
                key={movie._id}
                item={movie}
                type="movie"
                onClick={() => handleMovieClick(movie._id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}
      </section>

      {/* Top Rated Movies */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-yellow-400 to-orange-400 rounded-full mr-3"></span>
          Top Rated Movies
        </h2>
        {topRatedMovies ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {topRatedMovies.map((movie) => (
              <MovieCard
                key={movie._id}
                item={movie}
                type="movie"
                onClick={() => handleMovieClick(movie._id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}
      </section>

      {/* Trending TV Shows */}
      <section>
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-green-400 to-blue-400 rounded-full mr-3"></span>
          Trending TV Shows
        </h2>
        {trendingShows ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {trendingShows.map((show) => (
              <MovieCard
                key={show._id}
                item={show}
                type="tv"
                onClick={() => handleMovieClick(show._id)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-gray-800 rounded-lg animate-pulse"></div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
