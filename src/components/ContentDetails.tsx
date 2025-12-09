
import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import gsap from "gsap";
import { toast } from "sonner";
import { SignInModal } from "./SignInModal";
import { ReviewsSection } from "./ReviewsSection";
import { useTheme } from "../context/ThemeContext";

interface ContentDetailsProps {
  contentId: any;
  contentType: any;
  setCurrentView: (view: any) => void;
  onGoHome: () => void;
  onSignIn: () => void;
  extraActions?: React.ReactNode;
  hideDefaultActions?: boolean;
  onDataLoaded?: (data: any) => void;
  onBackToSearch?: () => void;
}

export function ContentDetails({ contentId, contentType, setCurrentView, onGoHome, onSignIn, extraActions, hideDefaultActions, onDataLoaded, onBackToSearch }: ContentDetailsProps) {
  const movie = contentType === "movie" ? useQuery(api.movies.getMovieById, { id: contentId as any }) : null;
  const show = contentType === "tv" ? useQuery(api.movies.getShowById, { id: contentId as any }) : null;
  const loggedInUser = useQuery(api.auth.loggedInUser);
  const addToFavorites = useMutation(api.movies.addToFavorites);
  const addToWatchlist = useMutation(api.movies.addToWatchlist);
  const getOTTPlatforms = useAction(api.externalApi.getOTTPlatforms);
  const getTVShowOTTPlatforms = useAction(api.externalApi.getTVShowOTTPlatforms);
  const getTVShowSeasons = useAction(api.externalApi.getTVShowSeasons);
  const getTVShowCredits = useAction(api.externalApi.getTVShowCredits);
  const getContentLanguages = useAction(api.externalApi.getContentLanguages);

  // Fetch interaction status (isFavorite, isWatchlisted)
  const interactionStatus = useQuery(api.movies.getItemInteractionStatus, {
    itemType: contentType,
    itemId: contentId as any,
  });

  const [ottPlatforms, setOttPlatforms] = useState<Array<{ name: string; type: string; logo: string }>>([]);
  const [seasons, setSeasons] = useState<any>(null);
  const [credits, setCredits] = useState<any>(null);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loadingOTT, setLoadingOTT] = useState(true);
  const showSignInModalState = useState(false);
  const [showSignInModal, setShowSignInModal] = showSignInModalState;
  const containerRef = useRef<HTMLDivElement>(null);
  const { setThemeFromImage, resetTheme } = useTheme();

  const content = contentType === "movie" ? movie : show;
  const tmdbId = content?.tmdbId;

  const backdropUrl = content && (content as any).backdropPath
    ? ((content as any).backdropPath.startsWith("http://") || (content as any).backdropPath.startsWith("https://"))
      ? (content as any).backdropPath
      : `https://image.tmdb.org/t/p/w1280${(content as any).backdropPath}`
    : null;

  const posterUrl = content && (content as any).posterPath
    ? ((content as any).posterPath.startsWith("http://") || (content as any).posterPath.startsWith("https://"))
      ? (content as any).posterPath
      : `https://image.tmdb.org/t/p/w500${(content as any).posterPath}`
    : null;

  // Update theme based on poster
  useEffect(() => {
    if (posterUrl) {
      setThemeFromImage(posterUrl);
    }
    if (content && onDataLoaded) {
      onDataLoaded(content);
    }
    return () => resetTheme();
  }, [posterUrl, content]);

  // Fetch OTT platforms
  useEffect(() => {
    if (tmdbId && content) {
      setLoadingOTT(true);
      const fetchOTT = async () => {
        try {
          const platforms = contentType === "movie"
            ? await getOTTPlatforms({ tmdbId, country: "IN" })
            : await getTVShowOTTPlatforms({ tmdbId, country: "IN" });

          if (platforms && Array.isArray(platforms) && platforms.length > 0) {
            setOttPlatforms(platforms);
          } else {
            setOttPlatforms([]);
          }
        } catch (error) {
          console.error("Error fetching OTT platforms:", error);
          setOttPlatforms([]);
        } finally {
          setLoadingOTT(false);
        }
      };
      fetchOTT();
    } else if (!tmdbId) {
      setLoadingOTT(false);
      setOttPlatforms([]);
    }
  }, [tmdbId, contentType, content, getOTTPlatforms, getTVShowOTTPlatforms]);

  // Fetch TV show seasons and credits
  useEffect(() => {
    if (contentType === "tv" && tmdbId) {
      const fetchTVDetails = async () => {
        try {
          const [seasonsData, creditsData] = await Promise.all([
            getTVShowSeasons({ tmdbId }),
            getTVShowCredits({ tmdbId }),
          ]);
          if (seasonsData) setSeasons(seasonsData);
          if (creditsData) setCredits(creditsData);
        } catch (error) {
          console.error("Error fetching TV show details:", error);
        }
      };
      fetchTVDetails();
    }
  }, [tmdbId, contentType, getTVShowSeasons, getTVShowCredits]);

  // Fetch available languages
  useEffect(() => {
    if (tmdbId && contentType) {
      const fetchLanguages = async () => {
        try {
          const langs = await getContentLanguages({ tmdbId, type: contentType });
          setLanguages(langs);
        } catch (error) {
          console.error("Error fetching languages:", error);
        }
      };
      fetchLanguages();
    }
  }, [tmdbId, contentType, getContentLanguages]);

  // Animate page entrance
  useEffect(() => {
    if (containerRef.current && content) {
      gsap.from(containerRef.current, {
        opacity: 0,
        y: 40,
        duration: 1,
        ease: "power4.out",
      });

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
  }, [content]);

  if (!content) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  const title = contentType === "movie" ? (content as any).title : (content as any).name;
  const releaseDate = contentType === "movie" ? (content as any).releaseDate : (content as any).firstAirDate;
  const lastAirDate = contentType === "tv" ? (content as any).lastAirDate : undefined;
  const tagline = contentType === "movie" ? (content as any).tagline : undefined;
  const runtime = contentType === "movie" ? (content as any).runtime : undefined;
  const numberOfSeasons = contentType === "tv" ? (content as any).numberOfSeasons : undefined;
  const numberOfEpisodes = contentType === "tv" ? (content as any).numberOfEpisodes : undefined;
  const status = (content as any).status;
  const budget = contentType === "movie" ? (content as any).budget : undefined;
  const revenue = contentType === "movie" ? (content as any).revenue : undefined;







  const handleAddToFavorites = async () => {
    if (!loggedInUser || !loggedInUser.email) {
      setShowSignInModal(true);
      return;
    }

    try {
      const result = await addToFavorites({
        itemType: contentType,
        itemId: contentId as any,
      });
      if (result.added) {
        toast.success("Added to favorites");
      } else {
        toast.success("Removed from favorites");
      }
    } catch (error) {
      console.error("Error toggling favorites:", error);
      toast.error("Failed to update favorites");
    }
  };

  const handleAddToWatchlist = async () => {
    if (!loggedInUser || !loggedInUser.email) {
      setShowSignInModal(true);
      return;
    }

    try {
      const result = await addToWatchlist({
        itemType: contentType,
        itemId: contentId as any,
      });
      if (result.added) {
        toast.success("Added to watchlist");
      } else {
        toast.success("Removed from watchlist");
      }
    } catch (error) {
      console.error("Error toggling watchlist:", error);
      toast.error("Failed to update watchlist");
    }
  };

  return (
    <div ref={containerRef} className="space-y-8">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        onSignIn={() => {
          setShowSignInModal(false);
          onSignIn();
        }}
      />
      {/* Back Buttons */}
      <div className="flex gap-4 items-center">
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

        {onBackToSearch && (
          <button
            onClick={onBackToSearch}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors border-l border-gray-600 pl-4"
            onMouseEnter={(e) => {
              gsap.to(e.currentTarget, {
                x: 5,
                scale: 1.05,
                color: "#e879f9",
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Back to Search</span>
          </button>
        )}
      </div>

      {/* Hero Section */}
      < div className="relative overflow-hidden rounded-2xl" >
        {backdropUrl && (
          <div className="absolute inset-0">
            <img
              src={backdropUrl}
              alt={title}
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
                  alt={title}
                  className="w-64 h-96 object-cover rounded-lg shadow-2xl"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 space-y-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                  {title}
                </h1>
                {tagline && (
                  <p className="text-xl text-gray-300 italic">{tagline}</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-400">⭐</span>
                  <span className="text-white font-semibold">{(content as any).voteAverage.toFixed(1)}</span>
                  <span className="text-gray-400">({(content as any).voteCount.toLocaleString()} votes)</span>
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-300">{new Date(releaseDate).getFullYear()}</span>
                {contentType === "tv" && lastAirDate && (
                  <>
                    <span className="text-gray-400">-</span>
                    <span className="text-gray-300">{new Date(lastAirDate).getFullYear()}</span>
                  </>
                )}
                {runtime && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{runtime} min</span>
                  </>
                )}
                {contentType === "tv" && numberOfSeasons && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{numberOfSeasons} Season{numberOfSeasons !== 1 ? 's' : ''}</span>
                  </>
                )}
                {contentType === "tv" && numberOfEpisodes && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-300">{numberOfEpisodes} Episode{numberOfEpisodes !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {(content as any).genres.map((genre: string) => (
                  <span
                    key={genre}
                    className="px-3 py-1 bg-white/20 rounded-full text-sm text-white"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
                {(content as any).overview}
              </p>

              <div className="flex space-x-4">
                {!hideDefaultActions && (
                  <>
                    <button
                      onClick={handleAddToFavorites}
                      className={`px-6 py-3 font-semibold rounded-full transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${interactionStatus?.isFavorite
                        ? "bg-red-600 hover:bg-red-700 text-white hover:shadow-red-500/50"
                        : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white hover:shadow-purple-500/50"
                        }`}
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                          scale: 1.1,
                          boxShadow: interactionStatus?.isFavorite
                            ? "0 20px 40px rgba(220, 38, 38, 0.5)"
                            : "0 20px 40px rgba(168, 85, 247, 0.5)",
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
                      {interactionStatus?.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                    </button>
                    <button
                      onClick={handleAddToWatchlist}
                      className={`px-6 py-3 font-semibold rounded-full transition-all duration-300 transform hover:scale-105 ${interactionStatus?.isWatchlisted
                        ? "bg-red-900/50 hover:bg-red-900/70 text-red-200 border border-red-800"
                        : "bg-white/20 hover:bg-white/30 text-white"
                        }`}
                      onMouseEnter={(e) => {
                        gsap.to(e.currentTarget, {
                          scale: 1.05,
                          backgroundColor: interactionStatus?.isWatchlisted
                            ? "rgba(127, 29, 29, 0.7)"
                            : "rgba(255, 255, 255, 0.3)",
                          duration: 0.3,
                          ease: "power2.out",
                        });
                      }}
                      onMouseLeave={(e) => {
                        gsap.to(e.currentTarget, {
                          scale: 1,
                          backgroundColor: interactionStatus?.isWatchlisted
                            ? "rgba(127, 29, 29, 0.5)"
                            : "rgba(255, 255, 255, 0.2)",
                          duration: 0.3,
                          ease: "power2.out",
                        });
                      }}
                    >
                      {interactionStatus?.isWatchlisted ? "Remove from Watchlist" : "Add to Watchlist"}
                    </button>
                  </>
                )}
                {extraActions}
              </div>
            </div>
          </div>
        </div>
      </div >

      {/* OTT Platforms Section */}
      < section className="bg-white/10 rounded-lg p-6" >
        <h3 className="text-xl font-semibold text-white mb-4">Where to Watch</h3>
        {
          loadingOTT ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
            </div>
          ) : ottPlatforms.length > 0 ? (
            <div className="space-y-4">
              {ottPlatforms.filter(p => p.type === "stream").length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Streaming</h4>
                  <div className="flex flex-wrap gap-4">
                    {ottPlatforms.filter(p => p.type === "stream").map((platform) => (
                      <div key={platform.name} className="flex items-center space-x-2 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                        {platform.logo && (
                          <img src={platform.logo} alt={platform.name} className="w-8 h-8 object-contain" />
                        )}
                        <span className="text-white text-sm font-medium">{platform.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ottPlatforms.filter(p => p.type === "rent").length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Rent</h4>
                  <div className="flex flex-wrap gap-4">
                    {ottPlatforms.filter(p => p.type === "rent").map((platform) => (
                      <div key={platform.name} className="flex items-center space-x-2 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                        {platform.logo && (
                          <img src={platform.logo} alt={platform.name} className="w-8 h-8 object-contain" />
                        )}
                        <span className="text-white text-sm font-medium">{platform.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {ottPlatforms.filter(p => p.type === "buy").length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Buy</h4>
                  <div className="flex flex-wrap gap-4">
                    {ottPlatforms.filter(p => p.type === "buy").map((platform) => (
                      <div key={platform.name} className="flex items-center space-x-2 bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors">
                        {platform.logo && (
                          <img src={platform.logo} alt={platform.name} className="w-8 h-8 object-contain" />
                        )}
                        <span className="text-white text-sm font-medium">{platform.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-400">Streaming information not available at this time.</p>
          )
        }
      </section >

      {/* TV Show Seasons Section */}
      {
        contentType === "tv" && seasons && seasons.seasons && seasons.seasons.length > 0 && (
          <section className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-6">Seasons & Episodes</h3>
            <div className="space-y-6">
              {seasons.seasons
                .filter((season: any) => season.name !== "Specials" && season.seasonNumber !== 0)
                .map((season: any) => (
                  <div key={season.seasonNumber} className="border-b border-white/10 pb-6 last:border-b-0">
                    <div className="flex items-start gap-4 mb-4">
                      {season.posterPath && (
                        <img
                          src={`https://image.tmdb.org/t/p/w154${season.posterPath}`}
                          alt={season.name}
                          className="w-24 h-36 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-white mb-2">
                          {season.name || `Season ${season.seasonNumber}`}
                        </h4>
                        {season.overview && (
                          <p className="text-gray-300 text-sm mb-2">{season.overview}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {season.airDate && (
                            <span>{new Date(season.airDate).getFullYear()}</span>
                          )}
                          <span>{season.episodeCount} Episodes</span>
                        </div>
                      </div>
                    </div>
                    {season.episodes && season.episodes.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {season.episodes.map((episode: any) => (
                          <div key={episode.episodeNumber} className="bg-white/5 rounded-lg p-3 hover:bg-white/10 transition-colors">
                            <div className="flex items-start gap-3">
                              {episode.stillPath && (
                                <img
                                  src={`https://image.tmdb.org/t/p/w185${episode.stillPath}`}
                                  alt={episode.name}
                                  className="w-20 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-semibold text-purple-400">
                                    E{episode.episodeNumber}
                                  </span>
                                  {episode.voteAverage > 0 && (
                                    <span className="text-xs text-yellow-400">⭐ {episode.voteAverage.toFixed(1)}</span>
                                  )}
                                </div>
                                <h5 className="text-sm font-medium text-white truncate">{episode.name}</h5>
                                {episode.runtime && (
                                  <p className="text-xs text-gray-400 mt-1">{episode.runtime} min</p>
                                )}
                                {episode.airDate && (
                                  <p className="text-xs text-gray-400">{new Date(episode.airDate).toLocaleDateString()}</p>
                                )}
                              </div>
                            </div>
                            {episode.overview && (
                              <p className="text-xs text-gray-300 mt-2 line-clamp-2">{episode.overview}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </section>
        )
      }

      {/* Cast & Crew Section */}
      {
        credits && credits.cast && credits.cast.length > 0 && (
          <section className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Cast</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {credits.cast.slice(0, 12).map((actor: any) => (
                <div key={actor.id} className="text-center">
                  {actor.profilePath && (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${actor.profilePath}`}
                      alt={actor.name}
                      className="w-full aspect-[2/3] object-cover rounded-lg mb-2"
                    />
                  )}
                  <p className="text-sm font-medium text-white">{actor.name}</p>
                  {actor.character && (
                    <p className="text-xs text-gray-400">{actor.character}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )
      }

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {contentType === "movie" ? "Movie Info" : "Show Info"}
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-gray-400">Status:</span>
              <span className="text-white ml-2">{status || (contentType === "movie" ? "Released" : "Unknown")}</span>
            </div>
            <div>
              <span className="text-gray-400">Original Language:</span>
              <span className="text-white ml-2">
                {new Intl.DisplayNames(['en'], { type: 'language' }).of((content as any).originalLanguage) || (content as any).originalLanguage.toUpperCase()}
              </span>
            </div>
            {languages.filter(l =>
              l.toLowerCase() !== new Intl.DisplayNames(['en'], { type: 'language' }).of((content as any).originalLanguage)?.toLowerCase() &&
              l.toLowerCase() !== (content as any).originalLanguage.toLowerCase()
            ).length > 0 && (
                <div>
                  <span className="text-gray-400">Also available in:</span>
                  <span className="text-white ml-2">
                    {languages
                      .filter(l =>
                        l.toLowerCase() !== new Intl.DisplayNames(['en'], { type: 'language' }).of((content as any).originalLanguage)?.toLowerCase() &&
                        l.toLowerCase() !== (content as any).originalLanguage.toLowerCase()
                      )
                      .join(", ")}
                  </span>
                </div>
              )}
            {contentType === "movie" && budget && budget > 0 && (
              <div>
                <span className="text-gray-400">Budget:</span>
                <span className="text-white ml-2">${budget.toLocaleString()}</span>
              </div>
            )}
            {contentType === "movie" && revenue && revenue > 0 && (
              <div>
                <span className="text-gray-400">Revenue:</span>
                <span className="text-white ml-2">${revenue.toLocaleString()}</span>
              </div>
            )}
            {contentType === "tv" && numberOfSeasons && (
              <div>
                <span className="text-gray-400">Seasons:</span>
                <span className="text-white ml-2">{numberOfSeasons}</span>
              </div>
            )}
            {contentType === "tv" && numberOfEpisodes && (
              <div>
                <span className="text-gray-400">Episodes:</span>
                <span className="text-white ml-2">{numberOfEpisodes}</span>
              </div>
            )}
            {contentType === "tv" && (content as any).inProduction !== undefined && (
              <div>
                <span className="text-gray-400">In Production:</span>
                <span className="text-white ml-2">{(content as any).inProduction ? "Yes" : "No"}</span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Ratings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Average Rating</span>
              <span className="text-white font-semibold">{(content as any).voteAverage.toFixed(1)}/10</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full"
                style={{ width: `${((content as any).voteAverage / 10) * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-400">Total Votes</span>
              <span className="text-white">{(content as any).voteCount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white/10 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Popularity</h3>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">
              {(content as any).popularity.toFixed(0)}
            </div>
            <div className="text-sm text-gray-400">Popularity Score</div>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <ReviewsSection contentType={contentType} contentId={tmdbId || contentId} />
    </div >
  );
}

