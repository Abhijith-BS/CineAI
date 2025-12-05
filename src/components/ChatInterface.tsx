import { useState, useEffect, useRef } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieCard } from "./MovieCard";
import { AnimatedHeading } from "./AnimatedHeading";
import gsap from "gsap";

interface ChatInterfaceProps {
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string) => void;
  setSelectedContentType?: (type: "movie" | "tv") => void;
  onGoHome: () => void;
}

export function ChatInterface({ setCurrentView, setSelectedMovieId, setSelectedContentType, onGoHome }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatHistory = useQuery(api.chat.getChatHistory, { limit: 20 });
  const chatWithAI = useAction(api.chat.chatWithAI);
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Ensure content is visible immediately - no fade animations
  useEffect(() => {
    if (containerRef.current) {
      gsap.set(containerRef.current, { opacity: 1, visibility: "visible" });
    }
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    const messageToSend = message.trim();
    setMessage("");
    setIsLoading(true);
    
    try {
      const result = await chatWithAI({ message: messageToSend });
      
      if (!result.success) {
        // Show error message to user
        alert(result.error || "Failed to send message. Please try again.");
        // Restore message if there was an error
        setMessage(messageToSend);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage = error?.message || "An unexpected error occurred. Please try again.";
      alert(errorMessage);
      // Restore message on error
      setMessage(messageToSend);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieClick = (movieId: string, type: "movie" | "tv" = "movie") => {
    setSelectedMovieId(movieId);
    if (setSelectedContentType) {
      setSelectedContentType(type);
    }
    setCurrentView("movie");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div ref={containerRef} className="max-w-7xl mx-auto w-full h-screen flex flex-col overflow-hidden relative">
      {/* Fixed Back Button - Fixed position, always on top and clickable */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onGoHome();
        }}
        style={{ 
          position: 'fixed',
          top: '4.5rem',
          left: '0.5rem',
          zIndex: 99999,
          pointerEvents: 'auto'
        }}
        className="flex items-center space-x-1.5 text-gray-300 hover:text-white transition-colors bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm"
        onMouseEnter={(e) => {
          gsap.to(e.currentTarget, {
            x: -5,
            scale: 1.05,
            color: "#a855f7",
            duration: 0.3,
            ease: "power2.out",
          });
        }}
        onMouseLeave={(e) => {
          gsap.to(e.currentTarget, {
            x: 0,
            scale: 1,
            color: "#d1d5db",
            duration: 0.3,
            ease: "power2.out",
          });
        }}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span>Back to Home</span>
      </button>

      <div className="bg-black/20 rounded-2xl border border-white/10 flex flex-col flex-1 min-h-0 overflow-hidden relative" style={{ zIndex: 1 }}>
        {/* Fixed Header - Will not scroll */}
        <div className="flex-shrink-0 p-6 pt-8 border-b border-white/10 bg-black/20 relative z-20">
          <AnimatedHeading 
            text="Discover Movies with AI"
            className="mb-2 text-2xl md:text-3xl"
          />
          <p 
            className="text-gray-300"
          >
            Ask me about movies and TV shows from around the world!
          </p>
        </div>

        {/* Scrollable Chat Messages - Only this area scrolls */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 relative z-0" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {isLoading && chatHistory && chatHistory.length === 0 && (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-400">Thinking...</div>
            </div>
          )}
          {chatHistory === undefined ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
            </div>
          ) : chatHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <div className="text-4xl mb-4">🎬</div>
              <p>Start a conversation! Try asking:</p>
              <div className="mt-4 space-y-2">
                <button
                  onClick={() => setMessage("Show me underrated Tamil thrillers like Vikram Vedha")}
                  className="block w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  "Show me underrated Tamil thrillers like Vikram Vedha"
                </button>
                <button
                  onClick={() => setMessage("Recommend Malayalam crime dramas")}
                  className="block w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  "Recommend Malayalam crime dramas"
                </button>
                <button
                  onClick={() => setMessage("Best Hindi movies of 2023")}
                  className="block w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  "Best Hindi movies of 2023"
                </button>
                <button
                  onClick={() => setMessage("Show me Korean thrillers")}
                  className="block w-full text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  "Show me Korean thrillers"
                </button>
              </div>
            </div>
          ) : (
            chatHistory.map((chat) => (
              <div key={chat._id} className="space-y-4">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-2xl rounded-br-md max-w-xs">
                    {chat.message}
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="bg-white/10 text-white p-3 rounded-2xl rounded-bl-md max-w-md">
                    <div className="whitespace-pre-line">
                      {chat.response || "I apologize, but I couldn't generate a response. Please try again."}
                    </div>
                  </div>
                </div>

                {/* Movie/Show Results */}
                {(chat.movies.length > 0 || chat.shows.length > 0) && (
                  <div className="ml-4 space-y-3">
                    {chat.movies.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">Movies:</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {chat.movies.slice(0, 12).map((movie) => (
                            <div key={movie._id} className="relative">
                              <MovieCard
                                item={movie}
                                type="movie"
                                onClick={() => handleMovieClick(movie._id, "movie")}
                              />
                              {/* OTT Platform Indicators */}
                              {(movie as any).ottPlatforms && (movie as any).ottPlatforms.length > 0 && (
                                <div className="absolute bottom-1 left-1 flex space-x-1">
                                  {(movie as any).ottPlatforms.slice(0, 2).map((platform: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center"
                                      title={`Available on ${platform.name}`}
                                    >
                                      <span className="text-xs text-white">▶</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {chat.shows.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-300 mb-2">TV Shows:</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {chat.shows.slice(0, 12).map((show) => (
                            <MovieCard
                              key={show._id}
                              item={show}
                              type="tv"
                              onClick={() => handleMovieClick(show._id, "tv")}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Fixed Input */}
        <div className="flex-shrink-0 p-6 border-t border-white/10">
          <div className="flex space-x-3">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              placeholder="Ask about movies, shows, or get recommendations..."
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/50"
              onMouseEnter={(e) => {
                if (!e.currentTarget.disabled) {
                  gsap.to(e.currentTarget, {
                    scale: 1.05,
                    boxShadow: "0 20px 40px rgba(168, 85, 247, 0.5)",
                    duration: 0.3,
                    ease: "power2.out",
                  });
                }
              }}
              onMouseLeave={(e) => {
                gsap.to(e.currentTarget, {
                  scale: 1,
                  boxShadow: "none",
                  duration: 0.3,
                  ease: "power2.out",
                });
              }}
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        /* Hide scrollbar for Chrome, Safari and Opera */
        div[style*="scrollbarWidth"]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
