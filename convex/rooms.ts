import { v } from "convex/values";
import { mutation, query, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to generate a random 4-letter room code
// Trigger update - retry deployment
function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper to get or create user
async function getOrCreateUser(ctx: MutationCtx, requireEmail: boolean = false) {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
        throw new Error("Not authenticated");
    }

    const dbUser = await ctx.db.get(userId);

    if (!dbUser) {
        // This shouldn't happen if getAuthUserId returns an ID, but just in case
        throw new Error("User not found in database");
    }

    console.log("getOrCreateUser FOUND USER:", dbUser); // Debug log

    // Feature 2: Block anonymous users if required
    // We assume presence of 'email' indicates a registered account.
    if (requireEmail && !dbUser.email) {
        throw new Error("Anonymous users cannot use Movie Night. Please sign in with an account.");
    }

    return dbUser;
}

export const createRoom = mutation({
    args: {
        genre: v.optional(v.string()),
        provider: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // Feature 2: Enforce strictly signed-in users
        const dbUser = await getOrCreateUser(ctx, true);

        const code = generateRoomCode();

        // Create room
        const roomId = await ctx.db.insert("rooms", {
            code,
            hostId: dbUser._id,
            status: "voting",
            genre: args.genre,
            provider: args.provider,
            createdAt: Date.now(),
        });

        // Add host as first user
        await ctx.db.insert("roomUsers", {
            roomId,
            userId: dbUser._id,
            userName: dbUser.name || "Host",
            joinedAt: Date.now(),
        });

        return { roomId, code };
    },
});

export const joinRoom = mutation({
    args: {
        code: v.string(),
    },
    handler: async (ctx, args) => {
        // Feature 2: Enforce strictly signed-in users
        const dbUser = await getOrCreateUser(ctx, true);

        const room = await ctx.db
            .query("rooms")
            .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
            .first();

        if (!room) throw new Error("Room not found");
        if (room.status !== "voting") throw new Error("Room is closed or already matched");

        // Check if already joined
        const existingMember = await ctx.db
            .query("roomUsers")
            .withIndex("by_user_room", (q) => q.eq("userId", dbUser._id).eq("roomId", room._id))
            .first();

        if (!existingMember) {
            await ctx.db.insert("roomUsers", {
                roomId: room._id,
                userId: dbUser._id,
                userName: dbUser.name || "Anonymous",
                joinedAt: Date.now(),
            });
        }

        return { roomId: room._id };
    },
});

export const leaveRoom = mutation({
    args: {
        roomId: v.id("rooms"),
    },
    handler: async (ctx, args) => {
        const user = await ctx.auth.getUserIdentity();
        if (!user) return; // Can't identify user to remove

        // We can try to find the user in DB, but if they are signing out, they might be authenticated now.
        // Try to find by email if available.
        let userId = null;
        if (user.email) {
            const dbUser = await ctx.db
                .query("users")
                .filter((q) => q.eq(q.field("email"), user.email))
                .first();
            if (dbUser) userId = dbUser._id;
        }

        if (!userId) {
            // Try to handle anonymous/other cases if needed in future
            return;
        }

        // Remove from roomUsers
        const roomUser = await ctx.db
            .query("roomUsers")
            .withIndex("by_user_room", (q) => q.eq("userId", userId!).eq("roomId", args.roomId))
            .first();

        if (roomUser) {
            await ctx.db.delete(roomUser._id);
        }

        // Check if room is empty
        const remainingUsers = await ctx.db
            .query("roomUsers")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        if (remainingUsers.length === 0) {
            // Close room or delete?
            // Let's set status to ended
            await ctx.db.patch(args.roomId, { status: "ended" });
        }
    }
});

export const getRoomState = query({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        const room = await ctx.db.get(args.roomId);
        if (!room) return null;

        const users = await ctx.db
            .query("roomUsers")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        const matches = await ctx.db
            .query("matches")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        const selections = await ctx.db
            .query("roomSelections")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        return {
            room,
            users,
            matches,
            selections,
        };
    },
});

