import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { Id } from '../../../convex/_generated/dataModel';
import { SearchBox } from '../SearchBox';
import { MovieCard } from '../MovieCard';
import { ContentDetails } from '../ContentDetails';
import gsap from 'gsap';
import { toast } from 'sonner';

interface MovieNightRoomProps {
    roomId: Id<"rooms">;
    onLeave: () => void;
}

export function MovieNightRoom({ roomId, onLeave }: MovieNightRoomProps) {
    const roomState = useQuery(api.rooms.getRoomState, { roomId });
    const user = useQuery(api.auth.loggedInUser);

    // Mutations & Actions
    const addMovieToRoom = useMutation(api.rooms.addContentToRoom);
    const removeSelection = useMutation(api.rooms.removeSelection);
    const toggleVote = useMutation(api.rooms.toggleSelectionVote);
    const finishVoting = useMutation(api.rooms.finishVoting);
    const performSearch = useAction(api.movies.searchContent);

    // Queries for Trending
    const trendingMovies = useQuery(api.movies.getTrendingMovies, {}) || [];
    const trendingShows = useQuery(api.movies.getTrendingShows, {}) || [];

    // State
    const [trendingType, setTrendingType] = useState<"movie" | "tv">("movie");
    const [selectedContent, setSelectedContent] = useState<{ id: string, type: "movie" | "tv" } | null>(null);
    const [loadedContent, setLoadedContent] = useState<any>(null); // To check selection status via TMDB ID

    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<{ movies: any[], shows: any[] } | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const sidebarRef = useRef<HTMLDivElement>(null);

    // Filtered Trending List
    const trendingList = trendingType === "movie" ? (trendingMovies.length ? trendingMovies : []) : (trendingShows.length ? trendingShows : []);

    // Derived State
    // @ts-ignore
    const myUser = roomState?.users.find(u => u.userId === user?._id);
    // @ts-ignore
    const isHost = roomState?.room.hostId === user?._id;
    // @ts-ignore
    const allUsersFinished = roomState?.users.every(u => u.votingFinished);
    const amIFinished = myUser?.votingFinished;
    // @ts-ignore
    const hasMatch = roomState?.room.status === "matched";
    const matches = roomState?.matches || [];

    // Search Effect
    useEffect(() => {
        const doSearch = async () => {
            if (!searchQuery.trim()) {
                setSearchResults(null);
                return;
            }
            setIsSearching(true);
            try {
                // @ts-ignore
                const results = await performSearch({ query: searchQuery, type: "all" });
                setSearchResults(results);
            } catch (e) {
                console.error("Search failed", e);
            } finally {
                setIsSearching(false);
            }
        };

        const timeoutId = setTimeout(doSearch, 500); // 500ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchQuery, performSearch]);

    // Animation for sidebar
    useEffect(() => {
        if (selectedContent && sidebarRef.current) {
            gsap.fromTo(sidebarRef.current,
                { x: "100%" },
                { x: "0%", duration: 0.5, ease: "power3.out" }
            );
        }
    }, [selectedContent]);

    const handleCloseSidebar = () => {
        if (sidebarRef.current) {
            gsap.to(sidebarRef.current, {
                x: "100%",
                duration: 0.3,
                ease: "power3.in",
                onComplete: () => {
                    setSelectedContent(null);
                    setLoadedContent(null); // Clear loaded content
                }
            });
        }
    };

    const handleAddMovie = async () => {
        if (!selectedContent) return;
        try {
            await addMovieToRoom({
                roomId,
                contentId: selectedContent.id,
                type: selectedContent.type,
            });
            toast.success("Added to room!");
            handleCloseSidebar();
        } catch (error) {
            // Expanded error logging and notification
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to add content: ${errorMessage}`);
            console.error("Add movie/show error:", error);
        }
    };

    const handleRemoveContent = async () => {
        if (!selectedContent) return;
        try {
            await removeSelection({
                roomId,
                contentId: selectedContent.id,
                type: selectedContent.type,
            });
            toast.success("Removed from room.");
            handleCloseSidebar();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to remove content: ${errorMessage}`);
            console.error(error);
        }
    };

    const handleFinishVoting = async () => {
        await finishVoting({ roomId });
    };

    const handleToggleVote = async (movieId: number, type?: "movie" | "tv") => {
        if (amIFinished) return;
        try {
            await toggleVote({ roomId, movieId, type });
        } catch (error) {
            toast.error("Failed to vote");
        }
    };

    if (!roomState || !user) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div></div>;
    }

    // Check if selected content is already in room
    // @ts-ignore
    const isAlreadySelected = loadedContent && roomState.selections.some(s => s.movieId === loadedContent.tmdbId && s.type === selectedContent?.type);

    if (hasMatch) {
        const sortedMatches = [...matches].sort((a: any, b: any) => a.matchedAt - b.matchedAt);

        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 animate-in fade-in duration-700">
                <div className="text-6xl mb-6">🎉</div>
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 mb-8">
                    It's a Match!
                </h1>

                <p className="text-gray-400 mb-8">Here are your group's top picks:</p>

                <div className="grid gap-8 w-full max-w-6xl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {sortedMatches.map((match: any, index: number) => (
                        <div key={match._id} className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/20 relative overflow-hidden">
                            <div className="absolute top-0 left-0 bg-purple-600 text-white px-3 py-1 rounded-br-xl font-bold z-10">
                                #{index + 1}
                            </div>
                            <img
                                src={match.moviePoster.startsWith("http") ? match.moviePoster : `https://image.tmdb.org/t/p/w500${match.moviePoster}`}
                                alt={match.movieTitle}
                                className="w-full aspect-[2/3] object-cover rounded-xl mb-4"
                            />
                            <h3 className="text-xl font-bold text-white mb-2 truncate">{match.movieTitle}</h3>
                        </div>
                    ))}
                </div>

                <div className="flex gap-4 mt-12">
                    <button
                        onClick={onLeave}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-full font-semibold transition-all text-white"
                    >
                        Leave Room
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen">
            {/* Main Content */}
            <div className="p-6 md:p-12 pb-32 max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        {/* @ts-ignore */}
                        <h1 className="text-3xl font-bold text-white mb-2">Movie Night Room: <span className="text-purple-400">{roomState.room.code}</span></h1>
                        <p className="text-gray-400">Share this code with friends to join!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white/10 px-4 py-2 rounded-full flex items-center gap-2">
                            <span className="text-gray-400">Target Genre:</span>
                            {/* @ts-ignore */}
                            <span className="text-white font-medium">{roomState.room.genre || "Any"}</span>
                        </div>
                        <button onClick={onLeave} className="text-red-400 hover:text-red-300 font-medium">Leave</button>
                    </div>
                </div>

                {/* Users & Status */}
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <h3 className="text-lg font-semibold text-gray-300 mb-4">Who's Here</h3>
                    <div className="flex flex-wrap gap-4">
                        {/* @ts-ignore */}
                        {roomState.users.map((u) => (
                            <div key={u._id} className={`flex items-center gap-3 px-4 py-2 rounded-full border ${u.votingFinished ? 'bg-green-500/10 border-green-500/30' : 'bg-white/10 border-white/5'}`}>
                                <div className={`w-2 h-2 rounded-full ${u.votingFinished ? 'bg-green-500' : 'bg-purple-500 animate-pulse'}`}></div>
                                {/* @ts-ignore */}
                                <span className={u.votingFinished ? 'text-green-200' : 'text-gray-300'}>{u.userName} {u.userId === user._id && "(You)"}</span>
                                {u.votingFinished && <span className="text-green-400 text-sm">✓ Ready</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search & Add */}
                <div className="max-w-2xl mx-auto w-full relative z-30 space-y-4">
                    <SearchBox
                        initialQuery={searchQuery}
                        onSearch={(q) => setSearchQuery(q)}
                        className="shadow-2xl"
                        onResultSelect={(type, id) => setSelectedContent({ type, id })}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery("")}
                            className="text-gray-400 hover:text-white text-sm flex items-center gap-2 mx-auto transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Trending & Selections
                        </button>
                    )}
                </div>

                {/* Search Results Display */}
                {searchQuery && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold text-white">Search Results</h2>
                            {isSearching && <div className="text-purple-400 animate-pulse">Searching...</div>}
                        </div>

                        {searchResults?.movies.length === 0 && searchResults?.shows.length === 0 && !isSearching && (
                            <div className="text-gray-400 text-center py-12">No results found for "{searchQuery}"</div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {searchResults?.movies.map((movie: any) => (
                                <MovieCard
                                    key={`movie-${movie._id}`}
                                    item={{ ...movie, media_type: "movie" }}
                                    type="movie"
                                    onClick={() => setSelectedContent({ id: movie._id, type: "movie" })}
                                />
                            ))}
                            {searchResults?.shows.map((show: any) => (
                                <MovieCard
                                    key={`show-${show._id}`}
                                    item={{ ...show, media_type: "tv" }}
                                    type="tv"
                                    onClick={() => setSelectedContent({ id: show._id, type: "tv" })}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {!searchQuery && (
                    <>
                        {/* Voting Section */}
                        {/* @ts-ignore */}
                        {roomState.selections.length > 0 && (
                            <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
                                <div className="flex justify-between items-end">
                                    <h2 className="text-2xl font-bold text-white">Vote on Selections</h2>
                                    {!amIFinished && (
                                        <button
                                            onClick={handleFinishVoting}
                                            className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-full font-bold shadow-lg transform hover:scale-105 transition-all"
                                        >
                                            Finish Voting
                                        </button>
                                    )}
                                    {amIFinished && (
                                        <div className="text-green-400 font-medium animate-pulse">
                                            Waiting for others to finish...
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                                    {/* @ts-ignore */}
                                    {roomState.selections.map((selection: any) => {
                                        // @ts-ignore
                                        const isAgreed = selection.agreedUsers.includes(user._id);
                                        return (
                                            <div
                                                key={selection._id}
                                                className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${isAgreed ? 'ring-4 ring-green-500 shadow-green-500/20 shadow-xl scale-105' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                                onClick={() => handleToggleVote(selection.movieId, selection.type)}
                                            >
                                                <div className="aspect-[2/3]">
                                                    <img
                                                        src={selection.moviePoster.startsWith("http") ? selection.moviePoster : `https://image.tmdb.org/t/p/w500${selection.moviePoster}`}
                                                        alt={selection.movieTitle}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                        <p className="text-white font-bold text-center text-sm md:text-base">{selection.movieTitle}</p>
                                                        <div className="flex justify-center mt-2">
                                                            <div className="flex -space-x-2">
                                                                {selection.agreedUsers.map((uid: string) => (
                                                                    <div key={uid} className="w-6 h-6 rounded-full bg-purple-500 border-2 border-black flex items-center justify-center text-[10px] text-white">
                                                                        {/* We don't have username here easily without iteration, skipping for simpler circles */}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {/* Vote Checkmark Overlay */}
                                                    {isAgreed && (
                                                        <div className="absolute top-2 right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg transform scale-100 transition-transform">
                                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Trending Suggestions */}
                        <div className="space-y-6 pt-8 border-t border-white/10">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Trending Suggestions</h2>
                                {/* Toggle */}
                                <div className="flex bg-white/10 rounded-full p-1">
                                    <button
                                        onClick={() => setTrendingType("movie")}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${trendingType === "movie" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                                    >
                                        Movies
                                    </button>
                                    <button
                                        onClick={() => setTrendingType("tv")}
                                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${trendingType === "tv" ? "bg-purple-600 text-white shadow-lg" : "text-gray-400 hover:text-white"}`}
                                    >
                                        TV Shows
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {/* @ts-ignore */}
                                {trendingList.slice(0, 12).map((item: any) => (
                                    <MovieCard
                                        key={item._id}
                                        item={{ ...item, media_type: trendingType }}
                                        type={trendingType}
                                        onClick={() => setSelectedContent({ id: item._id, type: trendingType })}
                                    />
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Sidebar Overlay */}
            {selectedContent && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
                        onClick={handleCloseSidebar}
                    ></div>

                    {/* Sidebar */}
                    <div
                        ref={sidebarRef}
                        className="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[800px] bg-[#0f0f0f] border-l border-white/10 z-50 overflow-y-auto shadow-2xl"
                    >
                        <div className="p-4 flex justify-end absolute top-0 right-0 z-50">
                            <button onClick={handleCloseSidebar} className="p-2 text-gray-400 hover:text-white rounded-full bg-black/50 hover:bg-black/70 transition-colors backdrop-blur-md">
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="pb-12">
                            <ContentDetails
                                key={selectedContent.id} // Re-mount when content changes
                                contentId={selectedContent.id}
                                contentType={selectedContent.type}
                                setCurrentView={() => { }}
                                onGoHome={() => { }}
                                onSignIn={() => { }}
                                hideDefaultActions={true}
                                onDataLoaded={(data) => setLoadedContent(data)}
                                extraActions={
                                    <button
                                        onClick={isAlreadySelected ? handleRemoveContent : handleAddMovie}
                                        className={`flex-1 px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform transition-all hover:scale-105 active:scale-95 mb-12 w-full md:w-auto ${isAlreadySelected
                                            ? "bg-red-600 hover:bg-red-700 text-white shadow-red-900/20"
                                            : "bg-white text-black hover:bg-gray-100 shadow-white/10"
                                            }`}
                                    >
                                        {isAlreadySelected ? "Remove from Room" : "Add to Room"}
                                    </button>
                                }
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
