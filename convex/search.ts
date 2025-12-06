import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getSearchHistory = query({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const history = await ctx.db
            .query("search_history")
            .withIndex("by_user_and_timestamp", (q) => q.eq("userId", userId))
            .order("desc")
            .take(10); // Limit to last 10 unique searches

        // Remove duplicates if any (though logic below tries to prevent them)
        // Detailed duplicate removal usually requires more complex logic or just client side filtering
        // For now, we return the raw list, client can filter unique queries if needed
        // or we filter here:
        const uniqueQueries = new Set<string>();
        const result = [];
        for (const item of history) {
            if (!uniqueQueries.has(item.query.toLowerCase())) {
                uniqueQueries.add(item.query.toLowerCase());
                result.push(item);
            }
        }
        return result;
    },
});

export const addSearchHistory = mutation({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return;

        const trimmedQuery = args.query.trim();
        if (!trimmedQuery) return;

        // Check if query exists recently to update timestamp instead of adding duplicate
        const existing = await ctx.db
            .query("search_history")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("query"), trimmedQuery))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, { timestamp: Date.now() });
        } else {
            await ctx.db.insert("search_history", {
                userId,
                query: trimmedQuery,
                timestamp: Date.now(),
            });
        }

        // Optional: cleanup old history if > 20 items
        // (Skipping for now to keep it simple and fast)
    },
});

export const removeSearchHistoryItem = mutation({
    args: { id: v.id("search_history") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return;

        // Ensure user owns the item
        const item = await ctx.db.get(args.id);
        if (item && item.userId === userId) {
            await ctx.db.delete(args.id);
        }
    },
});

export const clearSearchHistory = mutation({
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return;

        const history = await ctx.db
            .query("search_history")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const item of history) {
            await ctx.db.delete(item._id);
        }
    },
});

export const getSuggestions = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        if (!args.query) return { movies: [], shows: [] };

        const movies = await ctx.db
            .query("movies")
            .withSearchIndex("search_movies", (q) => q.search("title", args.query))
            .take(5);

        const shows = await ctx.db
            .query("tvShows")
            .withSearchIndex("search_shows", (q) => q.search("name", args.query))
            .take(5);

        return { movies, shows };
    },
});