export const addContentToRoom = mutation({
    args: {
        roomId: v.id("rooms"),
        contentId: v.string(), // Convex ID
        type: v.union(v.literal("movie"), v.literal("tv")),
    },
    handler: async (ctx, args) => {
        const dbUser = await getOrCreateUser(ctx, true);

        let tmdbId: number;
        let title: string;
        let poster: string;

        if (args.type === "movie") {
            const movie = await ctx.db.get(args.contentId as Id<"movies">);
            if (!movie) throw new Error("Movie not found");
            tmdbId = movie.tmdbId;
            title = movie.title;
            poster = movie.posterPath || "";
        } else {
            const show = await ctx.db.get(args.contentId as Id<"tvShows">);
            if (!show) throw new Error("TV Show not found");
            tmdbId = show.tmdbId;
            title = show.name;
            poster = show.posterPath || "";
        }

        // Check if content already added
        // We iterate or check both options if type not indexed efficiently, 
        // but adding 'type' to valid selections prevents duplicated IDs if collision exists.
        const existing = await ctx.db
            .query("roomSelections")
            .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("movieId", tmdbId))
            .filter(q => q.eq(q.field("type"), args.type))
            .first();

        if (existing) {
            return;
        }

        await ctx.db.insert("roomSelections", {
            roomId: args.roomId,
            movieId: tmdbId,
            type: args.type,
            movieTitle: title,
            moviePoster: poster,
            addedBy: dbUser._id,
            addedAt: Date.now(),
            agreedUsers: [dbUser._id],
        });
    },
});

export const toggleSelectionVote = mutation({
    args: {
        roomId: v.id("rooms"),
        movieId: v.number(),
        type: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    },
    handler: async (ctx, args) => {
        const dbUser = await getOrCreateUser(ctx, true);

        let query = ctx.db
            .query("roomSelections")
            .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("movieId", args.movieId));

        if (args.type) {
            query = query.filter(q => q.eq(q.field("type"), args.type));
        }

        const selection = await query.first();

        if (!selection) throw new Error("Selection not found");

        const userId = dbUser._id;
        const hasVoted = selection.agreedUsers.includes(userId);

        let newAgreedUsers = [...selection.agreedUsers];
        if (hasVoted) {
            newAgreedUsers = newAgreedUsers.filter(id => id !== userId);
        } else {
            newAgreedUsers.push(userId);
        }

        await ctx.db.patch(selection._id, { agreedUsers: newAgreedUsers });
    },
});

export const removeSelection = mutation({
    args: {
        roomId: v.id("rooms"),
        contentId: v.string(), // Convex ID
        type: v.union(v.literal("movie"), v.literal("tv")),
    },
    handler: async (ctx, args) => {
        await getOrCreateUser(ctx, true);

        let tmdbId: number;
        if (args.type === "movie") {
            const movie = await ctx.db.get(args.contentId as Id<"movies">);
            if (!movie) throw new Error("Movie not found");
            tmdbId = movie.tmdbId;
        } else {
            const show = await ctx.db.get(args.contentId as Id<"tvShows">);
            if (!show) throw new Error("TV Show not found");
            tmdbId = show.tmdbId;
        }

        const selection = await ctx.db
            .query("roomSelections")
            .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("movieId", tmdbId))
            .filter(q => q.eq(q.field("type"), args.type))
            .first();

        if (selection) {
            await ctx.db.delete(selection._id);
        }
    },
});

