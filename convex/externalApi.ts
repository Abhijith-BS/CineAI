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
      const results = [];
      
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
      
      // Sort by relevance and rating
      return results
        .sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0))
        .slice(0, 20);
        
    } catch (error) {
      console.error("External API search error:", error);
      // Return sample results as fallback
      return generateSampleResults(args);
    }
  },
});

async function searchTMDB(args: any) {
  try {
    const baseUrl = "https://api.themoviedb.org/3";
    const apiKey = process.env.TMDB_API_KEY;
    
    // Build search parameters
    const params: any = {
      api_key: apiKey,
      query: args.query,
      include_adult: false,
    };
    
    if (args.language) {
      // Map common language names to ISO codes
      const languageMap: Record<string, string> = {
        'tamil': 'ta',
        'hindi': 'hi',
        'telugu': 'te',
        'malayalam': 'ml',
        'kannada': 'kn',
        'bengali': 'bn',
        'marathi': 'mr',
        'gujarati': 'gu',
        'punjabi': 'pa',
        'english': 'en',
        'spanish': 'es',
        'french': 'fr',
        'german': 'de',
        'italian': 'it',
        'japanese': 'ja',
        'korean': 'ko',
        'chinese': 'zh',
      };
      
      const langCode = languageMap[args.language.toLowerCase()] || args.language;
      params.with_original_language = langCode;
    }
    
    if (args.year) {
      params.year = args.year;
    }
    
    // Search for movies
    const response = await axios.get(`${baseUrl}/search/movie`, { params });
    const movies = response.data.results || [];
    
    // Filter by genre and rating if specified
    let filteredMovies = movies;
    
    if (args.genre || args.minRating) {
      filteredMovies = movies.filter((movie: any) => {
        if (args.minRating && movie.vote_average < args.minRating) {
          return false;
        }
        return true;
      });
    }
    
    // Get detailed info for top results
    const detailedMovies = [];
    for (const movie of filteredMovies.slice(0, 10)) {
      try {
        const detailResponse = await axios.get(`${baseUrl}/movie/${movie.id}`, {
          params: { api_key: apiKey }
        });
        
        const movieDetail = detailResponse.data;
        
        // Check genre filter
        if (args.genre) {
          const hasGenre = movieDetail.genres?.some((g: any) => 
            g.name.toLowerCase().includes(args.genre.toLowerCase())
          );
          if (!hasGenre) continue;
        }
        
        detailedMovies.push({
          tmdbId: movieDetail.id,
          title: movieDetail.title,
          overview: movieDetail.overview || "",
          releaseDate: movieDetail.release_date || "",
          posterPath: movieDetail.poster_path,
          backdropPath: movieDetail.backdrop_path,
          voteAverage: movieDetail.vote_average || 0,
          voteCount: movieDetail.vote_count || 0,
          genres: movieDetail.genres?.map((g: any) => g.name) || [],
          runtime: movieDetail.runtime,
          budget: movieDetail.budget,
          revenue: movieDetail.revenue,
          tagline: movieDetail.tagline,
          status: movieDetail.status,
          originalLanguage: movieDetail.original_language || "en",
          popularity: movieDetail.popularity || 0,
          adult: movieDetail.adult || false,
          video: movieDetail.video || false,
          source: "tmdb"
        });
      } catch (detailError) {
        console.error("Error fetching movie details:", detailError);
      }
    }
    
    return detailedMovies;
  } catch (error) {
    console.error("TMDB API error:", error);
    return [];
  }
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
    
    const detailedMovies = [];
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
          const languages = movieDetail.Language?.toLowerCase() || "";
          if (!languages.includes(args.language.toLowerCase())) {
            continue;
          }
        }
        
        // Filter by genre if specified
        if (args.genre) {
          const genres = movieDetail.Genre?.toLowerCase() || "";
          if (!genres.includes(args.genre.toLowerCase())) {
            continue;
          }
        }
        
        // Filter by rating if specified
        const imdbRating = parseFloat(movieDetail.imdbRating) || 0;
        if (args.minRating && imdbRating < args.minRating) {
          continue;
        }
        
        detailedMovies.push({
          tmdbId: parseInt(movie.imdbID.replace("tt", "")) || 0,
          title: movieDetail.Title,
          overview: movieDetail.Plot || "",
          releaseDate: movieDetail.Released || "",
          posterPath: movieDetail.Poster !== "N/A" ? movieDetail.Poster : null,
          backdropPath: null,
          voteAverage: imdbRating,
          voteCount: parseInt(movieDetail.imdbVotes?.replace(/,/g, "")) || 0,
          genres: movieDetail.Genre?.split(", ") || [],
          runtime: parseInt(movieDetail.Runtime?.replace(" min", "")) || null,
          budget: null,
          revenue: null,
          tagline: null,
          status: "Released",
          originalLanguage: movieDetail.Language?.split(",")[0]?.trim().toLowerCase() || "en",
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

// Get OTT platform availability (JustWatch alternative using TMDB)
export const getOTTPlatforms = action({
  args: {
    tmdbId: v.number(),
    country: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      if (!process.env.TMDB_API_KEY) return [];
      
      const baseUrl = "https://api.themoviedb.org/3";
      const country = args.country || "IN"; // Default to India for Tamil movies
      
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
      
      const platforms = [];
      
      // Streaming platforms
      if (providers.flatrate) {
        platforms.push(...providers.flatrate.map((p: any) => ({
          name: p.provider_name,
          type: "stream",
          logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        })));
      }
      
      // Rental platforms
      if (providers.rent) {
        platforms.push(...providers.rent.map((p: any) => ({
          name: p.provider_name,
          type: "rent",
          logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        })));
      }
      
      // Purchase platforms
      if (providers.buy) {
        platforms.push(...providers.buy.map((p: any) => ({
          name: p.provider_name,
          type: "buy",
          logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
        })));
      }
      
      return platforms;
    } catch (error) {
      console.error("OTT platforms error:", error);
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
