"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import axios from "axios";

// Enhanced movie search with external APIs
export const searchExternalMovies = action({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
    genre: v.optional(v.string()),
    year: v.optional(v.number()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const results = [] as Array<any>;
      
      // Try TMDB API first (most comprehensive)
      if (process.env.TMDB_API_KEY) {
        const tmdbResults = await searchTMDB(args);
        results.push(...tmdbResults);
      }
      
      // Try OMDb API as fallback
      if (process.env.OMDB_API_KEY && results.length < 5) {
        const omdbResults = await searchOMDB(args);
        results.push(...omdbResults);
      }
      
      // If no API keys are configured, return sample results based on query
      if (results.length === 0) {
        return generateSampleResults(args);
      }
      
      // Sort by relevance and rating and dedupe
      const seen = new Set<number>();
      const deduped = results.filter((m) => {
        const key = Number(m.tmdbId);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return deduped
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
        .slice(0, 20);
        
    } catch (error) {
      console.error("External API search error:", error);
      // Return sample results as fallback
      return generateSampleResults(args);
    }
  },
});

// Enhanced TV show search with external APIs
export const searchExternalTVShows = action({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
    genre: v.optional(v.string()),
    year: v.optional(v.number()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const results = [] as Array<any>;
      
      // Try TMDB API first (most comprehensive)
      if (process.env.TMDB_API_KEY) {
        const tmdbResults = await searchTMDBTV(args);
        results.push(...tmdbResults);
      }
      
      // If no API keys are configured, return empty results
      if (results.length === 0) {
        return [];
      }
      
      // Sort by relevance and rating and dedupe
      const seen = new Set<number>();
      const deduped = results.filter((s) => {
        const key = Number(s.tmdbId);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      return deduped
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
        .slice(0, 20);
        
    } catch (error) {
      console.error("External TV show API search error:", error);
      return [];
    }
  },
});

// Fetch trending TV shows from TMDb
export const getTrendingTVShows = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return [];
      
      const baseUrl = "https://api.themoviedb.org/3";
      const apiKey = process.env.TMDB_API_KEY;
      const limit = args.limit ?? 50;
      
      // Fetch trending TV shows
      const response = await axios.get(`${baseUrl}/trending/tv/week`, {
        params: { api_key: apiKey }
      });
      
      const shows = (response.data?.results ?? []).slice(0, limit) as Array<any>;
      
      // Get detailed info for each show
      const detailedShows: Array<any> = [];
      for (const show of shows) {
        try {
          const detailResponse = await axios.get(`${baseUrl}/tv/${show.id}`, {
            params: { api_key: apiKey }
          });
          
          const showDetail = detailResponse.data;
          
          detailedShows.push({
            tmdbId: showDetail.id,
            name: showDetail.name,
            overview: showDetail.overview || "",
            firstAirDate: showDetail.first_air_date || "",
            lastAirDate: showDetail.last_air_date || undefined,
            posterPath: showDetail.poster_path || undefined,
            backdropPath: showDetail.backdrop_path || undefined,
            voteAverage: showDetail.vote_average || 0,
            voteCount: showDetail.vote_count || 0,
            genres: (showDetail.genres ?? []).map((g: any) => g.name) || [],
            numberOfEpisodes: showDetail.number_of_episodes ?? undefined,
            numberOfSeasons: showDetail.number_of_seasons ?? undefined,
            status: showDetail.status || undefined,
            originalLanguage: showDetail.original_language || "en",
            popularity: showDetail.popularity || 0,
            adult: showDetail.adult || false,
            inProduction: showDetail.in_production || false,
            source: "tmdb",
          });
        } catch (detailError) {
          console.error("Error fetching TV show details:", detailError);
        }
      }
      
      return detailedShows;
    } catch (error) {
      console.error("Error fetching trending TV shows:", error);
      return [];
    }
  },
});

// Fetch popular TV shows from TMDb
export const getPopularTVShows = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return [];
      
      const baseUrl = "https://api.themoviedb.org/3";
      const apiKey = process.env.TMDB_API_KEY;
      const limit = args.limit ?? 50;
      
      // Fetch popular TV shows
      const response = await axios.get(`${baseUrl}/tv/popular`, {
        params: { api_key: apiKey }
      });
      
      const shows = (response.data?.results ?? []).slice(0, limit) as Array<any>;
      
      // Get detailed info for each show
      const detailedShows: Array<any> = [];
      for (const show of shows) {
        try {
          const detailResponse = await axios.get(`${baseUrl}/tv/${show.id}`, {
            params: { api_key: apiKey }
          });
          
          const showDetail = detailResponse.data;
          
          detailedShows.push({
            tmdbId: showDetail.id,
            name: showDetail.name,
            overview: showDetail.overview || "",
            firstAirDate: showDetail.first_air_date || "",
            lastAirDate: showDetail.last_air_date || undefined,
            posterPath: showDetail.poster_path || undefined,
            backdropPath: showDetail.backdrop_path || undefined,
            voteAverage: showDetail.vote_average || 0,
            voteCount: showDetail.vote_count || 0,
            genres: (showDetail.genres ?? []).map((g: any) => g.name) || [],
            numberOfEpisodes: showDetail.number_of_episodes ?? undefined,
            numberOfSeasons: showDetail.number_of_seasons ?? undefined,
            status: showDetail.status || undefined,
            originalLanguage: showDetail.original_language || "en",
            popularity: showDetail.popularity || 0,
            adult: showDetail.adult || false,
            inProduction: showDetail.in_production || false,
            source: "tmdb",
          });
        } catch (detailError) {
          console.error("Error fetching TV show details:", detailError);
        }
      }
      
      return detailedShows;
    } catch (error) {
      console.error("Error fetching popular TV shows:", error);
      return [];
    }
  },
});

