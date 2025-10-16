# Application Architecture

## Four-Layer Convex Architecture

This application follows the **Convex four-layer architecture pattern** strictly. Each layer has a specific responsibility and never violates its boundaries.

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER (Next.js)                     │
│                                                                 │
│  Components:                                                    │
│  • TaskDashboard   - Main UI with real-time stats              │
│  • TaskList        - Real-time task display                    │
│  • AuthScreen      - Sign in/sign up                           │
│  • CreateTaskDialog - Task creation modal                      │
│                                                                 │
│  Client Libraries:                                              │
│  • useQuery()      - Real-time data fetching                   │
│  • useMutation()   - Server mutations                          │
│  • useSession()    - Auth state                                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ API Calls
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              ENDPOINT LAYER (convex/endpoints/)                 │
│                                                                 │
│  Business Logic & Authentication:                               │
│  • tasks.ts        - Task CRUD + validation                    │
│  • comments.ts     - Comment management                        │
│  • activity.ts     - Activity logs                             │
│  • preferences.ts  - User settings                             │
│  • agent.ts        - AI assistant                              │
│  • dashboard.ts    - Analytics & metrics                       │
│                                                                 │
│  Responsibilities:                                              │
│  ✅ Check authentication (authComponent.getAuthUser)            │
│  ✅ Validate input (using helpers)                              │
│  ✅ Enforce rate limits (rateLimiter.limit)                     │
│  ✅ Verify ownership (check userId matches)                     │
│  ✅ Compose database operations                                 │
│  ✅ Log activity (for audit trail)                              │
│  ❌ NEVER uses ctx.db directly!                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ Imports
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│              DATABASE LAYER (convex/db/)                        │
│                                                                 │
│  Pure CRUD Operations:                                          │
│  • tasks.ts           - Task CRUD                              │
│  • taskComments.ts    - Comment CRUD                           │
│  • taskActivity.ts    - Activity CRUD                          │
│  • userPreferences.ts - Preferences CRUD                       │
│  • threads.ts         - AI thread CRUD                         │
│  • messages.ts        - AI message CRUD                        │
│                                                                 │
│  Responsibilities:                                              │
│  ✅ ONLY place that uses ctx.db                                 │
│  ✅ Pure async functions (no Convex query/mutation wrappers)    │
│  ✅ Returns typed data                                          │
│  ✅ No business logic (just CRUD)                               │
│  ✅ No authentication checks                                    │
│  ✅ Efficient queries with proper indexes                       │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ ctx.db
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE (Convex)                            │
│                                                                 │
│  Tables:                                                        │
│  • tasks              - To-do items                            │
│  • taskComments       - Comments on tasks                      │
│  • taskActivity       - Audit log                              │
│  • userPreferences    - User settings                          │
│  • threads            - AI conversation threads                │
│  • messages           - AI messages                            │
│                                                                 │
│  Indexes:                                                       │
│  • by_user            - Fast user lookup                       │
│  • by_user_and_status - Filter by status                      │
│  • by_task            - Related records                        │
│  • by_due_date        - Upcoming/overdue                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              HELPER LAYER (convex/helpers/)                     │
│                                                                 │
│  Pure Utility Functions:                                        │
│  • validation.ts   - Input validation                          │
│  • constants.ts    - App constants                             │
│  • formatting.ts   - Data formatting                           │
│                                                                 │
│  Responsibilities:                                              │
│  ✅ Pure functions (no side effects)                            │
│  ✅ No database access                                          │
│  ✅ No ctx parameter                                            │
│  ✅ Reusable across layers                                      │
│                                                                 │
│  Used by: Endpoint Layer                                        │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Examples

### Example 1: Creating a Task

