
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const aggressiveDedupe = mutation({
    args: {},
    handler: async (ctx) => {
        const movies = await ctx.db.query("movies").collect();

        let deleted = 0;
        const seen = new Map();

        for (const m of movies) {
            // Aggressive normalization: lowercase, remove non-alphanumeric
            const key = m.title.toLowerCase().replace(/[^a-z0-9]/g, "");

            if (seen.has(key)) {
                console.log(`Duplicate found: ${m.title} (${m._id}) matches ${seen.get(key)}`);
                await ctx.db.delete(m._id);
                deleted++;
            } else {
                seen.set(key, m.title);
            }
        }

        return { deleted, totalScanned: movies.length };
    },
});