// Fetch top-rated TV shows from TMDb
export const getTopRatedTVShows = action({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return [];
      
      const baseUrl = "https://api.themoviedb.org/3";
      const apiKey = process.env.TMDB_API_KEY;
      const limit = args.limit ?? 50;
      
      // Fetch top-rated TV shows
      const response = await axios.get(`${baseUrl}/tv/top_rated`, {
        params: { api_key: apiKey }
      });
      
      const shows = (response.data?.results ?? []).slice(0, limit) as Array<any>;
      
      // Get detailed info for each show
      const detailedShows: Array<any> = [];
      for (const show of shows) {
        try {
          const detailResponse = await axios.get(`${baseUrl}/tv/${show.id}`, {
            params: { api_key: apiKey }
          });
          
          const showDetail = detailResponse.data;
          
          detailedShows.push({
            tmdbId: showDetail.id,
            name: showDetail.name,
            overview: showDetail.overview || "",
            firstAirDate: showDetail.first_air_date || "",
            lastAirDate: showDetail.last_air_date || undefined,
            posterPath: showDetail.poster_path || undefined,
            backdropPath: showDetail.backdrop_path || undefined,
            voteAverage: showDetail.vote_average || 0,
            voteCount: showDetail.vote_count || 0,
            genres: (showDetail.genres ?? []).map((g: any) => g.name) || [],
            numberOfEpisodes: showDetail.number_of_episodes ?? undefined,
            numberOfSeasons: showDetail.number_of_seasons ?? undefined,
            status: showDetail.status || undefined,
            originalLanguage: showDetail.original_language || "en",
            popularity: showDetail.popularity || 0,
            adult: showDetail.adult || false,
            inProduction: showDetail.in_production || false,
            source: "tmdb",
          });
        } catch (detailError) {
          console.error("Error fetching TV show details:", detailError);
        }
      }
      
      return detailedShows;
    } catch (error) {
      console.error("Error fetching top-rated TV shows:", error);
      return [];
    }
  },
});

// Fetch TV show credits from TMDb
export const getTVShowCredits = action({
  args: {
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return { cast: [], crew: [] };
      
      const baseUrl = "https://api.themoviedb.org/3";
      const apiKey = process.env.TMDB_API_KEY;
      
      const response = await axios.get(`${baseUrl}/tv/${args.tmdbId}/credits`, {
        params: { api_key: apiKey }
      });
      
      return {
        cast: (response.data?.cast ?? []).map((actor: any) => ({
          id: actor.id,
          name: actor.name,
          character: actor.character,
          profilePath: actor.profile_path || undefined,
          order: actor.order || 0,
        })),
        crew: (response.data?.crew ?? []).map((member: any) => ({
          id: member.id,
          name: member.name,
          job: member.job,
          department: member.department,
          profilePath: member.profile_path || undefined,
        })),
      };
    } catch (error) {
      console.error("Error fetching TV show credits:", error);
      return { cast: [], crew: [] };
    }
  },
});

