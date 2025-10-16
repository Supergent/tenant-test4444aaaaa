# Distraction-Free To-Do List

A clean, distraction-free to-do list application focused on essential task management with real-time synchronization, user authentication, and a mobile-friendly interface.

## ✨ Features

- **Distraction-free UI** - Clean, minimal interface using shadcn/ui components
- **Real-time sync** - Instant updates across all devices via Convex
- **User authentication** - Secure login with Better Auth
- **AI Assistant** - Optional AI-powered task management help
- **Mobile-friendly** - Responsive design that works on all devices
- **Task management** - Create, organize, prioritize, and complete tasks
- **Activity tracking** - Audit log of all task changes
- **Customizable** - User preferences for theme, sorting, and view options

## 🏗️ Architecture

This project follows the **four-layer Convex architecture pattern**:

```
┌─────────────────────────────────────┐
│         Frontend (Next.js)          │
│  React Components + shadcn/ui       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Endpoint Layer (convex/endpoints/)     │
│  Business logic, auth, validation   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│      Database Layer (convex/db/)    │
│  Pure CRUD operations               │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│         Database (Convex)           │
│  Real-time data storage             │
└─────────────────────────────────────┘
```

### Key Principles

- **Database layer** (`convex/db/`) - ONLY place where `ctx.db` is used
- **Endpoint layer** (`convex/endpoints/`) - Business logic that composes db operations
- **Helper layer** (`convex/helpers/`) - Pure utility functions (no database access)
- **User-scoped** - All operations scoped to authenticated user

## 🧩 Convex Components

This project uses the following Convex Components:

### Core Components (Always Installed)

- **Better Auth** (`@convex-dev/better-auth`) - Authentication and session management
- **Rate Limiter** (`@convex-dev/rate-limiter`) - API rate limiting to prevent abuse

### Feature Components

- **Agent** (`@convex-dev/agent`) - AI agent orchestration for task assistance
- **Text Streaming** (`@convex-dev/persistent-text-streaming`) - Real-time streaming for AI responses

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0 (install with `npm install -g pnpm`)
- **Convex account** - Sign up at [convex.dev](https://convex.dev)

## 🚀 Installation

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Set Up Convex

```bash
# Login to Convex (first time only)
npx convex login

# Initialize Convex project
npx convex dev
```

This will:
- Create a new Convex deployment
- Generate your `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL`
- Start the Convex development server

### 3. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.local.example .env.local

# Edit .env.local and add your values
```

**Required variables:**

```bash
# From `npx convex dev` output
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-random-secret-here

# Your app URL
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Optional variables (for AI features):**

```bash
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# OR use Anthropic: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-...
```

### 4. Start Development Servers

```bash
# Start both Convex and Next.js
pnpm dev

# Or start individually:
pnpm convex:dev  # Convex backend only
pnpm web:dev     # Next.js frontend only
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Convex Dashboard**: https://dashboard.convex.dev

## 📁 Project Structure

```
distraction-free-todo/
├── convex/                    # Convex backend
│   ├── schema.ts             # Database schema
│   ├── convex.config.ts      # Component configuration
│   ├── auth.ts               # Better Auth setup
│   ├── http.ts               # HTTP routes
│   ├── db/                   # Database layer (Phase 2)
│   ├── endpoints/            # Business logic (Phase 2)
│   └── helpers/              # Utility functions (Phase 2)
├── apps/
│   └── web/                  # Next.js application (Phase 2)
├── packages/                 # Shared packages (optional)
├── .env.local.example        # Environment variables template
├── pnpm-workspace.yaml       # pnpm monorepo config
└── package.json              # Dependencies and scripts
```

## 🔧 Component-Specific Setup

### Better Auth

Better Auth is pre-configured with email/password authentication. To enable additional providers:

1. Edit `convex/auth.ts`
2. Add provider configuration (Google, GitHub, etc.)
3. Add provider secrets to `.env.local`

See [Better Auth docs](https://www.better-auth.com/docs) for details.

### AI Agent (Optional)

To enable AI assistant features:

1. Add `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` to `.env.local`
2. The agent will be available in the app for task suggestions and assistance

### Rate Limiter

Rate limiting is configured in `convex/rateLimiter.ts` with sensible defaults:
- 10 requests/minute for create operations
- 50 requests/minute for update operations
- 30 requests/minute for delete operations

## 📝 Available Scripts

```bash
pnpm dev          # Start both Convex and Next.js
pnpm web:dev      # Start Next.js only
pnpm convex:dev   # Start Convex only
pnpm build        # Build for production
pnpm setup        # Install deps and init Convex
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
```

## 🎨 Design System

This project uses a custom theme based on:
- **UI Library**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS
- **Typography**: Inter (body), Plus Jakarta Sans (headings)
- **Color Palette**: Indigo primary, Sky secondary, Orange accent
- **Density**: Balanced spacing for comfortable reading

## 🔐 Authentication Flow

1. User signs up or logs in via Better Auth
2. Better Auth creates a session and JWT
3. Convex validates JWT on every request
4. All database operations are scoped to authenticated user

## 📊 Database Schema

### Core Tables

- **tasks** - To-do items with status, priority, due dates
- **taskComments** - Comments/notes on tasks
- **taskActivity** - Audit log of task changes
- **userPreferences** - User settings (theme, sorting, etc.)

### AI Agent Tables (if enabled)

- **threads** - Conversation threads with AI assistant
- **messages** - Individual messages in threads

All tables are user-scoped and include proper indexes for performance.

## 🚢 Development Status

1. ✅ **Phase 1 Complete** - Infrastructure is set up
2. ✅ **Phase 2 Complete** - Implementation code generated:
   - ✅ Database layer (`convex/db/`)
   - ✅ Endpoint layer (`convex/endpoints/`)
   - ✅ Next.js application (`apps/web/`)
   - ✅ Authentication flow with Better Auth
   - ✅ Rate limiting configured
   - ✅ Task management UI with real-time updates
3. 🎨 **Next: Customize** - Customize UI, add features, deploy to production

## 📚 Resources

- [Convex Documentation](https://docs.convex.dev)
- [Better Auth Documentation](https://www.better-auth.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

---

Built with ❤️ using Convex, Next.js, and Better Auth
