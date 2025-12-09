import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  movies: defineTable({
    tmdbId: v.number(),
    title: v.string(),
    overview: v.string(),
    releaseDate: v.string(),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    voteAverage: v.number(),
    voteCount: v.number(),
    genres: v.array(v.string()),
    runtime: v.optional(v.number()),
    budget: v.optional(v.number()),
    revenue: v.optional(v.number()),
    tagline: v.optional(v.string()),
    status: v.optional(v.string()),
    originalLanguage: v.string(),
    popularity: v.number(),
    adult: v.boolean(),
    video: v.boolean(),
    languages: v.optional(v.array(v.string())), // Available languages
  })
    .index("by_tmdb_id", ["tmdbId"])
    .index("by_popularity", ["popularity"])
    .index("by_vote_average", ["voteAverage"])
    .searchIndex("search_movies", {
      searchField: "title",
      filterFields: ["genres", "releaseDate"],
    }),

  tvShows: defineTable({
    tmdbId: v.number(),
    name: v.string(),
    overview: v.string(),
    firstAirDate: v.string(),
    lastAirDate: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    voteAverage: v.number(),
    voteCount: v.number(),
    genres: v.array(v.string()),
    numberOfEpisodes: v.optional(v.number()),
    numberOfSeasons: v.optional(v.number()),
    status: v.optional(v.string()),
    originalLanguage: v.string(),
    popularity: v.number(),
    adult: v.boolean(),
    inProduction: v.boolean(),
    languages: v.optional(v.array(v.string())), // Available languages
  })
    .index("by_tmdb_id", ["tmdbId"])
    .index("by_popularity", ["popularity"])
    .index("by_vote_average", ["voteAverage"])
    .searchIndex("search_shows", {
      searchField: "name",
      filterFields: ["genres", "firstAirDate"],
    }),

  chatMessages: defineTable({
    userId: v.id("users"),
    message: v.string(),
    response: v.string(),
    movieResults: v.optional(v.array(v.id("movies"))),
    showResults: v.optional(v.array(v.id("tvShows"))),
    timestamp: v.number(),
  }).index("by_user", ["userId"]),

  favorites: defineTable({
    userId: v.id("users"),
    itemType: v.union(v.literal("movie"), v.literal("tv")),
    itemId: v.union(v.id("movies"), v.id("tvShows")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "itemType"]),

  watchlist: defineTable({
    userId: v.id("users"),
    itemType: v.union(v.literal("movie"), v.literal("tv")),
    itemId: v.union(v.id("movies"), v.id("tvShows")),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_type", ["userId", "itemType"]),

  search_history: defineTable({
    userId: v.id("users"),
    query: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_timestamp", ["userId", "timestamp"]),

  reviews: defineTable({
    userId: v.id("users"),
    userName: v.string(), // Store snapshot of name for simplicity
    contentType: v.union(v.literal("movie"), v.literal("tv")),
    contentId: v.number(), // TMDB ID
    content: v.string(),
    timestamp: v.number(),
    edited: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_content", ["contentType", "contentId"])
    .index("by_content_and_time", ["contentType", "contentId", "timestamp"]),

  rooms: defineTable({
    code: v.string(), // e.g., "ABCD"
    hostId: v.id("users"),
    status: v.union(v.literal("voting"), v.literal("matched"), v.literal("ended")),
    genre: v.optional(v.string()), // Filter by genre
    provider: v.optional(v.string()), // Filter by provider
    createdAt: v.number(),
  }).index("by_code", ["code"]),

  roomUsers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    userName: v.string(),
    joinedAt: v.number(),
    votingFinished: v.optional(v.boolean()),
  }).index("by_room", ["roomId"]).index("by_user_room", ["userId", "roomId"]),

  roomVotes: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    movieId: v.number(), // TMDB ID (Content ID)
    type: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    movieTitle: v.string(),
    moviePoster: v.string(),
    vote: v.union(v.literal("like"), v.literal("dislike")),
  }).index("by_room_movie", ["roomId", "movieId"]).index("by_room_user", ["roomId", "userId"]),

  matches: defineTable({
    roomId: v.id("rooms"),
    movieId: v.number(),
    type: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    movieTitle: v.string(),
    moviePoster: v.string(),
    matchedAt: v.number(),
  }).index("by_room", ["roomId"]),

  roomSelections: defineTable({
    roomId: v.id("rooms"),
    movieId: v.number(),
    type: v.optional(v.union(v.literal("movie"), v.literal("tv"))),
    movieTitle: v.string(),
    moviePoster: v.string(),
    addedBy: v.id("users"),
    addedAt: v.number(),
    agreedUsers: v.array(v.id("users")),
  }).index("by_room", ["roomId"]).index("by_room_movie", ["roomId", "movieId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
