
import { query } from "./_generated/server";
import { v } from "convex/values";

export const inspectBaahubali = query({
    args: {},
    handler: async (ctx) => {
        const movies = await ctx.db
            .query("movies")
            .withSearchIndex("search_movies", (q) => q.search("title", "Baahubali"))
            .collect();

        const res = movies.map(m => ({
            _id: m._id,
            title: m.title,
            tmdbId: m.tmdbId,
            originalLanguage: m.originalLanguage
        }));
        console.log(JSON.stringify(res, null, 2));
        return res;
    },
});

export const inspectBaahubali2 = query({
    args: {},
    handler: async (ctx) => {
        const movies = await ctx.db
            .query("movies")
            .withSearchIndex("search_movies", (q) => q.search("title", "Baahubali"))
            .collect();

        const res = movies.map(m => ({
            _id: m._id,
            title: m.title,
            tmdbId: m.tmdbId,
            originalLanguage: m.originalLanguage
        }));
        console.log(JSON.stringify(res, null, 2));
        return res;
    },
});
