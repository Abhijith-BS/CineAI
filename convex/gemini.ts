"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const processMovieQuery = action({
  args: {
    message: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Initialize Gemini AI if API key is available
      if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Use supported model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

        const prompt = `You are an expert movie assistant. Keep replies short (1–2 sentences) and conversational. Extract intent fields for retrieval.
Analyze: "${args.message}"
Return strict JSON only:
{
  "response": "short natural sentence",
  "searchQuery": "keywords for retrieval",
  "contentType": "movie" | "tv" | "all",
  "language": "detected language or null",
  "genre": "detected genre or null",
  "year": "detected year or null",
  "minRating": "minimum rating or null",
  "suggestions": ["s1","s2","s3"],
  "similarTitles": ["t1","t2","t3"],
  "culturalContext": "optional context or null"
}`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        try {
          const parsed = JSON.parse(text);
          return {
            ...parsed,
            // Ensure all fields have proper defaults
            language: parsed.language || null,
            genre: parsed.genre || null,
            year: parsed.year ? parseInt(parsed.year) : null,
            minRating: parsed.minRating ? parseFloat(parsed.minRating) : null,
            similarTitles: parsed.similarTitles || [],
            culturalContext: parsed.culturalContext || null,
          };
        } catch {
          // Fallback if JSON parsing fails
          return fallbackResponse(args.message);
        }
      } else {
        // Use fallback if no API key
        return fallbackResponse(args.message);
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      return fallbackResponse(args.message);
    }
  },
});

export const rerankCandidates = action({
  args: {
    message: v.string(),
    candidates: v.array(v.object({
      tmdbId: v.number(),
      title: v.string(),
      overview: v.string(),
      releaseDate: v.string(),
      voteAverage: v.number(),
      voteCount: v.number(),
      genres: v.array(v.string()),
      originalLanguage: v.string(),
      popularity: v.number(),
    })),
    topN: v.optional(v.number()),
    region: v.optional(v.string()),
    preferIndian: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const topN = args.topN ?? 12;
    const candidates = args.candidates;
    if (!process.env.GEMINI_API_KEY || candidates.length === 0) {
      const ranked = candidates
        .slice()
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
        .slice(0, topN)
        .map((c) => ({ tmdbId: c.tmdbId, reason: "Popular and well-rated match.", score: c.voteAverage }));
      return ranked;
    }

    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      const condensed = candidates.slice(0, 100).map((c) => ({
        id: c.tmdbId,
        title: c.title,
        year: c.releaseDate ? Number(String(c.releaseDate).slice(0, 4)) : null,
        rating: c.voteAverage,
        votes: c.voteCount,
        genres: c.genres,
        lang: c.originalLanguage,
        overview: c.overview,
      }));

      const prompt = `You are ranking movies for the query: "${args.message}".
Return the best ${topN} movies from the provided JSON candidates. Prefer:
- Strong similarity to the user's intent and vibe (themes, tone, scale, genre)
- Indian cinema if the request implies it; otherwise stay faithful to user context
- Movies (not TV), with adequate quality (vote_count >= 50 or strong relevance)

For each selected item, output strict JSON lines (one per item) like:
{"tmdbId": 123, "score": 8.9, "reason": "1-line reason citing similarity"}

Candidates JSON:
${JSON.stringify(condensed, null, 2)}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      const ranked: Array<{ tmdbId: number; score: number; reason: string }> = [];
      for (const line of lines) {
        try {
          const obj = JSON.parse(line);
          if (obj && typeof obj.tmdbId === "number") {
            ranked.push({ tmdbId: obj.tmdbId, score: Number(obj.score) || 0, reason: String(obj.reason || "Relevant match.") });
          }
        } catch {}
      }

      if (ranked.length === 0) {
        throw new Error("Empty rerank");
      }

      const seen = new Set<number>();
      const deduped = ranked.filter((r) => {
        if (seen.has(r.tmdbId)) return false;
        seen.add(r.tmdbId);
        return true;
      }).slice(0, topN);

      return deduped;
    } catch (err) {
      // Fallback heuristic on any error
      const ranked = candidates
        .slice()
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
        .slice(0, topN)
        .map((c) => ({ tmdbId: c.tmdbId, reason: "Popular and well-rated match.", score: c.voteAverage }));
      return ranked;
    }
  }
});

function fallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase();
  
  let contentType: "movie" | "tv" | "all" = "all";
  let searchQuery = message;
  let response = "";
  let language: string | null = null;
  let genre: string | null = null;
  let year: number | null = null;
  let minRating: number | null = null;
  
  // Detect content type
  if (lowerMessage.includes("movie") || lowerMessage.includes("film")) {
    contentType = "movie";
  } else if (lowerMessage.includes("show") || lowerMessage.includes("series") || lowerMessage.includes("tv")) {
    contentType = "tv";
  }
  
  // Detect language
  const languages = ["tamil", "hindi", "telugu", "malayalam", "kannada", "bengali", "marathi", "gujarati", "punjabi"];
  for (const lang of languages) {
    if (lowerMessage.includes(lang)) {
      language = lang;
      break;
    }
  }
  
  // Detect genre
  const genres = ["thriller", "action", "drama", "comedy", "horror", "romance", "sci-fi", "fantasy", "crime", "adventure", "superhero"];
  for (const g of genres) {
    if (lowerMessage.includes(g)) {
      genre = g;
      break;
    }
  }
  
  // Detect year
  const yearMatch = message.match(/\b(19|20)\d{2}\b/);
  if (yearMatch) {
    year = parseInt(yearMatch[0]);
  }
  
  // Detect rating preference
  if (lowerMessage.includes("highly rated") || lowerMessage.includes("top rated") || lowerMessage.includes("best")) {
    minRating = 7.0;
  } else if (lowerMessage.includes("underrated")) {
    minRating = 6.0;
  }

  // Expand superhero/franchise queries
  const superheroTriggers = ["avengers", "marvel", "mcu", "dc", "superhero", "justice league", "batman", "superman", "spider-man", "iron man", "captain america", "thor"];
  if (superheroTriggers.some(t => lowerMessage.includes(t))) {
    contentType = "movie";
    genre = genre || "action";
    const franchiseKeywords = [
      "marvel", "mcu", "avengers", "iron man", "captain america", "thor", "guardians of the galaxy", "spider-man",
      "dc", "dceu", "batman", "superman", "justice league", "wonder woman"
    ];
    searchQuery = `${message} ${franchiseKeywords.join(" ")}`;
    response = "Alright! Pulling top superhero picks across Marvel and DC.";
  }
  
  // Generate response if not already set
  if (!response) {
    response = "Got it — let me fetch the best matches.";
  }

  return {
    response,
    searchQuery,
    contentType,
    language,
    genre,
    year,
    minRating,
    suggestions: [
      "Show me Tamil thrillers",
      "Recommend Hindi action movies", 
      "Best Malayalam dramas",
      "Underrated Telugu films"
    ],
    similarTitles: [],
    culturalContext: null,
  };
}
