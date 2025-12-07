import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import gsap from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

interface Movie {
    tmdbId: number;
    title: string;
    posterPath?: string;
    overview: string;
    voteAverage: number;
}

interface MovieNightSwipeProps {
    roomId: any;
    movies: Movie[];
}

export function MovieNightSwipe({ roomId, movies }: MovieNightSwipeProps) {
    const vote = useMutation(api.rooms.vote);
    const [currentIndex, setCurrentIndex] = useState(0);
    const cardRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const currentMovie = movies[currentIndex];

    // Handle Vote
    const handleVote = async (direction: "like" | "dislike") => {
        if (!currentMovie) return;

        // Animate card off screen
        if (cardRef.current) {
            const xDir = direction === "like" ? 500 : -500;
            const rotation = direction === "like" ? 20 : -20;

            await gsap.to(cardRef.current, {
                x: xDir,
                rotation: rotation,
                opacity: 0,
                duration: 0.4,
                ease: "power2.in"
            });
        }

        // Submit vote
        try {
            await vote({
                roomId,
                movieId: currentMovie.tmdbId,
                movieTitle: currentMovie.title,
                moviePoster: currentMovie.posterPath || "",
                vote: direction
            });
        } catch (err) {
            console.error(err);
        }

        // Reset and advance
        setCurrentIndex(prev => prev + 1);

        // Reset card position immediately for next render
        if (cardRef.current) {
            gsap.set(cardRef.current, { x: 0, rotation: 0, opacity: 1 });
            // Animate entrance of new card
            gsap.from(cardRef.current, {
                scale: 0.9,
                opacity: 0,
                duration: 0.4,
                ease: "back.out(1.7)"
            });
        }
    };

    if (currentIndex >= movies.length) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <div className="text-6xl mb-4">🎬</div>
                <h2 className="text-3xl font-bold text-white mb-2">That's a wrap!</h2>
                <p className="text-gray-400">Waiting for matches...</p>
            </div>
        );
    }

    if (!currentMovie) return null;

    const posterUrl = currentMovie.posterPath
        ? (currentMovie.posterPath.startsWith("http") ? currentMovie.posterPath : `https://image.tmdb.org/t/p/w500${currentMovie.posterPath}`)
        : null;

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-md mx-auto relative overflow-hidden" ref={containerRef}>
            {/* Card Stack */}
            <div className="relative w-full aspect-[2/3] px-4">
                {/* Card */}
                <div
                    ref={cardRef}
                    className="absolute inset-x-4 inset-y-0 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-white/10 select-none cursor-grab active:cursor-grabbing"
                >
                    {/* Image */}
                    {posterUrl ? (
                        <img src={posterUrl} alt={currentMovie.title} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
                    ) : (
                        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <span className="text-gray-500">No Image</span>
                        </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-8 text-left">
                        <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">{currentMovie.title}</h2>
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-yellow-400 font-bold">⭐ {currentMovie.voteAverage.toFixed(1)}</span>
                        </div>
                        <p className="text-gray-300 text-sm line-clamp-3 mb-4">{currentMovie.overview}</p>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex gap-8 mt-8">
                <button
                    onClick={() => handleVote("dislike")}
                    className="w-16 h-16 rounded-full bg-gray-800 text-red-500 flex items-center justify-center text-3xl hover:bg-red-500/20 hover:scale-110 transition-all shadow-lg"
                >
                    ✕
                </button>
                <button
                    onClick={() => handleVote("like")}
                    className="w-16 h-16 rounded-full bg-gray-800 text-green-500 flex items-center justify-center text-3xl hover:bg-green-500/20 hover:scale-110 transition-all shadow-lg"
                >
                    ♥
                </button>
            </div>
        </div>
    );
}
