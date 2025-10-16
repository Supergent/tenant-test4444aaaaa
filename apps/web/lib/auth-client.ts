/**
 * Better Auth Client Configuration
 *
 * Client-side authentication utilities for the browser.
 * Use this for login, signup, logout, and session management.
 */

import { createAuthClient } from "better-auth/react";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

/**
 * Better Auth client instance
 *
 * Usage:
 *   const { signIn, signUp, signOut, useSession } = authClient;
 */
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  plugins: [
    convexClient(),
    // Add organization plugin if multi-tenant:
    // organizationClient()
  ],
});

/**
 * Export commonly used hooks
 */
export const { useSession, signIn, signUp, signOut } = authClient;
