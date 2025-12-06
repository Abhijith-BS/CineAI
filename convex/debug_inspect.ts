import { internalMutation } from "./_generated/server";

export const inspectBaahubali = internalMutation({
    args: {},
    handler: async (ctx) => {
        const movies = await ctx.db
            .query("movies")
            .withSearchIndex("search_movies", (q) => q.search("title", "Baahubali"))
            .take(10);

        return movies.map(m => ({
            id: m._id,
            tmdbId: m.tmdbId,
            title: m.title,
            releaseDate: m.releaseDate,
            voteAverage: m.voteAverage,
            posterPath: m.posterPath,
            languages: m.languages
        }));
    },
});
