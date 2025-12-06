import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc } from "../../convex/_generated/dataModel";
import gsap from "gsap";

interface SearchBoxProps {
    initialQuery: string;
    onSearch: (query: string) => void;
    className?: string;
    onFocus?: (focused: boolean) => void;
    onResultSelect?: (type: "movie" | "tv", id: string) => void;
}

export function SearchBox({ initialQuery, onSearch, className = "", onFocus, onResultSelect }: SearchBoxProps) {
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [isFocused, setIsFocused] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Manual debounce implementation
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Queries
    const history = useQuery(api.search.getSearchHistory) || [];
    const suggestions = useQuery(api.search.getSuggestions, { query: debouncedQuery });

    // Mutations
    const addHistory = useMutation(api.search.addSearchHistory);
    const removeHistoryItem = useMutation(api.search.removeSearchHistoryItem);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!query.trim()) return;

        // Add to history
        addHistory({ query: query.trim() });

        onSearch(query);
        setIsFocused(false);

        // Unfocus input
        const input = containerRef.current?.querySelector("input");
        input?.blur();
    };

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update parent about focus state (for animations or styling)
    useEffect(() => {
        onFocus?.(isFocused);
    }, [isFocused, onFocus]);

    // Sync with initial query if it changes externally
    useEffect(() => {
        setQuery(initialQuery);
    }, [initialQuery]);

    const hasHistory = history.length > 0;
    const hasSuggestions = (suggestions?.movies?.length ?? 0) > 0 || (suggestions?.shows?.length ?? 0) > 0;
    const showDropdown = isFocused && (hasHistory || (query && hasSuggestions));

    return (
        <div ref={containerRef} className={`relative w-full ${className}`}>
            <form onSubmit={handleSubmit} className="relative z-20">
                <input
                    type="text"
                    placeholder="Search movies & shows..."
                    className="w-full px-4 py-2 pl-10 bg-white/10 border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                {query && (
                    <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        onClick={() => {
                            setQuery("");
                            setIsFocused(true);
                        }}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </form>

            {/* Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-20"
                >
                    {/* History Section */}
                    {!query && hasHistory && (
                        <div className="py-2">
                            <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                Recent Searches
                            </div>
                            {history.map((item: any) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between px-4 py-2 hover:bg-white/5 cursor-pointer group"
                                    onClick={() => {
                                        setQuery(item.query);
                                        addHistory({ query: item.query }); // Update timestamp
                                        onSearch(item.query);
                                        setIsFocused(false);
                                    }}
                                >
                                    <div className="flex items-center text-gray-300 group-hover:text-white">
                                        <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>{item.query}</span>
                                    </div>
                                    <button
                                        className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeHistoryItem({ id: item._id });
                                        }}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestions Section */}
                    {query && (hasSuggestions || hasHistory) && (
                        <div className="py-2">
                            {/* Search query match in history */}
                            {history.filter((h: any) => h.query.toLowerCase().includes(query.toLowerCase())).slice(0, 3).map((item: any) => (
                                <div
                                    key={item._id}
                                    className="flex items-center px-4 py-2 hover:bg-white/5 cursor-pointer text-gray-300 hover:text-white"
                                    onClick={() => {
                                        setQuery(item.query);
                                        addHistory({ query: item.query });
                                        onSearch(item.query);
                                        setIsFocused(false);
                                    }}
                                >
                                    <svg className="w-4 h-4 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {item.query}
                                </div>
                            ))}

                            {(suggestions?.movies?.length ?? 0) > 0 && (
                                <>
                                    <div className="px-4 py-1 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Movies
                                    </div>
                                    {suggestions?.movies?.map((movie: any) => (
                                        <div
                                            key={movie._id}
                                            className="flex items-center px-4 py-2 hover:bg-white/5 cursor-pointer group"
                                            onClick={() => {
                                                if (onResultSelect) {
                                                    onResultSelect("movie", movie._id);
                                                } else {
                                                    setQuery(movie.title);
                                                    addHistory({ query: movie.title });
                                                    onSearch(movie.title);
                                                }
                                                setIsFocused(false);
                                            }}
                                        >
                                            <div className="w-8 h-10 mr-3 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                                                {movie.posterPath && (
                                                    <img src={movie.posterPath.startsWith('http') ? movie.posterPath : `https://image.tmdb.org/t/p/w92${movie.posterPath}`} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{movie.title}</div>
                                                <div className="text-xs text-gray-400">{new Date(movie.releaseDate).getFullYear()} • ⭐ {movie.voteAverage.toFixed(1)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {(suggestions?.shows?.length ?? 0) > 0 && (
                                <>
                                    <div className="px-4 py-1 mt-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        TV Shows
                                    </div>
                                    {suggestions?.shows?.map((show: any) => (
                                        <div
                                            key={show._id}
                                            className="flex items-center px-4 py-2 hover:bg-white/5 cursor-pointer group"
                                            onClick={() => {
                                                if (onResultSelect) {
                                                    onResultSelect("tv", show._id);
                                                } else {
                                                    setQuery(show.name);
                                                    addHistory({ query: show.name });
                                                    onSearch(show.name);
                                                }
                                                setIsFocused(false);
                                            }}
                                        >
                                            <div className="w-8 h-10 mr-3 flex-shrink-0 bg-gray-800 rounded overflow-hidden">
                                                {show.posterPath && (
                                                    <img src={show.posterPath.startsWith('http') ? show.posterPath : `https://image.tmdb.org/t/p/w92${show.posterPath}`} alt="" className="w-full h-full object-cover" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-white truncate">{show.name}</div>
                                                <div className="text-xs text-gray-400">{new Date(show.firstAirDate).getFullYear()} • ⭐ {show.voteAverage.toFixed(1)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
