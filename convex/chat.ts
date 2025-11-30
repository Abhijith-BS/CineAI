import { action, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Chat with AI using Groq (ChatGPT-style responses)
export const chatWithAI = action({
  args: {
    message: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { success: false, error: "Not authenticated. Please sign in." };
    }

    let groqResponse: {
      reply: string;
      movie: {
        title: string;
        overview: string;
        rating: string;
        release_date: string;
        poster: string;
      } | null;
      sources: string[];
    };

    // Step 1: Get ChatGPT-style response from Groq
    try {
      groqResponse = await ctx.runAction(api.groq.chatWithGroq, {
        message: args.message,
      });
    } catch (error: any) {
      console.error("Error calling Groq:", error);
      const errorMessage = error?.message || "Failed to get AI response. Please try again.";
      
      // Save error message to chat history
      try {
        await ctx.runMutation(internal.chat.saveChatMessage, {
          userId,
          message: args.message,
          response: `Sorry, I encountered an error: ${errorMessage}. Please check your API keys or try again later.`,
          movieResults: [],
          showResults: [],
        });
      } catch (saveError) {
        console.error("Error saving chat message:", saveError);
      }
      
      return { success: false, error: errorMessage };
    }

    // Step 2: If movie info was found, try to search for related movies for display
    let searchResults: { movies: Doc<"movies">[]; shows: Doc<"tvShows">[]; source?: string } = {
      movies: [],
      shows: [],
      source: "groq",
    };

    // If we have a movie from Groq response, search for related movies
    if (groqResponse.movie && groqResponse.movie.title) {
      try {
        // Search for movies similar to the one found
        const candidates: any[] = await ctx.runAction(api.externalApi.generateTmdbCandidates, {
          query: groqResponse.movie.title,
        });

        // Store top results for display
        const storedMovies: any[] = [];
        for (const c of candidates.slice(0, 12)) {
          try {
            const existingMovie = await ctx.runQuery(api.movies.findByTmdbId, { tmdbId: c.tmdbId });
            if (!existingMovie) {
              const { source, ...movieForInsert } = c as any;
              
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
                  
                  if (googleImageUrl) {
                    movieForInsert.posterPath = googleImageUrl;
                  }
                } catch (e) {
                  // Continue without poster if Google fetch fails
                }
              }
              
              const movieId = await ctx.runMutation(internal.movies.insertMovie, movieForInsert);
              const stored: any = await ctx.runQuery(api.movies.getMovieById, { id: movieId });
              if (stored) storedMovies.push(stored);
            } else {
              storedMovies.push(existingMovie);
            }
          } catch (e) {
            // continue on insert errors
          }
        }

        // Get OTT platform info
        const moviesWithOTT = [];
        for (const movie of storedMovies.slice(0, 10)) {
          const ottPlatforms: any[] = await ctx.runAction(api.externalApi.getOTTPlatforms, {
            tmdbId: movie.tmdbId,
            country: "IN",
          });
          moviesWithOTT.push({
            ...movie,
            ottPlatforms,
          });
        }

        searchResults = { movies: moviesWithOTT, shows: [], source: "tmdb" };
      } catch (error) {
        console.error("Error searching for related movies:", error);
      }
    }

    // Step 3: Also check if user's query seems to be asking for movie recommendations
    // (even if Groq didn't find a specific movie)
    const lowerMessage = args.message.toLowerCase();
    const movieKeywords = ["movie", "film", "show", "recommend", "suggest", "best", "top", "watch", "thriller", "action", "drama", "comedy"];
    const isMovieQuery = movieKeywords.some(keyword => lowerMessage.includes(keyword));

    if (isMovieQuery && searchResults.movies.length === 0) {
      try {
        const candidates: any[] = await ctx.runAction(api.externalApi.generateTmdbCandidates, {
          query: args.message,
        });

        const storedMovies: any[] = [];
        for (const c of candidates.slice(0, 12)) {
          try {
            const existingMovie = await ctx.runQuery(api.movies.findByTmdbId, { tmdbId: c.tmdbId });
            if (!existingMovie) {
              const { source, ...movieForInsert } = c as any;
              
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
                  
                  if (googleImageUrl) {
                    movieForInsert.posterPath = googleImageUrl;
                  }
                } catch (e) {
                  // Continue without poster if Google fetch fails
                }
              }
              
              const movieId = await ctx.runMutation(internal.movies.insertMovie, movieForInsert);
              const stored: any = await ctx.runQuery(api.movies.getMovieById, { id: movieId });
              if (stored) storedMovies.push(stored);
            } else {
              storedMovies.push(existingMovie);
            }
          } catch (e) {
            // continue on insert errors
          }
        }

        const moviesWithOTT = [];
        for (const movie of storedMovies.slice(0, 10)) {
          const ottPlatforms: any[] = await ctx.runAction(api.externalApi.getOTTPlatforms, {
            tmdbId: movie.tmdbId,
            country: "IN",
          });
          moviesWithOTT.push({
            ...movie,
            ottPlatforms,
          });
        }

        searchResults = { movies: moviesWithOTT, shows: [], source: "tmdb" };
      } catch (error) {
        console.error("Error searching for movies:", error);
      }
    }

    // Step 4: Build structured data for frontend
    type StructuredItem = {
      title: string;
      year: number | null;
      rating: number | null;
      language: string | null;
      genres: string[];
      plot: string | null;
      ottAvailability: Array<{ name: string; type: string }>;
      source?: string;
      aiGenerated?: boolean;
    };

    const structured: StructuredItem[] = searchResults.movies.map((m: any) => ({
      title: m.title ?? "",
      year: m.releaseDate ? parseInt((m.releaseDate as string).slice(0, 4)) : null,
      rating: typeof m.voteAverage === "number" ? m.voteAverage : null,
      language: m.originalLanguage ?? null,
      genres: Array.isArray(m.genres) ? m.genres : [],
      plot: m.overview ?? null,
      ottAvailability: Array.isArray(m.ottPlatforms)
        ? m.ottPlatforms.map((p: any) => ({ name: p.name, type: p.type }))
        : [],
      source: searchResults.source,
      aiGenerated: false,
    }));

    // Step 5: Save chat message
    try {
      await ctx.runMutation(internal.chat.saveChatMessage, {
        userId,
        message: args.message,
        response: groqResponse.reply || "I apologize, but I couldn't generate a response. Please try again.",
        movieResults: searchResults.movies.map((m: any) => m._id),
        showResults: searchResults.shows.map((s: Doc<"tvShows">) => s._id),
      });
    } catch (error) {
      console.error("Error saving chat message:", error);
      return { success: false, error: "Failed to save chat message. Please try again." };
    }

    // Step 6: Return success
    return { success: true };
  },
});