export const generateTmdbCandidates = action({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
    year: v.optional(v.number()),
    minRating: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    if (!process.env.TMDB_API_KEY) return [];
    const baseUrl = "https://api.themoviedb.org/3";
    const apiKey = process.env.TMDB_API_KEY;
    const region = "IN";

    const languageMap: Record<string, string> = {
      'tamil': 'ta', 'hindi': 'hi', 'telugu': 'te', 'malayalam': 'ml', 'kannada': 'kn', 'bengali': 'bn', 'marathi': 'mr',
      'gujarati': 'gu', 'punjabi': 'pa', 'english': 'en', 'korean': 'ko', 'japanese': 'ja', 'chinese': 'zh'
    };
    const langCode = args.language ? (languageMap[String(args.language).toLowerCase()] || args.language) : undefined;

    function parseSeedTitle(raw: string): string | null {
      const likeMatch = raw.match(/(?:like|similar to)\s+([^,.;\n]+)/i);
      if (likeMatch?.[1]) return likeMatch[1].trim();
      return null;
    }

    const seedTitle = parseSeedTitle(args.query);

    // NEW: Collections (e.g., Avengers) for exact franchise lists
    const qLower = String(args.query).toLowerCase();
    let collectionParts: Array<any> = [];
    try {
      if (qLower.includes("avengers") || qLower.includes("marvel")) {
        const collSearch = await axios.get(`${baseUrl}/search/collection`, {
          params: { api_key: apiKey, query: "avengers" },
        });
        const topCollection = (collSearch.data?.results ?? []).sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0];
        if (topCollection?.id) {
          const coll = await axios.get(`${baseUrl}/collection/${topCollection.id}`, { params: { api_key: apiKey } });
          collectionParts = (coll.data?.parts ?? []) as Array<any>;
        }
      }
    } catch (e) {
      // ignore collection errors
    }

    let prioritized: Array<any> = [];
    try {
      if (seedTitle) {
        const seedSearch = await axios.get(`${baseUrl}/search/movie`, {
          params: { api_key: apiKey, query: seedTitle, include_adult: false, region, year: args.year },
        });
        const seed = (seedSearch.data?.results ?? []).sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0];
        if (seed?.id) {
          const [similar, recs] = await Promise.all([
            axios.get(`${baseUrl}/movie/${seed.id}/similar`, { params: { api_key: apiKey, page: 1, region } }),
            axios.get(`${baseUrl}/movie/${seed.id}/recommendations`, { params: { api_key: apiKey, page: 1, region } }),
          ]);
          prioritized = [ ...(similar.data?.results ?? []), ...(recs.data?.results ?? []) ];
        }
      }
    } catch (e) {
      console.error("TMDB seed similar/recommendations error:", e);
    }

    const searchParams: any = { api_key: apiKey, query: args.query, include_adult: false, region, year: args.year };
    if (langCode) searchParams.with_original_language = langCode;
    const searchResp = await axios.get(`${baseUrl}/search/movie`, { params: searchParams });
    const searched = (searchResp.data?.results ?? []) as Array<any>;

    // Keyword discovery expansion
    let discovered: Array<any> = [];
    try {
      const keywordSearch = await axios.get(`${baseUrl}/search/keyword`, {
        params: { api_key: apiKey, query: expandFranchiseTerms(args.query).join(" ") },
      });
      const keywordIds: Array<number> = (keywordSearch.data?.results ?? []).slice(0, 8).map((k: any) => Number(k.id)).filter(Boolean);
      if (keywordIds.length > 0) {
        const discover = await axios.get(`${baseUrl}/discover/movie`, {
          params: {
            api_key: apiKey,
            sort_by: "popularity.desc",
            with_keywords: keywordIds.join(","),
            include_adult: false,
            with_original_language: langCode,
            primary_release_year: args.year,
            region,
            "vote_count.gte": 20,
          },
        });
        discovered = (discover.data?.results ?? []) as Array<any>;
      }
    } catch (e) {
      console.error("TMDB discover error:", e);
    }

    // Combine, putting collection parts first if present
    const combined = [...collectionParts, ...prioritized, ...searched, ...discovered]
      .filter((m) => (m?.vote_count || 0) >= 20 || (m?.popularity || 0) >= 5);
    if (args.minRating) {
      combined.splice(0, combined.length, ...combined.filter((m) => (m.vote_average || 0) >= (args.minRating ?? 0)));
    }

    // Dedup and fetch details for top 100
    const seen = new Set<number>();
    const unique = combined.filter((m) => {
      const id = Number(m?.id);
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    }).slice(0, 100);

    const detailed: Array<any> = [];
    for (const m of unique) {
      try {
        const d = await axios.get(`${baseUrl}/movie/${m.id}`, { params: { api_key: apiKey } });
        const x = d.data;
        detailed.push({
          tmdbId: x.id,
          title: x.title,
          overview: x.overview || "",
          releaseDate: x.release_date || "",
          posterPath: x.poster_path || undefined,
          backdropPath: x.backdrop_path || undefined,
          voteAverage: x.vote_average || 0,
          voteCount: x.vote_count || 0,
          genres: (x.genres ?? []).map((g: any) => g.name) || [],
          runtime: x.runtime ?? undefined,
          budget: x.budget ?? undefined,
          revenue: x.revenue ?? undefined,
          tagline: x.tagline || undefined,
          status: x.status || undefined,
          originalLanguage: x.original_language || "en",
          popularity: x.popularity || 0,
          adult: x.adult || false,
          video: x.video || false,
          source: "tmdb",
        });
      } catch (e) {
        // ignore failed detail
      }
    }

    return detailed;
  }
});

export const resolveTitlesToTmdb = action({
  args: {
    items: v.array(v.object({ title: v.string(), year: v.optional(v.number()) })),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!process.env.TMDB_API_KEY) return [];
    const baseUrl = "https://api.themoviedb.org/3";
    const apiKey = process.env.TMDB_API_KEY;

    const out: any[] = [];
    for (const it of args.items) {
      try {
        const sr = await axios.get(`${baseUrl}/search/movie`, {
          params: { api_key: apiKey, query: it.title, include_adult: false, year: it.year },
        });
        const hit = (sr.data?.results ?? [])
          .filter((m: any) => m.title && Math.abs(((it.year ?? 0) || 0) - Number(String(m.release_date || "").slice(0, 4) || 0)) <= 2 || !it.year)
          .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0];
        if (!hit?.id) continue;
        const d = await axios.get(`${baseUrl}/movie/${hit.id}`, { params: { api_key: apiKey } });
        const x = d.data;
        out.push({
          tmdbId: x.id,
          title: x.title,
          overview: x.overview || "",
          releaseDate: x.release_date || "",
          posterPath: x.poster_path || undefined,
          backdropPath: x.backdrop_path || undefined,
          voteAverage: x.vote_average || 0,
          voteCount: x.vote_count || 0,
          genres: (x.genres ?? []).map((g: any) => g.name) || [],
          runtime: x.runtime ?? undefined,
          budget: x.budget ?? undefined,
          revenue: x.revenue ?? undefined,
          tagline: x.tagline || undefined,
          status: x.status || undefined,
          originalLanguage: x.original_language || "en",
          popularity: x.popularity || 0,
          adult: x.adult || false,
          video: x.video || false,
          source: "tmdb",
        });
      } catch {}
    }
    return out;
  }
});

