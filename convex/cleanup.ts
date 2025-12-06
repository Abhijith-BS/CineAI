import { internalMutation } from "./_generated/server";

export const deduplicateMovies = internalMutation({
    args: {},
    handler: async (ctx) => {
        const movies = await ctx.db.query("movies").collect();
        const deletedIds: any[] = [];
        const keptIds: any[] = [];

        // Manual bucketing for known issues with Baahubali
        const beginning: any[] = [];
        const conclusion: any[] = [];
        const others: any[] = [];

        for (const m of movies) {
            const t = m.title.toLowerCase();
            if (t.includes("baahubali")) {
                if (t.includes("beginning") || (t.includes("part") && t.includes("1"))) {
                    beginning.push(m);
                } else if (t.includes("conclusion") || (t.includes("part") && t.includes("2"))) {
                    conclusion.push(m);
                } else {
                    others.push(m);
                }
            }
        }

        const bucketCleanup = async (bucket: any[], name: string) => {
            if (bucket.length > 1) {
                // Sort by voteCount descending, then by whether it has a poster
                bucket.sort((a, b) => {
                    const scoreA = (a.voteCount || 0) + (a.posterPath ? 1000 : 0);
                    const scoreB = (b.voteCount || 0) + (b.posterPath ? 1000 : 0);
                    return scoreB - scoreA;
                });

                const toKeep = bucket[0];
                console.log(`[${name}] Keeping ${toKeep.title} (${toKeep.tmdbId}) - Votes: ${toKeep.voteCount}`);
                keptIds.push(toKeep._id);

                for (const m of bucket.slice(1)) {
                    console.log(`[${name}] Deleting ${m.title} (${m.tmdbId}) - Votes: ${m.voteCount}`);
                    await ctx.db.delete(m._id);
                    deletedIds.push(m._id);
                }
            } else if (bucket.length === 1) {
                console.log(`[${name}] Only one found: ${bucket[0].title}`);
                keptIds.push(bucket[0]._id);
            }
        };

        await bucketCleanup(beginning, "Beginning");
        await bucketCleanup(conclusion, "Conclusion");

        // For 'others', check for obvious junk
        for (const m of others) {
            if (m.title.toLowerCase().includes("panel") || m.voteCount === 0) {
                console.log(`[Others] Deleting likely junk: ${m.title}`);
                await ctx.db.delete(m._id);
                deletedIds.push(m._id);
            } else {
                console.log(`[Others] Keeping potential valid movie: ${m.title}`);
            }
        }

        return {
            deletedCount: deletedIds.length,
            deletedIds,
        };
    },
});
