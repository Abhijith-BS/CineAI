import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { HomePage } from "./components/HomePage";
import { ChatInterface } from "./components/ChatInterface";
import { MovieDetails } from "./components/MovieDetails";
import { SearchResults } from "./components/SearchResults";
import { useState } from "react";

export default function App() {
  const [currentView, setCurrentView] = useState<"home" | "chat" | "movie" | "search">("home");
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center space-x-8">
            <h1 
              className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent cursor-pointer"
              onClick={() => setCurrentView("home")}
            >
              CineAI
            </h1>
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => setCurrentView("home")}
                className={`text-sm font-medium transition-colors ${currentView === "home" ? "text-purple-400" : "text-gray-300 hover:text-white"}`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView("chat")}
                className={`text-sm font-medium transition-colors ${currentView === "chat" ? "text-purple-400" : "text-gray-300 hover:text-white"}`}
              >
                AI Chat
              </button>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Authenticated>
              <div className="hidden md:flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search movies & shows..."
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      setCurrentView("search");
                    }
                  }}
                />
              </div>
              <SignOutButton />
            </Authenticated>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Authenticated>
          <Content 
            currentView={currentView}
            selectedMovieId={selectedMovieId}
            searchQuery={searchQuery}
            setCurrentView={setCurrentView}
            setSelectedMovieId={setSelectedMovieId}
          />
        </Authenticated>
        
        <Unauthenticated>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                  Welcome to CineAI
                </h1>
                <p className="text-gray-300 text-lg">
                  Discover movies and shows with AI-powered conversations
                </p>
              </div>
              <SignInForm />
            </div>
          </div>
        </Unauthenticated>
      </main>
      
      <Toaster />
    </div>
  );
}

function Content({ 
  currentView, 
  selectedMovieId, 
  searchQuery, 
  setCurrentView, 
  setSelectedMovieId 
}: {
  currentView: string;
  selectedMovieId: string | null;
  searchQuery: string;
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string | null) => void;
}) {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  switch (currentView) {
    case "chat":
      return <ChatInterface setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />;
    case "movie":
      return selectedMovieId ? (
        <MovieDetails movieId={selectedMovieId} setCurrentView={setCurrentView} />
      ) : (
        <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />
      );
    case "search":
      return <SearchResults query={searchQuery} setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />;
    default:
      return <HomePage setCurrentView={setCurrentView} setSelectedMovieId={setSelectedMovieId} />;
  }
}
