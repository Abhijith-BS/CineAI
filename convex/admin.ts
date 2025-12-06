import { mutation } from "./_generated/server";

// Development tool to wipe all users
export const wipeAllUsers = mutation({
    handler: async (ctx) => {
        const tables = [
            "users",
            "auth_sessions",
            "auth_accounts",
            "favorites",
            "watchlist",
            "search_history",
            "reviews",
            "chatMessages"
        ];

        for (const table of tables) {
            try {
                const docs = await ctx.db.query(table as any).collect();
                for (const doc of docs) {
                    await ctx.db.delete(doc._id);
                }
                console.log(`Cleared table: ${table}`);
            } catch (e) {
                console.log(`Could not clear table ${table} (might not exist or be accessible):`, e);
            }
        }
    },
});