// Get chat history
export const getChatHistory = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(v.object({
    _id: v.id("chatMessages"),
    _creationTime: v.number(),
    userId: v.id("users"),
    message: v.string(),
    response: v.string(),
    timestamp: v.number(),
    movies: v.array(v.any()),
    shows: v.array(v.any()),
  })),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const limit = args.limit ?? 50;
    const messages = await ctx.db
      .query("chatMessages")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit);

    // Get full movie/show details for each message
    const enrichedMessages = [];
    for (const msg of messages) {
      const movies: any[] = [];
      const shows: any[] = [];

      if (msg.movieResults && msg.movieResults.length > 0) {
        for (const movieId of msg.movieResults) {
          try {
            const movie = await ctx.db.get(movieId);
            if (movie) movies.push(movie);
          } catch (e) {
            // Skip invalid movie IDs
          }
        }
      }

      if (msg.showResults && msg.showResults.length > 0) {
        for (const showId of msg.showResults) {
          try {
            const show = await ctx.db.get(showId);
            if (show) shows.push(show);
          } catch (e) {
            // Skip invalid show IDs
          }
        }
      }

      enrichedMessages.push({
        _id: msg._id,
        _creationTime: msg._creationTime,
        userId: msg.userId,
        message: msg.message,
        response: msg.response || "I apologize, but I couldn't generate a response. Please try again.",
        timestamp: msg.timestamp,
        movies,
        shows,
      });
    }

    return enrichedMessages.reverse();
  },
});

export const saveChatMessage = internalMutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    response: v.string(),
    movieResults: v.optional(v.array(v.id("movies"))),
    showResults: v.optional(v.array(v.id("tvShows"))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("chatMessages", {
      ...args,
      timestamp: Date.now(),
    });
  },
});
