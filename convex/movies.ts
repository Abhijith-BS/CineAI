import {
  query,
  mutation,
  action,
  internalMutation,
} from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Get trending movies
export const getTrendingMovies = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("movies")
      .withIndex("by_popularity")
      .order("desc")
      .take(limit);
  },
});

// Get trending TV shows
export const getTrendingShows = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("tvShows")
      .withIndex("by_popularity")
      .order("desc")
      .take(limit);
  },
});

// Get top-rated TV shows
export const getTopRatedShows = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("tvShows")
      .withIndex("by_vote_average")
      .order("desc")
      .take(limit);
  },
});

// Get top rated movies
export const getTopRatedMovies = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;
    return await ctx.db
      .query("movies")
      .withIndex("by_vote_average")
      .order("desc")
      .take(limit);
  },
});

// Get movie by ID
export const getMovieById = query({
  args: { id: v.id("movies") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get TV show by ID
export const getShowById = query({
  args: { id: v.id("tvShows") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Enhanced search with external API integration
export const searchContent = action({
  args: { 
    query: v.string(),
    type: v.optional(v.union(v.literal("movie"), v.literal("tv"), v.literal("all"))),
    language: v.optional(v.string()),
    genre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results: { movies: any[], shows: any[] } = { movies: [], shows: [] };

    // Search local database first
    const localResults = await ctx.runQuery(api.movies.searchLocalContent, {
      query: args.query,
      type: args.type,
      language: args.language,
      genre: args.genre,
    });

    results = localResults;
    // Always search external APIs to ensure we get TV shows and movies
    // This ensures TV shows like "Stranger Things" appear in search results
    const totalResults = results.movies.length + results.shows.length;
    if (totalResults < 10 || results.movies.length < 3 || results.shows.length < 3) {
      try {
        const externalResults = await ctx.runAction(api.movies.searchWithExternalAPIs, {
          query: args.query,
          language: args.language,
          genre: args.genre,
        });
        
        // Combine results, avoiding duplicates
        const existingMovieIds = new Set(results.movies.map(m => m.tmdbId));
        const existingShowIds = new Set(results.shows.map(s => s.tmdbId));
        
        const newMovies = externalResults.movies.filter((m: any) => !existingMovieIds.has(m.tmdbId));
        const newShows = externalResults.shows.filter((s: any) => !existingShowIds.has(s.tmdbId));
        
        results.movies = [...results.movies, ...newMovies];
        results.shows = [...results.shows, ...newShows];
      } catch (error) {
        console.error("External search failed:", error);
      }
    }

    return results;
  },
});

// Enhanced search with external APIs
export const searchWithExternalAPIs = action({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
    genre: v.optional(v.string()),
    year: v.optional(v.number()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<{movies: any[], shows: any[], source: string}> => {
    // First search local database
    const localResults: {movies: any[], shows: any[]} = await ctx.runQuery(api.movies.searchLocalContent, {
      query: args.query,
      type: "all", // Search both movies and TV shows
      language: args.language,
      genre: args.genre,
    });

    // Always search external APIs to ensure comprehensive results including TV shows
    // This ensures popular shows like "Stranger Things" appear even if not in local DB
    const totalLocalResults = localResults.movies.length + localResults.shows.length;
    if (totalLocalResults >= 20 && localResults.movies.length >= 5 && localResults.shows.length >= 5) {
      return {
        movies: localResults.movies,
        shows: localResults.shows,
        source: "local"
      };
    }

    // Otherwise, search external APIs for both movies and TV shows
    const [externalMovies, externalShows] = await Promise.all([
      ctx.runAction(api.externalApi.searchExternalMovies, {
        query: args.query,
        language: args.language,
        genre: args.genre,
        year: args.year,
        minRating: args.minRating,
      }),
      ctx.runAction(api.externalApi.searchExternalTVShows, {
        query: args.query,
        language: args.language,
        genre: args.genre,
        year: args.year,
        minRating: args.minRating,
      }),
    ]);

    // Store new movies in database for future searches
    const storedMovies = [];
    for (const movie of externalMovies.slice(0, 10)) {
      try {
        const existingMovie = await ctx.runQuery(api.movies.findByTmdbId, {
          tmdbId: movie.tmdbId
        });
        
        if (!existingMovie) {
          // Remove non-schema fields (e.g., source)
          const { source, ...movieForInsert } = movie as any;
          
          // If posterPath is missing, try to fetch from Google Images
          if (!movieForInsert.posterPath) {
            try {
              const year = movieForInsert.releaseDate 
                ? parseInt(movieForInsert.releaseDate.split("-")[0])
                : undefined;
              const googleImageUrl = await ctx.runAction(api.externalApi.fetchGoogleImage, {
                title: movieForInsert.title,
                year: year,
              });
              
              // Store Google image URL in posterPath (we'll handle it as external URL)
              if (googleImageUrl) {
                movieForInsert.posterPath = googleImageUrl;
              }
            } catch (error) {
              console.error("Error fetching Google image:", error);
              // Continue without poster if Google fetch fails
            }
          }
          
          const movieId = await ctx.runMutation(internal.movies.insertMovie, movieForInsert);
          const storedMovie: any = await ctx.runQuery(api.movies.getMovieById, { id: movieId });
          if (storedMovie) storedMovies.push(storedMovie);
        } else {
          storedMovies.push(existingMovie);
        }
      } catch (error) {
        console.error("Error storing movie:", error);
      }
    }

    // Store new TV shows in database for future searches
    const storedShows = [];
    for (const show of externalShows.slice(0, 10)) {
      try {
        const existingShow = await ctx.runQuery(api.movies.findShowByTmdbId, {
          tmdbId: show.tmdbId
        });
        
        if (!existingShow) {
          // Remove non-schema fields (e.g., source)
          const { source, ...showForInsert } = show as any;
          
          const showId = await ctx.runMutation(internal.movies.insertShow, showForInsert);
          const storedShow: any = await ctx.runQuery(api.movies.getShowById, { id: showId });
          if (storedShow) storedShows.push(storedShow);
        } else {
          storedShows.push(existingShow);
        }
      } catch (error) {
        console.error("Error storing TV show:", error);
      }
    }

    return {
      movies: [...localResults.movies, ...storedMovies],
      shows: [...localResults.shows, ...storedShows],
      source: "external"
    };
  },
});

// Local database search
export const searchLocalContent = query({
  args: { 
    query: v.string(),
    type: v.optional(v.union(v.literal("movie"), v.literal("tv"), v.literal("all"))),
    language: v.optional(v.string()),
    genre: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const searchType = args.type ?? "all";
    const results: { movies: any[], shows: any[] } = { movies: [], shows: [] };

    if (searchType === "movie" || searchType === "all") {
      let movieQuery = ctx.db
        .query("movies")
        .withSearchIndex("search_movies", (q) => q.search("title", args.query));
      
      results.movies = await movieQuery.take(10);
    }

    if (searchType === "tv" || searchType === "all") {
      let showQuery = ctx.db
        .query("tvShows")
        .withSearchIndex("search_shows", (q) => q.search("name", args.query));
      
      results.shows = await showQuery.take(10);
    }

    return results;
  },
});

// Find movie by TMDB ID
export const findByTmdbId = query({
  args: { tmdbId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("movies")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .first();
  },
});

// Find TV show by TMDB ID
export const findShowByTmdbId = query({
  args: { tmdbId: v.number() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tvShows")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .first();
  },
});

// Add to favorites
export const addToFavorites = mutation({
  args: {
    itemType: v.union(v.literal("movie"), v.literal("tv")),
    itemId: v.union(v.id("movies"), v.id("tvShows")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if already in favorites
    const existing = await ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.and(
        q.eq(q.field("itemType"), args.itemType),
        q.eq(q.field("itemId"), args.itemId)
      ))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    } else {
      await ctx.db.insert("favorites", {
        userId,
        itemType: args.itemType,
        itemId: args.itemId,
      });
      return { added: true };
    }
  },
});

// Get user favorites
export const getUserFavorites = query({
  args: { type: v.optional(v.union(v.literal("movie"), v.literal("tv"))) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    let favoritesQuery = ctx.db
      .query("favorites")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    if (args.type) {
      favoritesQuery = favoritesQuery.filter((q) => q.eq(q.field("itemType"), args.type));
    }

    const favorites = await favoritesQuery.collect();
    
    const results = [];
    for (const fav of favorites) {
      if (fav.itemType === "movie") {
        const movie = await ctx.db.get(fav.itemId as any);
        if (movie) results.push({ ...movie, type: "movie" });
      } else {
        const show = await ctx.db.get(fav.itemId as any);
        if (show) results.push({ ...show, type: "tv" });
      }
    }

    return results;
  },
});

// Populate trending TV shows from TMDb
export const populateTrendingTVShows = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ success: boolean; count: number }> => {
    const limit = args.limit ?? 20;
    
    // Fetch trending TV shows from TMDb
    const trendingShows: Array<any> = await ctx.runAction(api.externalApi.getTrendingTVShows, { limit });
    
    // Store TV shows in database
    for (const show of trendingShows) {
      try {
        const existingShow = await ctx.runQuery(api.movies.findShowByTmdbId, {
          tmdbId: show.tmdbId
        });
        
        if (!existingShow) {
          // Remove non-schema fields (e.g., source)
          const { source, ...showForInsert } = show as any;
          await ctx.runMutation(internal.movies.insertShow, showForInsert);
        }
      } catch (error) {
        console.error("Error storing trending TV show:", error);
      }
    }
    
    return { success: true, count: trendingShows.length };
  },
});

// Populate popular TV shows from TMDb
export const populatePopularTVShows = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ success: boolean; count: number }> => {
    const limit = args.limit ?? 20;
    
    // Fetch popular TV shows from TMDb
    const popularShows: Array<any> = await ctx.runAction(api.externalApi.getPopularTVShows, { limit });
    
    // Store TV shows in database
    for (const show of popularShows) {
      try {
        const existingShow = await ctx.runQuery(api.movies.findShowByTmdbId, {
          tmdbId: show.tmdbId
        });
        
        if (!existingShow) {
          // Remove non-schema fields (e.g., source)
          const { source, ...showForInsert } = show as any;
          await ctx.runMutation(internal.movies.insertShow, showForInsert);
        }
      } catch (error) {
        console.error("Error storing popular TV show:", error);
      }
    }
    
    return { success: true, count: popularShows.length };
  },
});

