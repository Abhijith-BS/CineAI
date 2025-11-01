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
    
    // Enhanced search with external APIs for all chat queries to ensure accuracy
    let searchResults: { movies: Doc<"movies">[]; shows: Doc<"tvShows">[]; source?: string };
    
    // Ambiguity check: clarify before heavy search
    const lowerQ = String(aiResponse.searchQuery || args.message).toLowerCase();
    if (lowerQ.includes("avengers") && !lowerQ.includes("marvel")) {
      const clarify = "Do you mean Marvel’s Avengers live‑action films, or something else titled ‘Avengers’?";
      await ctx.runMutation(internal.chat.saveChatMessage, {
        userId,
        message: args.message,
        response: clarify,
      });
      return {
        response: clarify,
        structured: [],
        searchResults: { movies: [], shows: [] },
        suggestions: ["Marvel’s Avengers movies", "Other films named Avengers"],
        similarTitles: [],
        culturalContext: null,
      };
    }

    // Collection/franchise router: phrases that imply full lists
    const q = String(args.message).toLowerCase();
    const collectionTriggers = ["show all", "list all", "all movies", "collection", "franchise"];
    if (collectionTriggers.some((t) => q.includes(t))) {
      const coll = await ctx.runAction(api.externalApi.searchCollectionFirst, {
        query: args.message,
        language: aiResponse.language || undefined,
      } as any);

      // Save chat and return natural text + strict JSON list (visible)
      const jsonBlock = JSON.stringify(coll.movies, null, 2);
      const responseText = `${coll.summary}\n\n${jsonBlock}`;

      await ctx.runMutation(internal.chat.saveChatMessage, {
        userId,
        message: args.message,
        response: responseText,
      });

      return {
        response: responseText,
        structured: [],
        searchResults: { movies: [], shows: [] },
        suggestions: [],
        similarTitles: [],
        culturalContext: null,
      };
    }

    // Generate rich candidate set (TMDB-first pipeline)
    const candidates: any[] = await ctx.runAction(api.externalApi.generateTmdbCandidates, {
      query: aiResponse.searchQuery || args.message,
      language: (aiResponse.language ?? undefined) as any,
      year: (aiResponse.year ?? undefined) as any,
      minRating: (aiResponse.minRating ?? undefined) as any,
    });

    // Rerank with Gemini for precision and reasons
    const ranked: Array<{ tmdbId: number; score: number; reason: string }> = await ctx.runAction(api.gemini.rerankCandidates, {
      message: aiResponse.searchQuery || args.message,
      candidates: candidates.map((c: any) => ({
        tmdbId: c.tmdbId,
        title: c.title,
        overview: c.overview || "",
        releaseDate: c.releaseDate || "",
        voteAverage: c.voteAverage || 0,
        voteCount: c.voteCount || 0,
        genres: c.genres || [],
        originalLanguage: c.originalLanguage || "en",
        popularity: c.popularity || 0,
      })),
      topN: 12,
      region: "IN",
      preferIndian: true,
    });

    // Map ranked list back to rich objects
    const idToCandidate = new Map<number, any>();
    for (const c of candidates) idToCandidate.set(Number(c.tmdbId), c);
    const rankedMoviesFull: any[] = ranked
      .map((r) => ({ ...idToCandidate.get(Number(r.tmdbId)), _reason: r.reason }))
      .filter(Boolean);

    // Save or upsert top results into DB for MovieCard rendering (strip extra fields)
    const storedMovies: any[] = [];
    for (const c of rankedMoviesFull.slice(0, 12)) {
      try {
        const existingMovie = await ctx.runQuery(api.movies.findByTmdbId, { tmdbId: c.tmdbId });
        if (!existingMovie) {
          const { source, _reason, ...movieForInsert } = c as any;
          const movieId = await ctx.runMutation(internal.movies.insertMovie, movieForInsert);
          const stored: any = await ctx.runQuery(api.movies.getMovieById, { id: movieId });
          if (stored) storedMovies.push({ ...stored, _reason: c._reason });
        } else {
          storedMovies.push({ ...existingMovie, _reason: c._reason });
        }
      } catch (e) {
        // continue on insert errors
      }
    }

    searchResults = { movies: storedMovies, shows: [], source: "external" };

    // Get OTT platform info for top movies
    const moviesWithOTT = [];
    for (const movie of searchResults.movies.slice(0, 10)) {
      const ottPlatforms: any[] = await ctx.runAction(api.externalApi.getOTTPlatforms, {
        tmdbId: movie.tmdbId,
        country: aiResponse.language === "tamil" ? "IN" : "IN"
      });
      
      moviesWithOTT.push({
        ...movie,
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
      // Try web fallback to synthesize items
      const webItems: any[] = await ctx.runAction(api.externalApi.searchWebFallback, {
        query: aiResponse.searchQuery || args.message,
        country: aiResponse.language === "tamil" ? "IN" : "IN",
      });

      if (webItems.length > 0) {
        for (const w of webItems.slice(0, 3)) {
          structured.push({
            title: w.title || aiResponse.searchQuery || args.message,
            year: w.releaseDate ? parseInt(String(w.releaseDate).slice(0, 4)) : null,
            rating: null,
            language: aiResponse.language || "en",
            genres: aiResponse.genre ? [aiResponse.genre] : [],
            plot: w.overview || "",
            ottAvailability: [],
            source: w.source || "web",
            aiGenerated: true,
          });
        }
      } else {
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
    }

    // Compose a short conversational lead based on results
    const topTitles = moviesWithOTT.slice(0, 3).map((m: any) => m.title).filter(Boolean);
    const structuredTopTitles = topTitles.length ? topTitles : structured.slice(0, 3).map((s) => s.title).filter(Boolean);
    const samplePlatforms = moviesWithOTT
      .flatMap((m: any) => (m.ottPlatforms || []).map((p: any) => p.name))
      .filter(Boolean);
    const uniquePlatforms = Array.from(new Set(samplePlatforms)).slice(0, 3);

    // Build Gemini-style concise bullets (3-5)
    const picks = searchResults.movies.length > 0 ? searchResults.movies : structured;
    const bullets = picks.slice(0, 5).map((m: any) => {
      const title = m.title || "";
      const year = m.releaseDate ? String(m.releaseDate).slice(0, 4) : null;
      const rating = typeof m.voteAverage === "number" && m.voteAverage > 0 ? ` ⭐ ${m.voteAverage.toFixed(1)}` : "";
      const genre = Array.isArray(m.genres) && m.genres.length ? ` — 🎬 ${m.genres.slice(0, 2).join(" / ")}` : "";
      const reason = m._reason ? ` — ${m._reason}` : "";
      const platform = Array.isArray(m.ottPlatforms) && m.ottPlatforms.length ? ` ⎯ on ${m.ottPlatforms.slice(0, 2).map((p: any) => p.name).join(", ")}` : "";
      return `• ${title}${year ? ` (${year})` : ""}${rating}${genre}${reason}${platform}`;
    });

    let intro: string;
    if (aiResponse.genre && aiResponse.language) {
      intro = `Sure! Here are some ${aiResponse.language} ${aiResponse.genre} picks you’ll love 👇`;
    } else if (aiResponse.genre) {
      intro = `Sure! Here are some ${aiResponse.genre} picks you’ll love 👇`;
    } else if (aiResponse.language) {
      intro = `Sure! Here are some ${aiResponse.language} recommendations you’ll love 👇`;
    } else if (structuredTopTitles.length) {
      intro = `Sure! Here are recommendations similar to ${structuredTopTitles[0]} 👇`;
    } else {
      intro = `Sure! Here are some great picks you’ll love 👇`;
    }

    if (uniquePlatforms.length) {
      intro += ` You can stream many of these on ${uniquePlatforms.join(", ")}.`;
    }

    const conversationalLead = [intro, "", ...bullets].join("\n");

    // Enhanced response with cultural context and provenance
    let enhancedResponse = conversationalLead;
    if (aiResponse.culturalContext) {
      enhancedResponse += `\n\n${aiResponse.culturalContext}`;
    }
    if (searchResults.source === "external") {
      enhancedResponse += "\n\nPulled real details from TMDB/OMDb and added OTT availability.";
    }
    if (structured.some(s => s.aiGenerated)) {
      enhancedResponse += "\n\nNote: Some items are AI-generated when real data wasn’t available.";
    }

    // Keep chat text conversational only
    const finalResponseText = enhancedResponse;

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
