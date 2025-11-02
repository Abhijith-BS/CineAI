import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface MovieDetailsProps {
  movieId: string;
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
}

export function MovieDetails({ movieId, setCurrentView }: MovieDetailsProps) {
  const movie = useQuery(api.movies.getMovieById, { id: movieId as any });
  const addToFavorites = useMutation(api.movies.addToFavorites);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animate page entrance
  useEffect(() => {
    if (containerRef.current && movie) {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power4.out",
      });

      // Animate content sections with stagger
      const sections = containerRef.current.querySelectorAll("section, div");
      gsap.from(sections, {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "expo.out",
        stagger: 0.1,
        delay: 0.3,
      });
    }
  }, [movie]);

  if (!movie) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const backdropUrl = movie.backdropPath 
    ? `https://image.tmdb.org/t/p/w1280${movie.backdropPath}`
    : null;
  
  const posterUrl = movie.posterPath 
    ? `https://image.tmdb.org/t/p/w500${movie.posterPath}`
    : null;

  const handleAddToFavorites = async () => {
    try {
      await addToFavorites({
        itemType: "movie",
        itemId: movieId as any,
      });
    } catch (error) {
      console.error("Error adding to favorites:", error);
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Back Button */}
      <button
        onClick={() => setCurrentView("home")}
        className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
        onMouseEnter={(e) => {
          gsap.to(e.currentTarget, {
            x: -5,
            scale: 1.05,
            color: "#a855f7",
            duration: 0.3,
            ease: "power2.out",
          });
        }}
        onMouseLeave={(e) => {
          gsap.to(e.currentTarget, {
            x: 0,
            scale: 1,
            color: "#d1d5db",
            duration: 0.3,
            ease: "power2.out",
          });
        }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Home</span>
      </button>

      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl">
        {backdropUrl && (
          <div className="absolute inset-0">
            <img
              src={backdropUrl}
              alt={movie.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          </div>
        )}
        
        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Poster */}
            {posterUrl && (
              <div className="flex-shrink-0">
                <img
                  src={posterUrl}
                  alt={movie.title}
                  className="w-64 h-96 object-cover rounded-lg shadow-2xl"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {movie.title}
                </h1>
                {movie.tagline && (
                  <p className="text-xl text-gray-300 italic">{movie.tagline}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-white font-semibold">{movie.voteAverage.toFixed(1)}</span>
                  <span className="text-gray-400">({movie.voteCount.toLocaleString()} votes)</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">{new Date(movie.releaseDate).getFullYear()}</span>
                {movie.runtime && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{movie.runtime} min</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {movie.genres.map((genre) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-sm text-white"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                {movie.overview}
              </p>

              <div className="flex space-x-4">
                <button
                  onClick={handleAddToFavorites}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50"
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1.1,
                      boxShadow: "0 20px 40px rgba(168, 85, 247, 0.5)",
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1,
                      boxShadow: "none",
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }}
                >
                  Add to Favorites
                </button>
                <button 
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105"
                  onMouseEnter={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1.05,
                      backgroundColor: "rgba(255, 255, 255, 0.3)",
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }}
                  onMouseLeave={(e) => {
                    gsap.to(e.currentTarget, {
                      scale: 1,
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      duration: 0.3,
                      ease: "power2.out",
                    });
                  }}
                >
                  Add to Watchlist
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Movie Info</h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="text-white ml-2">{movie.status || "Released"}</span>
            </div>
            <div>
              <span className="text-gray-400">Language:</span>
              <span className="text-white ml-2">{movie.originalLanguage.toUpperCase()}</span>
            </div>
            {movie.budget && movie.budget > 0 && (
              <div>
                <span className="text-gray-400">Budget:</span>
                <span className="text-white ml-2">${movie.budget.toLocaleString()}</span>
              </div>
            )}
            {movie.revenue && movie.revenue > 0 && (
              <div>
                <span className="text-gray-400">Revenue:</span>
                <span className="text-white ml-2">${movie.revenue.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ratings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average Rating</span>
              <span className="text-white font-semibold">{movie.voteAverage.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                style={{ width: `${(movie.voteAverage / 10) * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Votes</span>
              <span className="text-white">{movie.voteCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Popularity</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {movie.popularity.toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Popularity Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
