# Movie Recommendation with AI Chat
  
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

## Real-Time Group Voting Rooms ("Movie Night")

CineAI features a collaborative, real-time decision-making room called **Movie Night** to end the endless "what should we watch?" argument with friends.

### How It Works:
1. **Room Creation & Code Generation** (`convex/rooms.ts`):
   - A logged-in host creates a room with optional genre or streaming provider filters.
   - The backend generates a unique 4-letter room code (e.g. `ABCD`) and sets up a reactive session.
2. **Instant Joining via Code/Link**:
   - Friends enter the code in `MovieNightLobby.tsx` or click a shared room link.
   - Non-anonymous authentication is enforced to ensure verified participant identities.
3. **Real-Time Reactive State**:
   - Built on Convex's real-time WebSocket subscriptions (`getRoomState`).
   - Every participant's screen stays 100% in sync with zero page refreshes (live user presence list, active candidate list, and vote tally).
4. **Interactive Swiping & Candidate Voting**:
   - **Tinder-style Swiping** (`MovieNightSwipe.tsx`): Swipe right to like or left to dislike on movie cards.
   - **Room Selections**: Members can also suggest candidate movies and toggle agreement votes (`toggleSelectionVote`).
5. **Instant Match Detection**:
   - When all participants swipe "like" on the same title (or when voting concludes), the backend records a match in the `matches` table.
   - A celebratory match modal appears simultaneously across all connected devices so the group can start watching immediately.

## Future Enhancements & Roadmap

- [ ] **P2P OTT Subscription Sharing & Micro-Monetization Marketplace**:
  - A secure peer-to-peer connection hub where users can host synchronized watch parties and share access to their streaming subscriptions (Netflix, Amazon Prime Video, Disney+, etc.).
  - **Micro-pricing system**: Account holders can set an affordable, per-stream or per-session fee, allowing viewers to access specific movies without purchasing full monthly subscriptions while letting hosts earn passive income from spare account slots.
  - **Shared Watch Party Sync**: Synchronized video playback (play/pause/seek sync) paired with live voice and text chat rooms.
- [ ] **Voice-Activated Search & Conversation**:
  - Direct speech-to-speech interaction powered by Web Speech API or Whisper.
- [ ] **Personalized AI Taste Profiles**:
  - Long-term memory vectors to recommend movies based on past ratings, reviews, and swipe history.

### Getting API Keys

- **Groq API Key**: Sign up at [console.groq.com](https://console.groq.com)
- **TMDB API Key**: Get free API key from [themoviedb.org](https://www.themoviedb.org/settings/api)
- **Serper.dev API Key**: Sign up at [serper.dev](https://serper.dev) (for Google Search)
- **Tavily API Key**: Sign up at [tavily.com](https://tavily.com) (alternative Google Search provider)
