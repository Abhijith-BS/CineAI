import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieCard } from "./MovieCard";
import { AnimatedHeading } from "./AnimatedHeading";
import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface HomePageProps {
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string) => void;
}

// Fisher-Yates shuffle algorithm for randomizing array order
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function HomePage({ setCurrentView, setSelectedMovieId }: HomePageProps) {
  // Fetch more movies than needed to allow for randomization
  const allTrendingMovies = useQuery(api.movies.getTrendingMovies, { limit: 50 });
  const allTrendingShows = useQuery(api.movies.getTrendingShows, { limit: 50 });
  const allTopRatedMovies = useQuery(api.movies.getTopRatedMovies, { limit: 50 });
  const populateSampleData = useAction(api.movies.populateSampleData);
  const populateTrendingTVShows = useAction(api.movies.populateTrendingTVShows);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLElement[]>([]);
  
  // Store shuffled results - only shuffle once when data first loads
  const [shuffledTrendingMovies, setShuffledTrendingMovies] = useState<typeof allTrendingMovies>(undefined);
  const [shuffledTrendingShows, setShuffledTrendingShows] = useState<typeof allTrendingShows>(undefined);
  const [shuffledTopRatedMovies, setShuffledTopRatedMovies] = useState<typeof allTopRatedMovies>(undefined);
  
  // Use refs to track if we've already shuffled (prevents reshuffling on data updates)
  const hasShuffledTrending = useRef(false);
  const hasShuffledShows = useRef(false);
  const hasShuffledTopRated = useRef(false);
  
  // Shuffle movies only once when data first loads (on mount/refresh)
  useEffect(() => {
    if (allTrendingMovies && !hasShuffledTrending.current) {
      setShuffledTrendingMovies(shuffleArray(allTrendingMovies).slice(0, 12));
      hasShuffledTrending.current = true;
    }
  }, [allTrendingMovies]);
  
  useEffect(() => {
    if (allTrendingShows && !hasShuffledShows.current) {
      setShuffledTrendingShows(shuffleArray(allTrendingShows).slice(0, 12));
      hasShuffledShows.current = true;
    }
  }, [allTrendingShows]);
  
  useEffect(() => {
    if (allTopRatedMovies && !hasShuffledTopRated.current) {
      setShuffledTopRatedMovies(shuffleArray(allTopRatedMovies).slice(0, 12));
      hasShuffledTopRated.current = true;
    }
  }, [allTopRatedMovies]);
  
  const trendingMovies = shuffledTrendingMovies;
  const trendingShows = shuffledTrendingShows;
  const topRatedMovies = shuffledTopRatedMovies;

  // Populate sample data if no content exists
  useEffect(() => {
    if (trendingMovies && trendingMovies.length === 0) {
      populateSampleData();
    }
  }, [trendingMovies, populateSampleData]);

  // Populate trending TV shows from TMDb if no shows exist
  useEffect(() => {
    if (allTrendingShows && allTrendingShows.length === 0) {
      populateTrendingTVShows({ limit: 50 });
    }
  }, [allTrendingShows, populateTrendingTVShows]);

  // Ensure content is visible immediately - no fade animations
  useEffect(() => {
    if (containerRef.current) {
      // Set container to visible immediately
      gsap.set(containerRef.current, { opacity: 1, visibility: "visible" });
      
      // Set sections to visible immediately
      if (sectionsRef.current.length > 0) {
        sectionsRef.current.forEach((section) => {
          gsap.set(section, { opacity: 1, visibility: "visible" });
        });
      }
      
      // Ensure all movie cards are visible
      const movieCards = containerRef.current.querySelectorAll("[class*='group cursor-pointer']");
      movieCards.forEach((card) => {
        gsap.set(card, { opacity: 1, visibility: "visible" });
      });
    }
  }, [trendingMovies, trendingShows, topRatedMovies]);

  const handleMovieClick = (movieId: string) => {
    setSelectedMovieId(movieId);
    setCurrentView("movie");
  };

  return (
    <div ref={containerRef} className="space-y-12">
      {/* Hero Section */}
      <section 
        ref={(el) => {
          if (el) sectionsRef.current[0] = el;
        }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 p-8 md:p-12"
      >
        <div className="relative z-10">
          <AnimatedHeading 
            text="Discover Movies with AI"
            className="mb-4"
          />
          <p 
            className="text-xl text-gray-300 mb-8 max-w-2xl"
          >
            Chat with our AI to find the perfect movie or show. Just describe what you're in the mood for!
          </p>
          <button
            onClick={() => setCurrentView("chat")}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-8 rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/50"
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
                boxShadow: "0 0 0 rgba(168, 85, 247, 0)",
                duration: 0.3,
                ease: "power2.out",
              });
            }}
          >
            Start Chatting
          </button>
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-pink-600/10"></div>
      </section>

      {/* Trending Movies */}
      <section
        ref={(el) => {
          if (el) sectionsRef.current[1] = el;
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full mr-3 animate-pulse"></span>
          <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Trending Movies
          </span>
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
      <section
        ref={(el) => {
          if (el) sectionsRef.current[2] = el;
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-yellow-500 to-orange-500 rounded-full mr-3 animate-pulse"></span>
          <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
            Top Rated Movies
          </span>
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
      <section
        ref={(el) => {
          if (el) sectionsRef.current[3] = el;
        }}
      >
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
          <span className="w-1 h-8 bg-gradient-to-b from-green-500 to-blue-500 rounded-full mr-3 animate-pulse"></span>
          <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Trending TV Shows
          </span>
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
