# IMDB Clone with AI Chat
  
This is a project built with [Chef](https://chef.convex.dev) using [Convex](https://convex.dev) as its backend.
 You can find docs about Chef with useful information like how to deploy to production [here](https://docs.convex.dev/chef).
  
This project is connected to the Convex deployment named [`zealous-manatee-45`](https://dashboard.convex.dev/d/zealous-manatee-45).
  
## Project structure
  
The frontend code is in the `app` directory and is built with [Vite](https://vitejs.dev/).
  
The backend code is in the `convex` directory.
  
`npm run dev` will start the frontend and backend servers.

## App authentication

Chef apps use [Convex Auth](https://auth.convex.dev/) with Anonymous auth for easy sign in. You may wish to change this before deploying your app.

## Developing and deploying your app

Check out the [Convex docs](https://docs.convex.dev/) for more information on how to develop with Convex.
* If you're new to Convex, the [Overview](https://docs.convex.dev/understanding/) is a good place to start
* Check out the [Hosting and Deployment](https://docs.convex.dev/production/) docs for how to deploy your app
* Read the [Best Practices](https://docs.convex.dev/understanding/best-practices/) guide for tips on how to improve you app further

## HTTP API

User-defined http routes are defined in the `convex/router.ts` file. We split these routes into a separate file from `convex/http.ts` to allow us to prevent the LLM from modifying the authentication routes.

## AI Chat System

This app uses **Groq API with llama-3.3-70b-versatile** model to provide ChatGPT-style conversational responses about movies and TV shows.

### Environment Variables

Add these to your `.env.local` file (or Convex dashboard environment variables):

```env
# Required
GROQ_API_KEY=your_groq_api_key_here

# Required for movie information
TMDB_API_KEY=your_tmdb_api_key_here

# Optional - for web search fallback (use one or both)
SERPER_API_KEY=your_serper_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```

### How it works

1. **Movie Information**: First checks TMDB API for movie details
2. **Web Search**: If not found in TMDB, automatically searches Google (via Serper.dev or Tavily)
3. **AI Response**: Combines all information and generates a ChatGPT-style response using Groq's llama-3.3-70b-versatile model
4. **Response Format**: Returns JSON with:
   - `reply`: ChatGPT-style conversational response
   - `movie`: Movie information (if found)
   - `sources`: Array of data sources used (tmdb, google, groq)

### Getting API Keys

- **Groq API Key**: Sign up at [console.groq.com](https://console.groq.com)
- **TMDB API Key**: Get free API key from [themoviedb.org](https://www.themoviedb.org/settings/api)
- **Serper.dev API Key**: Sign up at [serper.dev](https://serper.dev) (for Google Search)
- **Tavily API Key**: Sign up at [tavily.com](https://tavily.com) (alternative Google Search provider)
