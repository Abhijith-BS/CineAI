import { useState, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { MovieNightSwipe } from "./MovieNightSwipe";
import { toast } from "sonner";
import gsap from "gsap";

export function MovieNightRoom({ roomId, onLeave }: { roomId: any, onLeave: () => void }) {
    const roomState = useQuery(api.rooms.getRoomState, { roomId });
    const getPopularMovies = useAction(api.externalApi.getPopularMovies);
    const [movies, setMovies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch movies only once on mount
    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const results = await getPopularMovies({ page: 1 });
                if (results) setMovies(results);
            } catch (error) {
                console.error("Failed to fetch movies", error);
                toast.error("Failed to load movies for session");
            } finally {
                setLoading(false);
            }
        };
        fetchMovies();
    }, [getPopularMovies]);

    // Match handling
    useEffect(() => {
        if (roomState?.matches && roomState.matches.length > 0) {
            toast.success("It's a Match! 🎉");
        }
    }, [roomState?.matches?.length]);

    if (!roomState || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mb-4"></div>
                <p className="text-gray-400">Loading your session...</p>
            </div>
        );
    }

    const { room, users, matches } = roomState;
    const hasMatch = matches && matches.length > 0;

    if (hasMatch) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-in fade-in duration-700">
                <div className="text-6xl mb-6">🎉</div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8">
                    It's a Match!
                </h1>

                <div className="grid gap-8 w-full max-w-4xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {matches.map((match: any) => (
                        <div key={match._id} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20">
                            <img
                                src={match.moviePoster.startsWith("http") ? match.moviePoster : `https://image.tmdb.org/t/p/w500${match.moviePoster}`}
                                alt={match.movieTitle}
                                className="w-full aspect-[2/3] object-cover rounded-xl mb-4"
                            />
                            <h3 className="text-xl font-bold text-white mb-2">{match.movieTitle}</h3>
                            <p className="text-sm text-green-400">Matched!</p>
                        </div>
                    ))}
                </div>

                <button
                    onClick={onLeave}
                    className="mt-12 px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-semibold transition-colors"
                >
                    Leave Room
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-6xl mx-auto p-4">
            {/* Header / Room Info */}
            <div className="flex items-center justify-between mb-8 bg-white/5 rounded-full px-6 py-3 border border-white/10">
                <div className="flex items-center gap-4">
                    <span className="text-purple-400 font-mono text-xl tracking-widest border border-purple-500/30 px-3 py-1 rounded bg-purple-500/10">
                        {room?.code}
                    </span>
                    <div className="flex -space-x-2">
                        {users?.map((u: any) => (
                            <div key={u._id} className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold ring-2 ring-gray-900" title={u.userName}>
                                {u.userName[0].toUpperCase()}
                            </div>
                        ))}
                    </div>
                </div>
                <button onClick={onLeave} className="text-sm text-gray-400 hover:text-white transition-colors">
                    Leave
                </button>
            </div>

            <MovieNightSwipe roomId={roomId} movies={movies} />
        </div>
    );
}