export const searchCollectionFirst = action({
  args: {
    query: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!process.env.TMDB_API_KEY) return { summary: "TMDB API key missing.", movies: [] };
    const baseUrl = "https://api.themoviedb.org/3";
    const apiKey = process.env.TMDB_API_KEY;

    const raw = String(args.query).trim();
    const cleaned = raw
      .toLowerCase()
      .replace(/\b(show|list|all|movies|movie|collection|franchise|tmdb|exact|the|of|in)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const lastToken = cleaned.split(" ").filter(Boolean).slice(-1)[0] || cleaned;

    async function tryCollection(q: string) {
      const c = await axios.get(`${baseUrl}/search/collection`, {
        params: { api_key: apiKey, query: q },
      });
      const top = (c.data?.results ?? []).sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0];
      if (!top?.id) return null;
      const det = await axios.get(`${baseUrl}/collection/${top.id}`, {
        params: { api_key: apiKey, language: "en-US" },
      });
      const parts = (det.data?.parts ?? []) as Array<any>;
      const movies = parts.map((p) => ({
        title: p.title,
        release_date: p.release_date || null,
        id: p.id,
        poster_path: p.poster_path || null,
        source: "TMDB",
      }));
      return { summary: `Here’s the complete ${det.data?.name || "collection"} 👇`, movies };
    }

    try {
      // Try raw phrase, then cleaned, then last token
      const attempts = [raw, cleaned, lastToken].filter((q, i, arr) => q && arr.indexOf(q) === i);
      for (const q of attempts) {
        const hit = await tryCollection(q);
        if (hit && hit.movies.length > 0) return hit;
      }

      // Fallback to related movies search
      const s = await axios.get(`${baseUrl}/search/movie`, {
        params: { api_key: apiKey, query: cleaned || raw, include_adult: false },
      });
      const results = (s.data?.results ?? []) as Array<any>;
      const movies = results.map((m) => ({
        title: m.title,
        release_date: m.release_date || null,
        id: m.id,
        poster_path: m.poster_path || null,
        source: "TMDB",
      }));
      return { summary: `Here are the closest matches I found 👇`, movies };
    } catch (e) {
      return { summary: "TMDB is currently unavailable — try again soon.", movies: [] };
    }
  }
});

function parseSeedTitle(raw: string): string | null {
  const q = String(raw).toLowerCase();
  const likeMatch = raw.match(/(?:like|similar to)\s+([^,.;\n]+)/i);
  if (likeMatch && likeMatch[1]) return likeMatch[1].trim();
  // Heuristic: if query starts with a title before keywords
  if (q.includes("like")) {
    const parts = raw.split(/like/i);
    if (parts[1]) return parts[1].trim();
  }
  return null;
}

