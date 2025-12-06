import { mutation } from "./_generated/server";

export const wipeAuth = mutation({
    handler: async (ctx) => {
        const tables = [
            "users",
            "authSessions",
            "authAccounts",
            "authRefreshTokens",
            "authVerificationCodes",
            "authVerifiers",
            "authRateLimits"
        ];
        const results: Record<string, string> = {};

        for (const table of tables) {
            try {
                const docs = await ctx.db.query(table as any).collect();
                let deleted = 0;
                for (const doc of docs) {
                    await ctx.db.delete(doc._id);
                    deleted++;
                }
                results[table] = `Deleted ${deleted}`;
            } catch (e: any) {
                results[table] = `Error: ${e.message}`;
            }
        }
        return results;
    },
});
