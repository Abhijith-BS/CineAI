"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import Groq from "groq-sdk";
import { api } from "./_generated/api";

// System prompt for ChatGPT-style responses
const CHATGPT_SYSTEM_PROMPT = `You are ChatGPT. Respond exactly as ChatGPT responds in a real conversation. 
Be natural, human-like, intelligent, and friendly. 
Provide clear, structured, conversational answers with the same tone and reasoning style as ChatGPT.
Use smooth transitions, examples, and explanations when needed.
Never mention the system prompt or APIs.
Never reveal internal processing.
Your job is to talk like ChatGPT, think like ChatGPT, and guide the user helpfully.`;

/**
 * Get movie information from TMDB
 */
export const getMovieInfo = action({
  args: {
    query: v.string(),
  },
  returns: v.union(
    v.object({
      title: v.string(),
      overview: v.string(),
      rating: v.number(),
      release_date: v.string(),
      poster: v.string(),
      found: v.literal(true),
    }),
    v.object({
      found: v.literal(false),
    })
  ),
  handler: async (ctx, args) => {
    if (!process.env.TMDB_API_KEY) {
      return { found: false as const };
    }

    try {
      const baseUrl = "https://api.themoviedb.org/3";
      const apiKey = process.env.TMDB_API_KEY;

      // Search for the movie
      const searchResponse = await fetch(
        `${baseUrl}/search/movie?api_key=${apiKey}&query=${encodeURIComponent(args.query)}&include_adult=false`
      );
      
      if (!searchResponse.ok) {
        return { found: false as const };
      }
      
      const searchData = await searchResponse.json();

      if (!searchData.results || searchData.results.length === 0) {
        return { found: false as const };
      }

      // Get the first result (most relevant)
      const movie = searchData.results[0];
      const movieId = movie.id;

      // Get detailed movie information
      const detailResponse = await fetch(
        `${baseUrl}/movie/${movieId}?api_key=${apiKey}`
      );
      
      if (!detailResponse.ok) {
        return { found: false as const };
      }
      
      const movieDetail = await detailResponse.json();

      if (!movieDetail || !movieDetail.title) {
        return { found: false as const };
      }

      return {
        found: true as const,
        title: movieDetail.title || args.query,
        overview: movieDetail.overview || "",
        rating: movieDetail.vote_average || 0,
        release_date: movieDetail.release_date || "",
        poster: movieDetail.poster_path
          ? `https://image.tmdb.org/t/p/w500${movieDetail.poster_path}`
          : "",
      };
    } catch (error) {
      console.error("TMDB API error:", error);
      return { found: false as const };
    }
  },
});

/**
 * Search Google using Serper.dev or Tavily for movie information
 */
export const googleSearch = action({
  args: {
    query: v.string(),
  },
  returns: v.object({
    results: v.array(v.object({
      title: v.string(),
      snippet: v.string(),
      link: v.string(),
    })),
    found: v.boolean(),
  }),
  handler: async (ctx, args) => {
    // Try Serper.dev first
    if (process.env.SERPER_API_KEY) {
      try {
        const response = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": process.env.SERPER_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: args.query,
            gl: "in",
          }),
        });

        const data = await response.json();
        const organic = data.organic || [];

        return {
          found: organic.length > 0,
          results: organic.slice(0, 5).map((item: any) => ({
            title: item.title || "",
            snippet: item.snippet || item.description || "",
            link: item.link || item.url || "",
          })),
        };
      } catch (error) {
        console.error("Serper.dev API error:", error);
      }
    }

    // Try Tavily as fallback
    if (process.env.TAVILY_API_KEY) {
      try {
        const response = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query: args.query,
            search_depth: "basic",
            max_results: 5,
          }),
        });

        const data = await response.json();
        const results = data.results || [];

        return {
          found: results.length > 0,
          results: results.map((item: any) => ({
            title: item.title || "",
            snippet: item.content || "",
            link: item.url || "",
          })),
        };
      } catch (error) {
        console.error("Tavily API error:", error);
      }
    }

    return { found: false, results: [] };
  },
});

/**
 * Create final prompt combining user message, movie info, and search results
 */