export const finishVoting = mutation({
    args: { roomId: v.id("rooms") },
    handler: async (ctx, args) => {
        const dbUser = await getOrCreateUser(ctx, true);

        // 1. Mark user as finished
        const roomUser = await ctx.db
            .query("roomUsers")
            .withIndex("by_user_room", (q) => q.eq("userId", dbUser._id).eq("roomId", args.roomId))
            .first();

        if (roomUser) {
            await ctx.db.patch(roomUser._id, { votingFinished: true });
        }

        // 2. Check if ALL users finished
        const allUsers = await ctx.db
            .query("roomUsers")
            .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
            .collect();

        const allFinished = allUsers.every(u => u.votingFinished === true);

        if (allFinished) {
            // 3. Close voting and calculate matches
            await ctx.db.patch(args.roomId, { status: "matched" });

            // Get all selections
            const selections = await ctx.db
                .query("roomSelections")
                .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
                .collect();

            // Sort by votes (descending)
            const ranked = selections.sort((a, b) => b.agreedUsers.length - a.agreedUsers.length);

            // Insert top matches (e.g. top 5 or all that have votes)
            // User requested "all highly voted movies". Let's insert all with at least 1 vote.
            // Or just ALL of them, sorted? Matches usually implies "winners".
            // Let's keep all with > 0 votes.
            const winners = ranked.filter(s => s.agreedUsers.length > 0);

            for (const s of winners) {
                await ctx.db.insert("matches", {
                    roomId: args.roomId,
                    movieId: s.movieId,
                    type: s.type,
                    movieTitle: s.movieTitle,
                    moviePoster: s.moviePoster,
                    matchedAt: Date.now(),
                });
            }
        }
    }
});

export const vote = mutation({
    args: {
        roomId: v.id("rooms"),
        movieId: v.number(),
        type: v.union(v.literal("movie"), v.literal("tv")),
        movieTitle: v.string(),
        moviePoster: v.string(),
        vote: v.union(v.literal("like"), v.literal("dislike")),
    },
    handler: async (ctx, args) => {
        const dbUser = await getOrCreateUser(ctx, true);

        // Record vote
        const existingVote = await ctx.db
            .query("roomVotes")
            .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", dbUser._id))
            .filter(q => q.eq(q.field("movieId"), args.movieId))
            .first();

        if (!existingVote) {
            await ctx.db.insert("roomVotes", {
                roomId: args.roomId,
                userId: dbUser._id,
                movieId: args.movieId,
                type: args.type,
                movieTitle: args.movieTitle,
                moviePoster: args.moviePoster,
                vote: args.vote,
            });
        }


        if (args.vote === "like") {
            // Check for match
            // 1. Get all users in room
            const roomUsers = await ctx.db
                .query("roomUsers")
                .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
                .collect();

            // 2. Count likes for this movie in this room
            const likes = await ctx.db
                .query("roomVotes")
                .withIndex("by_room_movie", (q) => q.eq("roomId", args.roomId).eq("movieId", args.movieId))
                .filter(q => q.eq(q.field("movieId"), args.movieId)) // Assuming we can trust movieId
                .filter(q => q.eq(q.field("vote"), "like"))
                .collect();

            // 3. If likes match room user count, it's a match!
            // Ensure there's more than 1 user for a match (or allow solo if testing?)
            // Requirement says "mutual matching", implies multiple.
            // But if user is solo testing, maybe 1 is fine.
            // Let's stick to likes.length >= roomUsers.length
            if (likes.length >= roomUsers.length && roomUsers.length > 1) {
                // Check if match already recorded
                const existingMatch = await ctx.db
                    .query("matches")
                    .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
                    .filter(q => q.eq(q.field("movieId"), args.movieId))
                    .first();

                if (!existingMatch) {
                    await ctx.db.insert("matches", {
                        roomId: args.roomId,
                        movieId: args.movieId,
                        type: args.type,
                        movieTitle: args.movieTitle,
                        moviePoster: args.moviePoster,
                        matchedAt: Date.now(),
                    });

                    // Update room status? Optional, maybe keep voting until everyone leaves?
                    // Usually match ends the session or shows the match.
                    // The Frontend listens to matches and shows them.
                }
            }
        }
    },
});
