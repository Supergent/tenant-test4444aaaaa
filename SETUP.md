# Quick Setup Guide

This guide will get you up and running in 5 minutes.

## Prerequisites

- Node.js >= 18.0.0
- pnpm installed (`npm install -g pnpm`)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Initialize Convex

```bash
# Login to Convex (first time only)
npx convex login

# Start Convex dev server (this creates your deployment)
npx convex dev
```

**Important:** Keep this terminal open! It will show you your `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`.

## Step 3: Configure Environment

1. Copy the example environment file:

```bash
cp .env.local.example .env.local
```

2. Edit `.env.local` and add:

```bash
# From the `npx convex dev` output:
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Generate a secret:
# Run: openssl rand -base64 32
BETTER_AUTH_SECRET=<paste-your-generated-secret-here>

# These can stay as-is for local development:
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Step 4: Start the App

In a **new terminal** (keep Convex running):

```bash
cd apps/web
pnpm dev
```

## Step 5: Open in Browser

Open http://localhost:3000

You'll see the authentication screen. Sign up with any email/password to get started!

## ✅ That's it!

You now have a fully functional task management app with:
- Real-time updates
- User authentication
- Rate limiting
- AI agent support (optional - add API keys later)

## Next Steps

- **Add tasks**: Click "New Task" to create your first task
- **Manage tasks**: Click the circle icon to change status
- **View analytics**: See your task statistics at the top
- **Enable AI** (optional): Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env.local`

## Troubleshooting

### "Not authenticated" errors

Make sure:
1. You've signed up/logged in
2. Your `.env.local` has the correct `BETTER_AUTH_SECRET`
3. Both Convex dev and Next.js dev servers are running

### Can't connect to Convex

Make sure:
1. `npx convex dev` is running in another terminal
2. Your `.env.local` has the correct `NEXT_PUBLIC_CONVEX_URL`

### Need help?

Check the full [README.md](./README.md) for detailed documentation.
