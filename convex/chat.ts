import { action, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api";
import { Doc, Id } from "./_generated/dataModel";

// Enhanced chat with AI about movies and shows
export const chatWithAI = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args): Promise<any> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Use enhanced Gemini AI to process the message
    const aiResponse: {
      response: string;
      searchQuery: string;
      contentType: "movie" | "tv" | "all";
      language?: string;
      genre?: string;
      year?: number;
      minRating?: number;
      suggestions: string[];
      similarTitles: string[];
      culturalContext?: string;
    } = await ctx.runAction(api.gemini.processMovieQuery, {
      message: args.message
    });
    
    // Enhanced search with external APIs if needed
    let searchResults: { movies: Doc<"movies">[]; shows: Doc<"tvShows">[]; source?: string };
    
    if (aiResponse.language || aiResponse.genre || aiResponse.year || aiResponse.minRating) {
      // Use external API search for specific language/genre requests
      searchResults = await ctx.runAction(api.movies.searchWithExternalAPIs, {
        query: aiResponse.searchQuery || args.message,
        language: aiResponse.language,
        genre: aiResponse.genre,
        year: aiResponse.year,
        minRating: aiResponse.minRating,
      });
    } else {
      // Use regular search for general queries
      const results = await ctx.runAction(api.movies.searchContent, {
        query: aiResponse.searchQuery || args.message,
        type: aiResponse.contentType || "all"
      });
      searchResults = { movies: results.movies, shows: results.shows, source: "local" };
    }

    // Get OTT platform info for top movies
    const moviesWithOTT: Array<Doc<"movies"> & { ottPlatforms?: Array<{ name: string; type: string; logo?: string }> }> = [];
    for (const movie of searchResults.movies.slice(0, 5)) {
      const ottPlatforms: any[] = await ctx.runAction(api.externalApi.getOTTPlatforms, {
        tmdbId: movie.tmdbId,
        country: aiResponse.language === "tamil" ? "IN" : "IN"
      });
      
      moviesWithOTT.push({
        ...(movie as any),
        ottPlatforms
      });
    }

    // Build structured JSON block as requested
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

    const structured: StructuredItem[] = moviesWithOTT.map((m: any) => ({
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

    // If nothing found, create an AI-generated placeholder based on intent
    if (structured.length === 0) {
      structured.push({
        title: aiResponse.searchQuery || args.message,
        year: null,
        rating: null,
        language: aiResponse.language || null,
        genres: aiResponse.genre ? [aiResponse.genre] : [],
        plot: "AI-generated summary based on your query.",
        ottAvailability: [],
        source: "ai",
        aiGenerated: true,
      });
    }

    // Enhanced response with cultural context and provenance
    let enhancedResponse = aiResponse.response;
    if (aiResponse.culturalContext) {
      enhancedResponse += `\n\n${aiResponse.culturalContext}`;
    }
    if (searchResults.source === "external") {
      enhancedResponse += "\n\nI’ve pulled real details from TMDB/OMDb and added OTT availability.";
    }
    if (structured.some(s => s.aiGenerated)) {
      enhancedResponse += "\n\nNote: Some details are AI-generated where real data wasn’t available.";
    }

    // Append the structured JSON block to the message text
    const structuredBlock = JSON.stringify(structured, null, 2);
    const finalResponseText = `${enhancedResponse}\n\nStructured data:\n${structuredBlock}`;

    // Save chat message with enhanced data
    await ctx.runMutation(internal.chat.saveChatMessage, {
      userId,
      message: args.message,
      response: finalResponseText,
      movieResults: moviesWithOTT.map((m: any) => m._id),
      showResults: searchResults.shows.map((s: Doc<"tvShows">) => s._id),
    });

    return {
      response: finalResponseText,
      structured,
      searchResults: {
        movies: moviesWithOTT,
        shows: searchResults.shows
      },
      suggestions: aiResponse.suggestions || [],
      similarTitles: aiResponse.similarTitles || [],
      culturalContext: aiResponse.culturalContext
    };
  },
});

// Get chat history
export const getChatHistory = query({
  args: { limit: v.optional(v.number()) },
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
      const movies = [];
      const shows = [];

      if (msg.movieResults) {
        for (const movieId of msg.movieResults) {
          const movie = await ctx.db.get(movieId);
          if (movie) movies.push(movie);
        }
      }

      if (msg.showResults) {
        for (const showId of msg.showResults) {
          const show = await ctx.db.get(showId);
          if (show) shows.push(show);
        }
      }

      enrichedMessages.push({
        ...msg,
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