```typescript
// 1. USER ACTION (Frontend)
const create = useMutation(api.endpoints.tasks.create);
await create({
  title: "Buy groceries",
  priority: "high"
});

// 2. ENDPOINT LAYER (convex/endpoints/tasks.ts)
export const create = mutation({
  args: { title: v.string(), priority: v.optional(...) },
  handler: async (ctx, args) => {
    // Check authentication
    const authUser = await authComponent.getAuthUser(ctx);

    // Rate limiting
    await rateLimiter.limit(ctx, "createTask", { key: authUser._id });

    // Validation
    const validation = validateTaskInput(args); // Helper layer

    // Get next position
    const maxPosition = await Tasks.getMaxPositionForUser(ctx, authUser._id);

    // Create task (Database layer)
    const taskId = await Tasks.createTask(ctx, {
      userId: authUser._id,
      title: args.title,
      priority: args.priority ?? "medium",
      position: maxPosition + 1,
    });

    // Log activity (Database layer)
    await TaskActivity.createTaskActivity(ctx, {
      taskId,
      userId: authUser._id,
      action: "created",
    });

    return taskId;
  },
});

// 3. DATABASE LAYER (convex/db/tasks.ts)
export async function createTask(ctx: MutationCtx, args: CreateTaskArgs) {
  const now = Date.now();
  return await ctx.db.insert("tasks", { // ONLY place using ctx.db
    ...args,
    createdAt: now,
    updatedAt: now,
  });
}

// 4. DATABASE (Convex)
// Real-time insert, triggers subscriptions
```

### Example 2: Listing Tasks (Real-time)

```typescript
// 1. USER VIEW (Frontend)
const tasks = useQuery(api.endpoints.tasks.list);
// Auto-updates when data changes!

// 2. ENDPOINT LAYER (convex/endpoints/tasks.ts)
export const list = query({
  handler: async (ctx) => {
    // Check authentication
    const authUser = await authComponent.getAuthUser(ctx);

    // Get user's tasks (Database layer)
    return await Tasks.getTasksByUser(ctx, authUser._id);
  },
});

// 3. DATABASE LAYER (convex/db/tasks.ts)
export async function getTasksByUser(ctx: QueryCtx, userId: string) {
  return await ctx.db
    .query("tasks")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .order("desc")
    .collect();
}

// 4. DATABASE (Convex)
// Uses index for fast lookup
// Sets up real-time subscription
```

## Key Architecture Rules

### ✅ DO

1. **Database Layer**
   - Use `ctx.db` for all database operations
   - Export pure async functions
   - Return typed data
   - Use indexes for performance

2. **Endpoint Layer**
   - Check authentication first
   - Validate input using helpers
   - Verify ownership before modifications
   - Compose database operations
   - Log important actions
   - Handle errors gracefully

3. **Helper Layer**
   - Write pure functions
   - No side effects
   - No database access
   - Reusable utilities

4. **All Layers**
   - Use TypeScript strict mode
   - Proper error messages
   - User-scoped operations
   - Rate limiting on mutations

### ❌ DON'T

1. **Database Layer**
   - ❌ Business logic
   - ❌ Authentication checks
   - ❌ Direct export of Convex query/mutation

2. **Endpoint Layer**
   - ❌ Direct `ctx.db` usage
   - ❌ Complex validation logic (use helpers)

3. **Helper Layer**
   - ❌ Database access
   - ❌ `ctx` parameter
   - ❌ Side effects

4. **All Layers**
   - ❌ Operations without user scoping
   - ❌ Mutations without rate limiting
   - ❌ Missing authentication checks

## Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ 1. signUp.email({ email, password })
       ▼
┌─────────────────┐
│  Better Auth    │ 2. Create user
│  (convex/auth)  │ 3. Generate JWT
└──────┬──────────┘
       │ 4. Return session + JWT
       ▼
┌─────────────┐
│   Browser   │ 5. Store JWT in authClient
└──────┬──────┘
       │ 6. useQuery(api.endpoints.tasks.list)
       │    (JWT automatically included)
       ▼
┌─────────────────┐
│  Convex         │ 7. Validate JWT
│  Endpoint       │ 8. Extract user ID
└──────┬──────────┘
       │ 9. authComponent.getAuthUser(ctx)
       ▼
┌─────────────┐
│  Database   │ 10. Scoped query (userId = ...)
│  Layer      │
└─────────────┘
```

## Rate Limiting Strategy

```typescript
// Token Bucket Algorithm
// - Allows bursts (capacity parameter)
// - Refills tokens over time (rate parameter)
// - Per-user limits (key: user._id)

