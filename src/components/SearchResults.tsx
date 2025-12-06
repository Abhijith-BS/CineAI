import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieCard } from "./MovieCard";
import { AnimatedHeading } from "./AnimatedHeading";
import { useEffect, useState, useRef } from "react";
import gsap from "gsap";

interface SearchResultsProps {
  query: string;
  setCurrentView: (view: "home" | "chat" | "movie" | "search" | "favorites" | "watchlist") => void;
  setSelectedMovieId: (id: string) => void;
  setSelectedContentType: (type: "movie" | "tv") => void;
  onGoHome: () => void;
}

export function SearchResults({ query, setCurrentView, setSelectedMovieId, setSelectedContentType, onGoHome }: SearchResultsProps) {
  const [searchResults, setSearchResults] = useState<{ movies: any[], shows: any[] } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchContent = useAction(api.movies.searchContent);
  const searchWithExternalAPIs = useAction(api.movies.searchWithExternalAPIs);
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure content is visible immediately - no fade animations
  useEffect(() => {
    if (containerRef.current && !isLoading && searchResults) {
      // Set container to visible immediately
      gsap.set(containerRef.current, { opacity: 1, visibility: "visible" });

      // Set sections to visible immediately
      const sections = containerRef.current.querySelectorAll("section");
      sections.forEach((section) => {
        gsap.set(section, { opacity: 1, visibility: "visible" });
      });

      // Ensure all movie cards are visible
      const movieCards = containerRef.current.querySelectorAll("[class*='group cursor-pointer']");
      movieCards.forEach((card) => {
        gsap.set(card, { opacity: 1, visibility: "visible" });
      });
    }
  }, [searchResults, isLoading]);

  useEffect(() => {
    if (query.trim()) {
      setIsLoading(true);
      // First, try local + hybrid search
      searchContent({ query })
        .then(async (res) => {
          const total = (res?.movies?.length || 0) + (res?.shows?.length || 0);
          if (total === 0) {
            // Fallback to external APIs (TMDB -> OMDb)
            try {
              const external = await searchWithExternalAPIs({ query });
              setSearchResults({ movies: external.movies || [], shows: external.shows || [] });
            } catch (e) {
              console.error(e);
              setSearchResults(res);
            }
          } else {
            setSearchResults(res);
          }
        })
        .catch((e) => {
          console.error(e);
          // On error, try external directly
          searchWithExternalAPIs({ query })
            .then((external) => setSearchResults({ movies: external.movies || [], shows: external.shows || [] }))
            .catch(console.error)
            .finally(() => setIsLoading(false));
          return;
        })
        .finally(() => setIsLoading(false));
    }
  }, [query, searchContent, searchWithExternalAPIs]);

  const handleMovieClick = (movieId: string, type: "movie" | "tv" = "movie") => {
    setSelectedMovieId(movieId);
    setSelectedContentType(type);
    setCurrentView("movie");
  };

  if (isLoading || !searchResults) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const totalResults = searchResults.movies.length + searchResults.shows.length;

  return (
    <div ref={containerRef} className="space-y-8">
      {/* Back Button */}
      <button
        onClick={onGoHome}
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

      {/* Search Header */}
      <div>
        <AnimatedHeading
          text={`Search Results for "${query}"`}
          className="mb-2 text-3xl"
        />
        <p
          className="text-gray-300"
        >
          Found {totalResults} result{totalResults !== 1 ? 's' : ''}
        </p>
      </div>

      {totalResults === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-semibold text-white mb-2">No results found</h2>
          <p className="text-gray-400 mb-6">
            Try searching with different keywords or check the spelling
          </p>
          <button
            onClick={() => setCurrentView("chat")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50"
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
            Ask AI for Help
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Movies */}
          {searchResults.movies.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-purple-400 to-pink-400 rounded-full mr-3"></span>
                Movies ({searchResults.movies.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.movies.map((movie) => (
                  <MovieCard
                    key={movie._id}
                    item={movie}
                    type="movie"
                    onClick={() => handleMovieClick(movie._id, "movie")}
                  />
                ))}
              </div>
            </section>
          )}

          {/* TV Shows */}
          {searchResults.shows.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <span className="w-1 h-8 bg-gradient-to-b from-green-400 to-blue-400 rounded-full mr-3"></span>
                TV Shows ({searchResults.shows.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {searchResults.shows.map((show) => (
                  <MovieCard
                    key={show._id}
                    item={show}
                    type="tv"
                    onClick={() => handleMovieClick(show._id, "tv")}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
