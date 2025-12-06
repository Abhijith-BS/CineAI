import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
    args: {
        contentType: v.union(v.literal("movie"), v.literal("tv")),
        contentId: v.number(),
    },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_content_and_time", (q) =>
                q
                    .eq("contentType", args.contentType)
                    .eq("contentId", args.contentId)
            )
            .order("desc")
            .collect();

        // We stored userName in the review itself for simplicity,
        // so we don't strictly need to join, but we could to get the *latest* name.
        // Let's stick to the stored name for now as per plan.
        return reviews;
    },
});

export const create = mutation({
    args: {
        contentType: v.union(v.literal("movie"), v.literal("tv")),
        contentId: v.number(),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const user = await ctx.db.get(userId);
        if (!user) throw new Error("User not found");

        // Basic name fallback
        const userName = user.name || user.email?.split("@")[0] || "Anonymous";

        await ctx.db.insert("reviews", {
            userId,
            userName,
            contentType: args.contentType,
            contentId: args.contentId,
            content: args.content,
            timestamp: Date.now(),
        });
    },
});

export const edit = mutation({
    args: {
        reviewId: v.id("reviews"),
        content: v.string(),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");

        if (review.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.reviewId, {
            content: args.content,
            edited: true,
        });
    },
});

export const deleteReview = mutation({
    args: {
        reviewId: v.id("reviews"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");

        if (review.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.delete(args.reviewId);
    },
});
