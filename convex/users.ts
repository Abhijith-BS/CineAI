import { v } from "convex/values";
import { query } from "./_generated/server";

export const checkUserExists = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        // Check if a user with this email exists
        // Note: The specific field name for email in authTables might depend on configuration,
        // but usually it is "email".
        const user = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("email"), args.email))
            .first();

        return !!user;
    },
});
