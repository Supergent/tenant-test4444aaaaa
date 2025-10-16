import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth";
import { components } from "./_generated/api";
import { type DataModel } from "./_generated/dataModel";

/**
 * Better Auth Client for Convex
 *
 * This client provides utilities for authentication in Convex functions.
 * Use authComponent.getAuthUser(ctx) to get the current authenticated user.
 *
 * IMPORTANT: The return value from getAuthUser() includes:
 * - _id: The Convex document ID (type: Id<"user">) - USE THIS for database relations
 * - userId?: Optional Better Auth user ID string
 * - email, name, etc.: Other Better Auth fields
 */
export const authComponent = createClient<DataModel>(components.betterAuth);

/**
 * Create Better Auth instance with Convex adapter
 *
 * This configuration:
 * - Uses Convex as the database via the Better Auth adapter
 * - Enables email/password authentication (no verification required for dev)
 * - Generates JWTs valid for 30 days
 * - Uses the convex() plugin for seamless integration
 *
 * @param ctx - Convex context (GenericCtx)
 * @param options - Configuration options
 * @returns Better Auth instance
 */
export const createAuth = (
  ctx: GenericCtx<DataModel>,
  { optionsOnly } = { optionsOnly: false }
) => {
  return betterAuth({
    // Base URL for auth redirects and callbacks
    baseURL: process.env.SITE_URL!,

    // Use Convex as the database
    database: authComponent.adapter(ctx),

    // Email & Password authentication
    emailAndPassword: {
      enabled: true,
      // Disable email verification for development
      // Enable in production: requireEmailVerification: true
      requireEmailVerification: false,
    },

    // Plugins
    plugins: [
      // Convex plugin - generates JWTs for authenticated requests
      convex({
        jwtExpirationSeconds: 30 * 24 * 60 * 60, // 30 days
      }),

      // Add organization() plugin here if you need multi-tenant support:
      // organization({
      //   allowUserToCreateOrganization: true,
      //   organizationLimit: 1,
      //   membershipLimit: 100,
      // }),
    ],
  });
};