// Populate top-rated TV shows from TMDb
export const populateTopRatedTVShows = action({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args): Promise<{ success: boolean; count: number }> => {
    const limit = args.limit ?? 20;
    
    // Fetch top-rated TV shows from TMDb
    const topRatedShows: Array<any> = await ctx.runAction(api.externalApi.getTopRatedTVShows, { limit });
    
    // Store TV shows in database
    for (const show of topRatedShows) {
      try {
        const existingShow = await ctx.runQuery(api.movies.findShowByTmdbId, {
          tmdbId: show.tmdbId
        });
        
        if (!existingShow) {
          // Remove non-schema fields (e.g., source)
          const { source, ...showForInsert } = show as any;
          await ctx.runMutation(internal.movies.insertShow, showForInsert);
        }
      } catch (error) {
        console.error("Error storing top-rated TV show:", error);
      }
    }
    
    return { success: true, count: topRatedShows.length };
  },
});

// Populate database with sample data (for demo purposes)
export const populateSampleData = action({
  args: {},
  handler: async (ctx) => {
    // Enhanced sample movies with Tamil content
    const sampleMovies = [
      {
        tmdbId: 550,
        title: "Fight Club",
        overview: "A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy.",
        releaseDate: "1999-10-15",
        posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
        backdropPath: "/fCayJrkfRaCRCTh8GqN30f8oyQF.jpg",
        voteAverage: 8.4,
        voteCount: 26280,
        genres: ["Drama", "Thriller"],
        runtime: 139,
        budget: 63000000,
        revenue: 100853753,
        tagline: "Mischief. Mayhem. Soap.",
        status: "Released",
        originalLanguage: "en",
        popularity: 61.416,
        adult: false,
        video: false,
      },
      {
        tmdbId: 238,
        title: "The Godfather",
        overview: "Spanning the years 1945 to 1955, a chronicle of the fictional Italian-American Corleone crime family.",
        releaseDate: "1972-03-14",
        posterPath: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
        backdropPath: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
        voteAverage: 8.7,
        voteCount: 19044,
        genres: ["Drama", "Crime"],
        runtime: 175,
        budget: 6000000,
        revenue: 245066411,
        tagline: "An offer you can't refuse.",
        status: "Released",
        originalLanguage: "en",
        popularity: 149.593,
        adult: false,
        video: false,
      },
      {
        tmdbId: 155,
        title: "The Dark Knight",
        overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent.",
        releaseDate: "2008-07-18",
        posterPath: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
        backdropPath: "/hqkIcbrOHL86UncnHIsHVcVmzue.jpg",
        voteAverage: 9.0,
        voteCount: 32000,
        genres: ["Action", "Crime", "Drama"],
        runtime: 152,
        budget: 185000000,
        revenue: 1004558444,
        tagline: "Why So Serious?",
        status: "Released",
        originalLanguage: "en",
        popularity: 123.456,
        adult: false,
        video: false,
      },
      {
        tmdbId: 123456,
        title: "Vikram Vedha",
        overview: "A notorious gangster Vedha surrenders himself to encounter specialist Vikram whom he challenges every step of the way by narrating his life events in the form of riddles that needs to be solved in order to capture him.",
        releaseDate: "2017-07-21",
        posterPath: "/vikram_vedha_poster.jpg",
        backdropPath: "/vikram_vedha_backdrop.jpg",
        voteAverage: 8.2,
        voteCount: 15000,
        genres: ["Action", "Crime", "Thriller"],
        runtime: 147,
        budget: 11000000,
        revenue: 60000000,
        tagline: "Good vs Evil",
        status: "Released",
        originalLanguage: "ta",
        popularity: 45.2,
        adult: false,
        video: false,
      },
      {
        tmdbId: 789012,
        title: "Kaithi",
        overview: "A recently released prisoner becomes involved in a chase with criminals as he races against time to drive poisoned cops to a hospital in order to save them.",
        releaseDate: "2019-10-25",
        posterPath: "/kaithi_poster.jpg",
        backdropPath: "/kaithi_backdrop.jpg",
        voteAverage: 8.1,
        voteCount: 12000,
        genres: ["Action", "Crime", "Thriller"],
        runtime: 145,
        budget: 5000000,
        revenue: 105000000,
        tagline: "One night. One man. One chance.",
        status: "Released",
        originalLanguage: "ta",
        popularity: 42.8,
        adult: false,
        video: false,
      },
      {
        tmdbId: 456789,
        title: "Parasite",
        overview: "A poor family schemes to become employed by a wealthy family by infiltrating their household and posing as unrelated, highly qualified individuals.",
        releaseDate: "2019-05-30",
        posterPath: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
        backdropPath: "/TU9NIjwzjoKPwQHoHshkBcQZzr.jpg",
        voteAverage: 8.5,
        voteCount: 17000,
        genres: ["Comedy", "Thriller", "Drama"],
        runtime: 132,
        budget: 11400000,
        revenue: 258800000,
        tagline: "Act like you own the place.",
        status: "Released",
        originalLanguage: "ko",
        popularity: 92.1,
        adult: false,
        video: false,
      }
    ];

    const sampleShows = [
      {
        tmdbId: 1399,
        name: "Game of Thrones",
        overview: "Seven noble families fight for control of the mythical land of Westeros.",
        firstAirDate: "2011-04-17",
        lastAirDate: "2019-05-19",
        posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
        backdropPath: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
        voteAverage: 8.3,
        voteCount: 22000,
        genres: ["Sci-Fi & Fantasy", "Drama", "Action & Adventure"],
        numberOfEpisodes: 73,
        numberOfSeasons: 8,
        status: "Ended",
        originalLanguage: "en",
        popularity: 369.594,
        adult: false,
        inProduction: false,
      },
      {
        tmdbId: 1402,
        name: "Breaking Bad",
        overview: "A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine.",
        firstAirDate: "2008-01-20",
        lastAirDate: "2013-09-29",
        posterPath: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
        backdropPath: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
        voteAverage: 9.5,
        voteCount: 12000,
        genres: ["Crime", "Drama", "Thriller"],
        numberOfEpisodes: 62,
        numberOfSeasons: 5,
        status: "Ended",
        originalLanguage: "en",
        popularity: 189.456,
        adult: false,
        inProduction: false,
      }
    ];

    // Insert sample data
    for (const movie of sampleMovies) {
      const existing = await ctx.runQuery(api.movies.findByTmdbId, {
        tmdbId: movie.tmdbId
      });
      
      if (!existing) {
        await ctx.runMutation(internal.movies.insertMovie, movie);
      }
    }

    for (const show of sampleShows) {
      await ctx.runMutation(internal.movies.insertShow, show);
    }

    return { success: true };
  },
});

