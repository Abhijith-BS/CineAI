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
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        const prompt = `You are an expert movie and TV show recommendation assistant with deep knowledge of cinema from around the world, especially Indian cinema (Bollywood, Tollywood, Kollywood, etc.).

Analyze this user message: "${args.message}"

Extract and provide:
1. A helpful, engaging response about movies/shows
2. Search keywords to find relevant content
3. Content type preference (movie/tv/all)
4. Language preference (if mentioned - Tamil, Hindi, Telugu, Malayalam, etc.)
5. Genre preference (if mentioned - thriller, action, drama, etc.)
6. Year preference (if mentioned)
7. Rating preference (if they want highly rated content)
8. Similar movies/shows they might like

For queries about specific regional cinema (like Tamil, Telugu, Malayalam), provide culturally aware responses and mention notable directors, actors, or film movements when relevant.

Respond in JSON format:
{
  "response": "Your engaging response here with cultural context if relevant",
  "searchQuery": "keywords to search for",
  "contentType": "movie" | "tv" | "all",
  "language": "detected language or null",
  "genre": "detected genre or null", 
  "year": "detected year or null",
  "minRating": "minimum rating preference or null",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "similarTitles": ["similar movie 1", "similar movie 2", "similar movie 3"],
  "culturalContext": "relevant cultural or industry context if applicable"
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

function fallbackResponse(message: string) {
  const lowerMessage = message.toLowerCase();
  
  let contentType: "movie" | "tv" | "all" = "all";
  let searchQuery = message;
  let response = "";
  let language = null;
  let genre = null;
  let year = null;
  let minRating = null;
  
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
  const genres = ["thriller", "action", "drama", "comedy", "horror", "romance", "sci-fi", "fantasy", "crime"];
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
  
  // Generate response
  if (language && genre) {
    response = `I'll help you find great ${language} ${genre} movies! Let me search for some recommendations.`;
  } else if (language) {
    response = `Looking for ${language} cinema! I'll find some excellent recommendations for you.`;
  } else if (genre) {
    response = `Great choice! I'll find some excellent ${genre} movies for you.`;
  } else if (lowerMessage.includes("recommend") || lowerMessage.includes("suggest")) {
    response = "Here are some recommendations based on your preferences:";
  } else {
    response = "I found some content that matches your search:";
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
