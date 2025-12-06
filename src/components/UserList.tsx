import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MovieCard } from "./MovieCard";
import { AnimatedHeading } from "./AnimatedHeading";
import { useEffect, useRef } from "react";
import gsap from "gsap";

interface UserListProps {
    type: "favorites" | "watchlist";
    setCurrentView: (view: "home" | "chat" | "movie" | "search") => void;
    setSelectedMovieId: (id: string) => void;
    setSelectedContentType: (type: "movie" | "tv") => void;
}

export function UserList({ type, setCurrentView, setSelectedMovieId, setSelectedContentType }: UserListProps) {
    const query = type === "favorites" ? api.movies.getUserFavorites : api.movies.getUserWatchlist;
    const items = useQuery(query, {});
    console.log("UserList items:", items);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && items && items.length > 0) {
            gsap.fromTo(
                containerRef.current.querySelectorAll(".movie-card"),
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: "power2.out" }
            );
        }
    }, [items]);

    const title = type === "favorites" ? "Your Favorites" : "Your Watchlist";
    const emptyMessage = type === "favorites"
        ? "You haven't added any favorites yet."
        : "Your watchlist is empty.";

    if (items === undefined) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
            </div>
        );
    }

    return (
        <div ref={containerRef} className="space-y-8">
            <div className="flex items-center gap-4 mb-8">
                <AnimatedHeading text={title} />
                <span className="bg-white/10 px-3 py-1 rounded-full text-sm text-gray-400">
                    {items ? items.length : 0} items
                </span>
            </div>

            {(!items || items.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/10">
                    <div className="text-6xl mb-4 opacity-50">
                        {type === "favorites" ? "❤️" : "bookmark"}
                    </div>
                    <p className="text-xl text-gray-300 font-medium mb-2">{emptyMessage}</p>
                    <p className="text-gray-500 mb-6">Explore movies and shows to add them to your list.</p>
                    <button
                        onClick={() => setCurrentView("home")}
                        className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full transition-colors"
                    >
                        Browse Content
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {items.map((item: any) => (
                        <div key={item._id} className="movie-card">
                            <MovieCard
                                item={item}
                                type={item.type || "movie"}
                                onClick={() => {
                                    setSelectedMovieId(item._id);
                                    setSelectedContentType(item.type || "movie");
                                    setCurrentView("movie");
                                }}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
