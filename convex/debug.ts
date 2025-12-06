import { query } from "./_generated/server";

export const getCounts = query({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        return {
            users: users.length,
            userData: users.map((u: any) => ({ email: u.email, name: u.name })),
        };
    },
});