const rateLimiter = new RateLimiter(components.rateLimiter, {
  createTask: {
    kind: "token bucket",
    rate: 30,           // 30 requests
    period: MINUTE,     // per minute
    capacity: 5,        // burst of 5
  },
  // ... other operations
});

// In endpoint:
export const create = mutation({
  handler: async (ctx, args) => {
    const user = await authComponent.getAuthUser(ctx);

    const status = await rateLimiter.limit(ctx, "createTask", {
      key: user._id, // Per-user limit
    });

    if (!status.ok) {
      throw new Error(`Rate limit exceeded. Retry after ${status.retryAfter}ms`);
    }

    // ... proceed with operation
  },
});
```

## Component Integration

### Better Auth Component

```
┌──────────────────────────────────────────────┐
│        Better Auth Component                 │
│                                              │
│  • User management                           │
│  • Session management                        │
│  • JWT generation/validation                 │
│  • Email/password authentication             │
│  • HTTP routes (/auth/*)                     │
└──────────────────────────────────────────────┘
         │                         │
         │ adapter(ctx)            │ getAuthUser(ctx)
         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐
│  Convex DB      │       │   Endpoints     │
│  (user storage) │       │  (auth checks)  │
└─────────────────┘       └─────────────────┘
```

### Rate Limiter Component

```
┌──────────────────────────────────────────────┐
│        Rate Limiter Component                │
│                                              │
│  • Token bucket algorithm                    │
│  • Per-user limits                           │
│  • Burst capacity                            │
│  • Auto-refill over time                     │
└──────────────────────────────────────────────┘
         │
         │ limit(ctx, "createTask", { key: user._id })
         ▼
┌─────────────────┐
│   Endpoints     │
│  (all mutations)│
└─────────────────┘
```

## Real-Time Synchronization

```
┌─────────────┐
│  Browser 1  │ Creates task
└──────┬──────┘
       │ useMutation(api.endpoints.tasks.create)
       ▼
┌─────────────┐
│   Convex    │ Insert into database
└──────┬──────┘
       │
       │ Real-time update notification
       ├─────────────────────────────────┐
       ▼                                 ▼
┌─────────────┐                   ┌─────────────┐
│  Browser 1  │ List refreshes    │  Browser 2  │ List refreshes
│  (creator)  │                   │  (other tab)│
└─────────────┘                   └─────────────┘
```

Both browsers have:
```typescript
const tasks = useQuery(api.endpoints.tasks.list);
```

When task is created, Convex automatically notifies all subscribed clients!

## Security Model

```
┌─────────────────────────────────────────────┐
│           Request Flow                      │
└─────────────────────────────────────────────┘

1. Request arrives with JWT
   ↓
2. Convex validates JWT
   ↓
3. authComponent.getAuthUser(ctx)
   ↓
4. Extract user._id from JWT
   ↓
5. Check rate limits (per user)
   ↓
6. Validate input (helpers)
   ↓
7. Verify ownership (if updating/deleting)
   ↓
8. Scope query to user._id
   ↓
9. Execute database operation
   ↓
10. Log activity (audit trail)
```

**Security Guarantees:**
- ✅ All operations authenticated
- ✅ All operations user-scoped
- ✅ All mutations rate-limited
- ✅ All modifications ownership-verified
- ✅ All changes logged (audit trail)
- ✅ Input validation before processing

## Summary

This architecture provides:

1. **Separation of Concerns**
   - Database layer: pure CRUD
   - Endpoint layer: business logic
   - Helper layer: utilities
   - Frontend: UI only

2. **Type Safety**
   - TypeScript throughout
   - Convex validators
   - Typed database operations

3. **Security**
   - Authentication on every request
   - Ownership verification
   - Rate limiting
   - Input validation

4. **Performance**
   - Proper database indexes
   - Real-time updates
   - Efficient queries

5. **Maintainability**
   - Clear layer boundaries
   - Reusable helpers
   - Comprehensive logging
   - Well-documented code

**Result: A production-ready, scalable, secure application! 🚀**
