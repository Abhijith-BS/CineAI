import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieCard } from "./MovieCard";

interface ChatInterfaceProps {
  setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
  setSelectedMovieId: (id: string) => void;
}

export function ChatInterface({ setCurrentView, setSelectedMovieId }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatHistory = useQuery(api.chat.getChatHistory, { limit: 20 });
  const chatWithAI = useAction(api.chat.chatWithAI);

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    setIsLoading(true);
    try {
      await chatWithAI({ message: message.trim() });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieClick = (movieId: string) => {
    setSelectedMovieId(movieId);
    setCurrentView("movie");
  };

  const handleSuggestionClick = (suggestion: string) => {
    setMessage(suggestion);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-black/20 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-2xl font-bold text-white mb-2">AI Movie Assistant</h2>
          <p className="text-gray-300">Ask me about movies and TV shows from around the world!</p>
        </div>

        {/* Chat Messages */}
        <div className="h-96 overflow-y-auto p-6 space-y-4">
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
                    <div className="whitespace-pre-line">{chat.response}</div>
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
                                onClick={() => handleMovieClick(movie._id)}
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
                              onClick={() => handleMovieClick(show._id)}
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
        </div>

        {/* Input */}
        <div className="p-6 border-t border-white/10">
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
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-full transition-all duration-200"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
