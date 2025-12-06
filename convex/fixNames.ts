import { mutation } from "./_generated/server";

export const fixNames = mutation({
    handler: async (ctx) => {
        const users = await ctx.db.query("users").collect();
        let updated = 0;
        for (const user of users) {
            if (!user.name) {
                // Fallback: use part of email or default
                const nameFromEmail = user.email ? user.email.split("@")[0] : "User";
                // Heuristic: if email is "thenewjarvis1", name becomes "The New Jarvis" (auto-capitalized)
                // Or we can just set a placeholder.
                // Actually, let's just use the email prefix but formatted nicer.
                await ctx.db.patch(user._id, { name: nameFromEmail });
                updated++;
            }
        }
        return `Updated ${updated} users with missing names`;
    },
});