async function searchTMDB(args: any) {
  try {
    const baseUrl = "https://api.themoviedb.org/3";
    const apiKey = process.env.TMDB_API_KEY;

    const region = "IN"; // prioritize India as default context

    // Build language mapping
    const languageMap: Record<string, string> = {
      'tamil': 'ta', 'hindi': 'hi', 'telugu': 'te', 'malayalam': 'ml', 'kannada': 'kn', 'bengali': 'bn', 'marathi': 'mr',
      'gujarati': 'gu', 'punjabi': 'pa', 'english': 'en', 'korean': 'ko', 'japanese': 'ja', 'chinese': 'zh'
    };

    const langCode = args.language ? (languageMap[String(args.language).toLowerCase()] || args.language) : undefined;

    // 0) If user asked for "like X", fetch similar and recommendations based on the best matching seed
    const seedTitle = parseSeedTitle(args.query);
    let prioritized: Array<any> = [];
    if (seedTitle) {
      try {
        const seedSearch = await axios.get(`${baseUrl}/search/movie`, {
          params: {
            api_key: apiKey,
            query: seedTitle,
            include_adult: false,
            region,
            language: langCode ? `${langCode}-${region}` : undefined,
            year: args.year,
          },
        });
        const seed = (seedSearch.data?.results ?? []).sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0];
        if (seed?.id) {
          const [similar, recs] = await Promise.all([
            axios.get(`${baseUrl}/movie/${seed.id}/similar`, { params: { api_key: apiKey, page: 1, region } }),
            axios.get(`${baseUrl}/movie/${seed.id}/recommendations`, { params: { api_key: apiKey, page: 1, region } }),
          ]);
          prioritized = [
            ...((similar.data?.results ?? []) as Array<any>),
            ...((recs.data?.results ?? []) as Array<any>),
          ];
        }
      } catch (e) {
        console.error("TMDB seed similar/recommendations error:", e);
      }
    }

    // 1) Plain text search
    const params: any = {
      api_key: apiKey,
      query: args.query,
      include_adult: false,
      region,
      year: args.year,
    };
    if (langCode) params.with_original_language = langCode;

    const response = await axios.get(`${baseUrl}/search/movie`, { params });
    const movies = (response.data?.results ?? []) as Array<any>;

    // 2) Keyword-based discovery expansion if needed
    let discovered: Array<any> = [];
    if ((prioritized.length + movies.length) < 5) {
      const expansionTerms = expandFranchiseTerms(args.query);
      const keywordSearch = await axios.get(`${baseUrl}/search/keyword`, {
        params: { api_key: apiKey, query: expansionTerms.join(" ") },
      });
      const keywordIds: Array<number> = (keywordSearch.data?.results ?? [])
        .slice(0, 5)
        .map((k: any) => Number(k.id))
        .filter(Boolean);

      if (keywordIds.length > 0) {
        const discover = await axios.get(`${baseUrl}/discover/movie`, {
          params: {
            api_key: apiKey,
            sort_by: "popularity.desc",
            with_keywords: keywordIds.join(","),
            include_adult: false,
            with_original_language: langCode,
            primary_release_year: args.year,
            region,
          },
        });
        discovered = (discover.data?.results ?? []) as Array<any>;
      }
    }

    // Combine with priority: similar/recommendations > plain search > discovery
    const combined = [...prioritized, ...movies, ...discovered]
      // Relevance filter: require some votes or popularity to avoid junk
      .filter((m) => (m?.vote_count || 0) >= 20 || (m?.popularity || 0) >= 5);

    // Apply min rating filter early
    let filtered = combined;
    if (args.minRating) {
      filtered = filtered.filter((m) => (m.vote_average || 0) >= args.minRating);
    }

    // Get detailed info for top results (max 12 to limit requests)
    const uniqueSeen = new Set<number>();
    const detailedMovies: Array<any> = [];
    for (const movie of filtered.slice(0, 12)) {
      if (!movie?.id || uniqueSeen.has(movie.id)) continue;
      uniqueSeen.add(movie.id);
      try {
        const detailResponse = await axios.get(`${baseUrl}/movie/${movie.id}`, {
          params: { api_key: apiKey }
        });
        
        const movieDetail = detailResponse.data;
        
        // Check genre filter
        if (args.genre) {
          const hasGenre = (movieDetail.genres ?? []).some((g: any) =>
            String(g.name).toLowerCase().includes(String(args.genre).toLowerCase())
          );
          if (!hasGenre) continue;
        }
        
        detailedMovies.push({
          tmdbId: movieDetail.id,
          title: movieDetail.title,
          overview: movieDetail.overview || "",
          releaseDate: movieDetail.release_date || "",
          posterPath: movieDetail.poster_path || undefined,
          backdropPath: movieDetail.backdrop_path || undefined,
          voteAverage: movieDetail.vote_average || 0,
          voteCount: movieDetail.vote_count || 0,
          genres: (movieDetail.genres ?? []).map((g: any) => g.name) || [],
          runtime: movieDetail.runtime ?? undefined,
          budget: movieDetail.budget ?? undefined,
          revenue: movieDetail.revenue ?? undefined,
          tagline: movieDetail.tagline || undefined,
          status: movieDetail.status || undefined,
          originalLanguage: movieDetail.original_language || "en",
          popularity: movieDetail.popularity || 0,
          adult: movieDetail.adult || false,
          video: movieDetail.video || false,
          source: "tmdb",
        });
      } catch (detailError) {
        console.error("Error fetching movie details:", detailError);
      }
    }
    
    return detailedMovies;
  } catch (error) {
    console.error("TMDB API error:\n", error);
    return [];
  }
}

