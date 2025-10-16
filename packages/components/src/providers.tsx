"use client";

import * as React from "react";
import { ConvexProviderWithAuth } from "@convex-dev/better-auth/react";
import { ToastProvider } from "./toast";

/**
 * App Providers
 *
 * Wraps the app with necessary providers:
 * - ConvexProviderWithAuth: Convex + Better Auth integration
 * - ThemeProvider: Theme management (placeholder for future use)
 * - ToastProvider: Toast notifications
 *
 * Usage in Next.js layout.tsx:
 *   import { AppProviders } from "@your-workspace/components";
 *   <AppProviders convexClient={convex} authClient={authClient}>{children}</AppProviders>
 */

interface AppProvidersProps {
  children: React.ReactNode;
  convexClient: any; // ConvexReactClient
  authClient: any; // Better Auth client
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  // TODO: Implement theme switching (light/dark/system)
  return <>{children}</>;
};

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  convexClient,
  authClient,
}) => {
  return (
    <ConvexProviderWithAuth client={convexClient} authClient={authClient}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </ConvexProviderWithAuth>
  );
};
