import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { createAuth } from "./auth";

/**
 * HTTP Router for Convex
 *
 * This file defines HTTP routes that handle authentication requests
 * from Better Auth. The routes are accessed via:
 *
 * POST/GET https://your-deployment.convex.cloud/auth/*
 *
 * Better Auth uses these routes for:
 * - Login (/auth/login)
 * - Signup (/auth/signup)
 * - Logout (/auth/logout)
 * - Session management (/auth/session)
 * - OAuth callbacks (if enabled)
 */

const http = httpRouter();

/**
 * Better Auth POST routes
 *
 * Handles authentication actions like login, signup, logout
 *
 * IMPORTANT: Use httpAction() wrapper for proper TypeScript types:
 * - ctx: ActionCtx with runQuery, runMutation, runAction
 * - request: Web API Request object
 * - return: Promise<Response>
 */
http.route({
  path: "/auth/*",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const auth = createAuth(ctx);
    return await auth.handler(request);
  }),
});

/**
 * Better Auth GET routes
 *
 * Handles session retrieval and OAuth callbacks
 */
http.route({
  path: "/auth/*",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const auth = createAuth(ctx);
    return await auth.handler(request);
  }),
});

export default http;