async function searchTMDBTV(args: any) {
  try {
    const baseUrl = "https://api.themoviedb.org/3";
    const apiKey = process.env.TMDB_API_KEY;

    const region = "IN"; // prioritize India as default context

    // Build language mapping
    const languageMap: Record<string, string> = {
      'tamil': 'ta', 'hindi': 'hi', 'telugu': 'te', 'malayalam': 'ml', 'kannada': 'kn', 'bengali': 'bn', 'marathi': 'mr',
      'gujarati': 'gu', 'punjabi': 'pa', 'english': 'en', 'korean': 'ko', 'japanese': 'ja', 'chinese': 'zh'
    };

    const langCode = args.language ? (languageMap[String(args.language).toLowerCase()] || args.language) : undefined;

    // Parse seed title for "like X" queries
    const seedTitle = parseSeedTitle(args.query);
    let prioritized: Array<any> = [];
    if (seedTitle) {
      try {
        const seedSearch = await axios.get(`${baseUrl}/search/tv`, {
          params: {
            api_key: apiKey,
            query: seedTitle,
            include_adult: false,
            region,
            language: langCode ? `${langCode}-${region}` : undefined,
            first_air_date_year: args.year,
          },
        });
        const seed = (seedSearch.data?.results ?? []).sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0))[0];
        if (seed?.id) {
          const [similar, recs] = await Promise.all([
            axios.get(`${baseUrl}/tv/${seed.id}/similar`, { params: { api_key: apiKey, page: 1, region } }),
            axios.get(`${baseUrl}/tv/${seed.id}/recommendations`, { params: { api_key: apiKey, page: 1, region } }),
          ]);
          prioritized = [
            ...((similar.data?.results ?? []) as Array<any>),
            ...((recs.data?.results ?? []) as Array<any>),
          ];
        }
      } catch (e) {
        console.error("TMDB TV seed similar/recommendations error:", e);
      }
    }

    // Plain text search for TV shows
    const params: any = {
      api_key: apiKey,
      query: args.query,
      include_adult: false,
      region,
      first_air_date_year: args.year,
    };
    if (langCode) params.with_original_language = langCode;

    const response = await axios.get(`${baseUrl}/search/tv`, { params });
    const shows = (response.data?.results ?? []) as Array<any>;

    // Keyword-based discovery expansion if needed
    let discovered: Array<any> = [];
    if ((prioritized.length + shows.length) < 5) {
      const expansionTerms = expandFranchiseTerms(args.query);
      const keywordSearch = await axios.get(`${baseUrl}/search/keyword`, {
        params: { api_key: apiKey, query: expansionTerms.join(" ") },
      });
      const keywordIds: Array<number> = (keywordSearch.data?.results ?? [])
        .slice(0, 5)
        .map((k: any) => Number(k.id))
        .filter(Boolean);

      if (keywordIds.length > 0) {
        const discover = await axios.get(`${baseUrl}/discover/tv`, {
          params: {
            api_key: apiKey,
            sort_by: "popularity.desc",
            with_keywords: keywordIds.join(","),
            include_adult: false,
            with_original_language: langCode,
            first_air_date_year: args.year,
            region,
          },
        });
        discovered = (discover.data?.results ?? []) as Array<any>;
      }
    }

    // Combine with priority: similar/recommendations > plain search > discovery
    const combined = [...prioritized, ...shows, ...discovered]
      // Relevance filter: require some votes or popularity to avoid junk
      .filter((s) => (s?.vote_count || 0) >= 20 || (s?.popularity || 0) >= 5);

    // Apply min rating filter early
    let filtered = combined;
    if (args.minRating) {
      filtered = filtered.filter((s) => (s.vote_average || 0) >= args.minRating);
    }

    // Get detailed info for top results (max 12 to limit requests)
    const uniqueSeen = new Set<number>();
    const detailedShows: Array<any> = [];
    for (const show of filtered.slice(0, 12)) {
      if (!show?.id || uniqueSeen.has(show.id)) continue;
      uniqueSeen.add(show.id);
      try {
        const detailResponse = await axios.get(`${baseUrl}/tv/${show.id}`, {
          params: { api_key: apiKey }
        });
        
        const showDetail = detailResponse.data;
        
        // Check genre filter
        if (args.genre) {
          const hasGenre = (showDetail.genres ?? []).some((g: any) =>
            String(g.name).toLowerCase().includes(String(args.genre).toLowerCase())
          );
          if (!hasGenre) continue;
        }
        
        detailedShows.push({
          tmdbId: showDetail.id,
          name: showDetail.name,
          overview: showDetail.overview || "",
          firstAirDate: showDetail.first_air_date || "",
          lastAirDate: showDetail.last_air_date || undefined,
          posterPath: showDetail.poster_path || undefined,
          backdropPath: showDetail.backdrop_path || undefined,
          voteAverage: showDetail.vote_average || 0,
          voteCount: showDetail.vote_count || 0,
          genres: (showDetail.genres ?? []).map((g: any) => g.name) || [],
          numberOfEpisodes: showDetail.number_of_episodes ?? undefined,
          numberOfSeasons: showDetail.number_of_seasons ?? undefined,
          status: showDetail.status || undefined,
          originalLanguage: showDetail.original_language || "en",
          popularity: showDetail.popularity || 0,
          adult: showDetail.adult || false,
          inProduction: showDetail.in_production || false,
          source: "tmdb",
        });
      } catch (detailError) {
        console.error("Error fetching TV show details:", detailError);
      }
    }
    
    return detailedShows;
  } catch (error) {
    console.error("TMDB TV API error:\n", error);
    return [];
  }
}

function expandFranchiseTerms(query: string): Array<string> {
  const q = String(query).toLowerCase();
  const base = [query];
  const superhero = [
    "marvel", "mcu", "avengers", "iron man", "captain america", "thor",
    "guardians of the galaxy", "spider-man", "black panther",
    "dc", "dceu", "batman", "superman", "justice league", "wonder woman",
  ];
  if (superhero.some((t) => q.includes(t) || q.includes("avengers") || q.includes("superhero"))) {
    base.push(...superhero);
  }
  return base;
}