export const insertMovie = internalMutation({
  args: {
    tmdbId: v.number(),
    title: v.string(),
    overview: v.string(),
    releaseDate: v.string(),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    voteAverage: v.number(),
    voteCount: v.number(),
    genres: v.array(v.string()),
    runtime: v.optional(v.number()),
    budget: v.optional(v.number()),
    revenue: v.optional(v.number()),
    tagline: v.optional(v.string()),
    status: v.optional(v.string()),
    originalLanguage: v.string(),
    popularity: v.number(),
    adult: v.boolean(),
    video: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("movies", args);
  },
});

export const insertShow = internalMutation({
  args: {
    tmdbId: v.number(),
    name: v.string(),
    overview: v.string(),
    firstAirDate: v.string(),
    lastAirDate: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    voteAverage: v.number(),
    voteCount: v.number(),
    genres: v.array(v.string()),
    numberOfEpisodes: v.optional(v.number()),
    numberOfSeasons: v.optional(v.number()),
    status: v.optional(v.string()),
    originalLanguage: v.string(),
    popularity: v.number(),
    adult: v.boolean(),
    inProduction: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("tvShows", args);
  },
});

/**
 * Update movie poster from Google Images if missing
 */
export const updateMoviePoster = action({
  args: {
    movieId: v.id("movies"),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args): Promise<string | null> => {
    const movie: Doc<"movies"> | null = await ctx.runQuery(api.movies.getMovieById, { id: args.movieId });
    if (!movie) {
      return null;
    }

    // Only fetch if poster is missing
    if (movie.posterPath) {
      return movie.posterPath;
    }

    try {
      const year = movie.releaseDate 
        ? parseInt(movie.releaseDate.split("-")[0])
        : undefined;
      const googleImageUrl: string | null = await ctx.runAction(api.externalApi.fetchGoogleImage, {
        title: movie.title,
        year: year,
      });

      if (googleImageUrl) {
        // Update the movie in database
        await ctx.runMutation(internal.movies.updateMoviePosterInternal, {
          movieId: args.movieId,
          posterPath: googleImageUrl,
        });
        return googleImageUrl;
      }
    } catch (error) {
      console.error("Error updating movie poster:", error);
    }

    return null;
  },
});

export const updateMoviePosterInternal = internalMutation({
  args: {
    movieId: v.id("movies"),
    posterPath: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.movieId, {
      posterPath: args.posterPath,
    });
    return null;
  },
});
