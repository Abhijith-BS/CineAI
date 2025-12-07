/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as chat from "../chat.js";
import type * as cleanup from "../cleanup.js";
import type * as cleanupTitles from "../cleanupTitles.js";
import type * as debug from "../debug.js";
import type * as debug_inspect from "../debug_inspect.js";
import type * as externalApi from "../externalApi.js";
import type * as fixAuth from "../fixAuth.js";
import type * as fixNames from "../fixNames.js";
import type * as groq from "../groq.js";
import type * as http from "../http.js";
import type * as inspect from "../inspect.js";
import type * as movies from "../movies.js";
import type * as reviews from "../reviews.js";
import type * as rooms from "../rooms.js";
import type * as router from "../router.js";
import type * as search from "../search.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  chat: typeof chat;
  cleanup: typeof cleanup;
  cleanupTitles: typeof cleanupTitles;
  debug: typeof debug;
  debug_inspect: typeof debug_inspect;
  externalApi: typeof externalApi;
  fixAuth: typeof fixAuth;
  fixNames: typeof fixNames;
  groq: typeof groq;
  http: typeof http;
  inspect: typeof inspect;
  movies: typeof movies;
  reviews: typeof reviews;
  rooms: typeof rooms;
  router: typeof router;
  search: typeof search;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