async function searchOMDB(args: any) {
  try {
    const apiKey = process.env.OMDB_API_KEY;
    const baseUrl = "http://www.omdbapi.com/";
    
    const params: any = {
      apikey: apiKey,
      s: args.query,
      type: "movie",
    };
    
    if (args.year) {
      params.y = args.year;
    }
    
    const response = await axios.get(baseUrl, { params });
    const movies = response.data.Search || [];
    
    const detailedMovies = [] as Array<any>;
    for (const movie of movies.slice(0, 5)) {
      try {
        const detailResponse = await axios.get(baseUrl, {
          params: {
            apikey: apiKey,
            i: movie.imdbID,
            plot: "full"
          }
        });
        
        const movieDetail = detailResponse.data;
        
        if (movieDetail.Response === "False") continue;
        
        // Filter by language if specified
        if (args.language) {
          const languages = String(movieDetail.Language || "").toLowerCase();
          if (!languages.includes(String(args.language).toLowerCase())) {
            continue;
          }
        }
        
        // Filter by genre if specified
        if (args.genre) {
          const genres = String(movieDetail.Genre || "").toLowerCase();
          if (!genres.includes(String(args.genre).toLowerCase())) {
            continue;
          }
        }
        
        // Filter by rating if specified
        const imdbRating = parseFloat(movieDetail.imdbRating) || 0;
        if (args.minRating && imdbRating < args.minRating) {
          continue;
        }
        
        detailedMovies.push({
          tmdbId: parseInt(String(movie.imdbID).replace("tt", "")) || 0,
          title: movieDetail.Title,
          overview: movieDetail.Plot || "",
          releaseDate: movieDetail.Released || "",
          posterPath: movieDetail.Poster && movieDetail.Poster !== "N/A" ? movieDetail.Poster : undefined,
          backdropPath: undefined,
          voteAverage: imdbRating,
          voteCount: parseInt(String(movieDetail.imdbVotes || "").replace(/,/g, "")) || 0,
          genres: (movieDetail.Genre ? String(movieDetail.Genre).split(", ") : []) || [],
          runtime: movieDetail.Runtime ? parseInt(String(movieDetail.Runtime).replace(" min", "")) : undefined,
          budget: undefined,
          revenue: undefined,
          tagline: undefined,
          status: "Released",
          originalLanguage: (movieDetail.Language ? String(movieDetail.Language).split(",")[0]?.trim().toLowerCase() : "en") || "en",
          popularity: imdbRating * 10,
          adult: movieDetail.Rated === "R" || movieDetail.Rated === "NC-17",
          video: false,
          source: "omdb"
        });
      } catch (detailError) {
        console.error("Error fetching OMDb movie details:", detailError);
      }
    }
    
    return detailedMovies;
  } catch (error) {
    console.error("OMDb API error:", error);
    return [];
  }
}

// Get OTT platform availability for movies (JustWatch alternative using TMDB)
export const getOTTPlatforms = action({
  args: {
    tmdbId: v.number(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return [];
      
      const baseUrl = "https://api.themoviedb.org/3";
      const country = args.country || "IN"; // Default to India
      
      const response = await axios.get(
        `${baseUrl}/movie/${args.tmdbId}/watch/providers`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
          }
        }
      );
      
      const providers = response.data.results?.[country];
      if (!providers) return [];
      
      const platforms = [] as Array<{ name: string; type: string; logo: string }>;
      
      // Streaming platforms
      if (providers.flatrate) {
        platforms.push(...providers.flatrate.map((p: any) => ({
          name: p.provider_name,
          type: "stream",
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
        })));
      }
      
      // Rental platforms
      if (providers.rent) {
        platforms.push(...providers.rent.map((p: any) => ({
          name: p.provider_name,
          type: "rent",
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
        })));
      }
      
      // Purchase platforms
      if (providers.buy) {
        platforms.push(...providers.buy.map((p: any) => ({
          name: p.provider_name,
          type: "buy",
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
        })));
      }
      
      return platforms;
    } catch (error: any) {
      // 404 errors are expected for movies without watch provider data - don't log as errors
      if (error?.response?.status === 404) {
        return [];
      }
      // Only log unexpected errors
      if (error?.response?.status !== 404) {
        console.error("OTT platforms error:", error?.message || error);
      }
      return [];
    }
  },
});

// Get OTT platform availability for TV shows
export const getTVShowOTTPlatforms = action({
  args: {
    tmdbId: v.number(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return [];
      
      const baseUrl = "https://api.themoviedb.org/3";
      const country = args.country || "IN"; // Default to India
      
      const response = await axios.get(
        `${baseUrl}/tv/${args.tmdbId}/watch/providers`,
        {
          params: {
            api_key: process.env.TMDB_API_KEY,
          }
        }
      );
      
      const providers = response.data.results?.[country];
      if (!providers) return [];
      
      const platforms = [] as Array<{ name: string; type: string; logo: string }>;
      
      // Streaming platforms
      if (providers.flatrate) {
        platforms.push(...providers.flatrate.map((p: any) => ({
          name: p.provider_name,
          type: "stream",
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
        })));
      }
      
      // Rental platforms
      if (providers.rent) {
        platforms.push(...providers.rent.map((p: any) => ({
          name: p.provider_name,
          type: "rent",
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
        })));
      }
      
      // Purchase platforms
      if (providers.buy) {
        platforms.push(...providers.buy.map((p: any) => ({
          name: p.provider_name,
          type: "buy",
          logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : "",
        })));
      }
      
      return platforms;
    } catch (error: any) {
      // 404 errors are expected for TV shows without watch provider data - don't log as errors
      if (error?.response?.status === 404) {
        return [];
      }
      // Only log unexpected errors
      if (error?.response?.status !== 404) {
        console.error("TV show OTT platforms error:", error?.message || error);
      }
      return [];
    }
  },
});