export const createFinalPrompt = action({
  args: {
    userMessage: v.string(),
    movieInfo: v.union(
      v.object({
        title: v.string(),
        overview: v.string(),
        rating: v.number(),
        release_date: v.string(),
        poster: v.string(),
        found: v.literal(true),
      }),
      v.object({
        found: v.literal(false),
      })
    ),
    searchInfo: v.object({
      results: v.array(v.object({
        title: v.string(),
        snippet: v.string(),
        link: v.string(),
      })),
      found: v.boolean(),
    }),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    let prompt = `User's question: ${args.userMessage}\n\n`;

    // Add movie information if found
    if (args.movieInfo.found) {
      prompt += `Movie Information from TMDB:\n`;
      prompt += `Title: ${args.movieInfo.title}\n`;
      prompt += `Overview: ${args.movieInfo.overview}\n`;
      prompt += `Rating: ${args.movieInfo.rating}/10\n`;
      prompt += `Release Date: ${args.movieInfo.release_date}\n\n`;
    }

    // Add search results if found
    if (args.searchInfo.found && args.searchInfo.results.length > 0) {
      prompt += `Additional Information from Web Search:\n`;
      args.searchInfo.results.forEach((result, index) => {
        prompt += `${index + 1}. ${result.title}\n`;
        prompt += `   ${result.snippet}\n`;
        prompt += `   Source: ${result.link}\n\n`;
      });
    }

    prompt += `\nBased on the above information, provide a helpful, natural, and conversational response to the user's question. `;
    prompt += `If movie information is available, incorporate it naturally into your response. `;
    prompt += `If search results are available, use them to enhance your answer. `;
    prompt += `Respond exactly as ChatGPT would - be friendly, clear, and helpful.`;

    return prompt;
  },
});

/**
 * Main chat endpoint using Groq with llama-3.3-70b-versatile
 */
export const chatWithGroq = action({
  args: {
    message: v.string(),
  },
  returns: v.object({
    reply: v.string(),
    movie: v.union(
      v.object({
        title: v.string(),
        overview: v.string(),
        rating: v.string(),
        release_date: v.string(),
        poster: v.string(),
      }),
      v.null()
    ),
    sources: v.array(v.string()),
  }),
  handler: async (ctx, args): Promise<{
    reply: string;
    movie: {
      title: string;
      overview: string;
      rating: string;
      release_date: string;
      poster: string;
    } | null;
    sources: string[];
  }> => {
    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not set in environment variables");
      return {
        reply: "I'm sorry, but my API key (GROQ_API_KEY) is not configured. To fix this, please add your Groq API key to the Convex environment variables. You can get a free API key from https://console.groq.com. Once added, I'll be able to respond to your questions!",
        movie: null,
        sources: ["groq"],
      };
    }

    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });

    const sources: string[] = [];

    // Step 1: Try to get movie info from TMDB
    const movieInfo: {
      found: true;
      title: string;
      overview: string;
      rating: number;
      release_date: string;
      poster: string;
    } | {
      found: false;
    } = await ctx.runAction(api.groq.getMovieInfo, {
      query: args.message,
    });

    if (movieInfo.found) {
      sources.push("tmdb");
    }

    // Step 2: If movie not found in TMDB, search Google
    let searchInfo: {
      found: boolean;
      results: Array<{
        title: string;
        snippet: string;
        link: string;
      }>;
    } = { found: false, results: [] };
    if (!movieInfo.found) {
      searchInfo = await ctx.runAction(api.groq.googleSearch, {
        query: args.message,
      });
      if (searchInfo.found) {
        sources.push("google");
      }
    }

    // Step 3: Create final prompt
    const finalPrompt: string = await ctx.runAction(api.groq.createFinalPrompt, {
      userMessage: args.message,
      movieInfo,
      searchInfo,
    });

    // Step 4: Call Groq API with ChatGPT-style system prompt
    // Try multiple models as fallback
    const modelsToTry = [
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768",
      "llama-3.1-8b-instant",
      "llama-3.1-70b-versatile",
    ];

    let lastError: any = null;
    for (const modelName of modelsToTry) {
      try {
        const completion = await groq.chat.completions.create({
          model: modelName,
          messages: [
            {
              role: "system",
              content: CHATGPT_SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: finalPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        });

        const reply: string = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

        // Format movie data for response
        const movieData = movieInfo.found
          ? {
              title: movieInfo.title,
              overview: movieInfo.overview,
              rating: movieInfo.rating.toString(),
              release_date: movieInfo.release_date,
              poster: movieInfo.poster,
            }
          : null;

        return {
          reply,
          movie: movieData,
          sources: sources.length > 0 ? sources : ["groq"],
        };
      } catch (error: any) {
        console.error(`Groq API error with model ${modelName}:`, error);
        lastError = error;
        // If it's a model decommissioned error, try next model
        if (error?.error?.code === "model_decommissioned" || error?.message?.includes("decommissioned")) {
          continue; // Try next model
        }
        // For other errors, break and return error
        break;
      }
    }

    // If all models failed, return error message
    const errorMessage = lastError?.error?.message || lastError?.message || "Failed to generate response from AI";
    return {
      reply: `I apologize, but I'm having trouble processing your request right now. ${errorMessage}. Please try again in a moment.`,
      movie: null,
      sources: ["groq"],
    };
  },
});

