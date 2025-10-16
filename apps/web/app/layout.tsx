import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { convex } from "@/lib/convex";
import { authClient } from "@/lib/auth-client";

export const metadata: Metadata = {
  title: "Distraction-Free To-Do",
  description: "A clean, focused task management app built with Convex and Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders convexClient={convex} authClient={authClient}>
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