// Fetch TV show seasons and episodes
export const getTVShowSeasons = action({
  args: {
    tmdbId: v.number(),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return null;
      
      const baseUrl = "https://api.themoviedb.org/3";
      const apiKey = process.env.TMDB_API_KEY;
      
      // Get TV show details with seasons
      const response = await axios.get(`${baseUrl}/tv/${args.tmdbId}`, {
        params: { 
          api_key: apiKey,
          append_to_response: "credits"
        }
      });
      
      const showData = response.data;
      
      // Fetch detailed season information
      const seasons = [] as Array<any>;
      for (const season of (showData.seasons || [])) {
        try {
          const seasonResponse = await axios.get(
            `${baseUrl}/tv/${args.tmdbId}/season/${season.season_number}`,
            { params: { api_key: apiKey } }
          );
          
          const seasonData = seasonResponse.data;
          seasons.push({
            seasonNumber: seasonData.season_number,
            name: seasonData.name,
            overview: seasonData.overview || "",
            airDate: seasonData.air_date || "",
            episodeCount: seasonData.episodes?.length || 0,
            posterPath: seasonData.poster_path || season.poster_path || undefined,
            episodes: (seasonData.episodes || []).map((ep: any) => ({
              episodeNumber: ep.episode_number,
              name: ep.name,
              overview: ep.overview || "",
              airDate: ep.air_date || "",
              runtime: ep.runtime || undefined,
              voteAverage: ep.vote_average || 0,
              voteCount: ep.vote_count || 0,
              stillPath: ep.still_path || undefined,
            })),
          });
        } catch (seasonError) {
          console.error(`Error fetching season ${season.season_number}:`, seasonError);
          // Add season without episodes if detail fetch fails
          seasons.push({
            seasonNumber: season.season_number,
            name: season.name,
            overview: season.overview || "",
            airDate: season.air_date || "",
            episodeCount: season.episode_count || 0,
            posterPath: season.poster_path || undefined,
            episodes: [],
          });
        }
      }
      
      return {
        showId: showData.id,
        showName: showData.name,
        seasons: seasons.sort((a, b) => a.seasonNumber - b.seasonNumber),
      };
    } catch (error) {
      console.error("Error fetching TV show seasons:", error);
      return null;
    }
  },
});

export const searchWebFallback = action({
  args: {
    query: v.string(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.SERPER_API_KEY; // https://serper.dev (Google Search)
      if (!apiKey) return [];

      const res = await axios.post(
        "https://google.serper.dev/search",
        { q: args.query, gl: (args.country || "in").toLowerCase() },
        { headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" } }
      );

      const organic = res.data?.organic ?? [];
      const items = [] as Array<any>;

      for (const r of organic.slice(0, 5)) {
        const title: string = r.title || "";
        const snippet: string = r.snippet || r.description || "";
        const url: string = r.link || r.url || "";
        // Heuristic: prefer IMDb/TMDB/Wikipedia entries
        const isPreferred = /imdb\.com|themoviedb\.org|wikipedia\.org/i.test(url);
        // Extract a likely year
        const yearMatch = title.match(/\b(19|20)\d{2}\b/) || snippet.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? parseInt(yearMatch[0]) : null;

        items.push({
          tmdbId: 0,
          title,
          overview: snippet,
          releaseDate: year ? `${year}-01-01` : "",
          posterPath: undefined,
          backdropPath: undefined,
          voteAverage: 0,
          voteCount: 0,
          genres: [],
          runtime: undefined,
          budget: undefined,
          revenue: undefined,
          tagline: undefined,
          status: undefined,
          originalLanguage: "en",
          popularity: 0,
          adult: false,
          video: false,
          source: isPreferred ? "web_preferred" : "web",
          webUrl: url,
          aiGenerated: true,
        });
      }

      return items;
    } catch (error) {
      console.error("Web fallback error:", error);
      return [];
    }
  },
});

function generateSampleResults(args: any) {
  return [
    {
      tmdbId: 111111,
      title: "The Matrix",
      overview: "A computer programmer discovers reality is a simulation.",
      releaseDate: "1999-03-31",
      posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      voteAverage: 8.7,
      voteCount: 24000,
      genres: ["Action", "Sci-Fi"],
      runtime: 136,
      status: "Released",
      originalLanguage: "en",
      popularity: 85.4,
      adult: false,
      video: false
    }
  ];
}

/**
 * Fetch movie poster image from Google Images using Serper.dev
 */
export const fetchGoogleImage = action({
  args: {
    title: v.string(),
    year: v.optional(v.number()),
  },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    try {
      const apiKey = process.env.SERPER_API_KEY;
      if (!apiKey) {
        console.log("SERPER_API_KEY not set, cannot fetch Google images");
        return null;
      }

      // Build search query: "movie title year poster"
      const searchQuery = args.year 
        ? `${args.title} ${args.year} movie poster`
        : `${args.title} movie poster`;

      const response = await axios.post(
        "https://google.serper.dev/images",
        {
          q: searchQuery,
          num: 3, // Get top 3 results
        },
        {
          headers: {
            "X-API-KEY": apiKey,
            "Content-Type": "application/json",
          },
        }
      );

      const images = response.data?.images || [];
      if (images.length === 0) {
        return null;
      }

      // Prefer images from movie-related domains
      const preferredDomains = [
        "imdb.com",
        "themoviedb.org",
        "wikipedia.org",
        "rottentomatoes.com",
        "filmstruck.com",
      ];

      // Try to find an image from a preferred domain first
      for (const img of images) {
        const url = img.link || img.imageUrl || "";
        if (preferredDomains.some(domain => url.includes(domain))) {
          return url;
        }
      }

      // Otherwise return the first image
      return images[0]?.link || images[0]?.imageUrl || null;
    } catch (error) {
      console.error("Error fetching Google image:", error);
      return null;
    }
  },
});
