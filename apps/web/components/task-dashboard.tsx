"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSession } from "@/lib/auth-client";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Tabs,
  StyledTabsList,
  StyledTabsTrigger,
  StyledTabsContent,
  Skeleton,
} from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { TaskList } from "./task-list";
import { CreateTaskDialog } from "./create-task-dialog";
import { AuthScreen } from "./auth-screen";

export function TaskDashboard() {
  const { data: session, isPending } = useSession();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const stats = useQuery(api.endpoints.tasks.getStats);
  const tasks = useQuery(api.endpoints.tasks.list);
  const pendingTasks = useQuery(api.endpoints.tasks.listByStatus, { status: "pending" });
  const inProgressTasks = useQuery(api.endpoints.tasks.listByStatus, { status: "in_progress" });
  const completedTasks = useQuery(api.endpoints.tasks.listByStatus, { status: "completed" });

  // Show loading state while checking auth
  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Skeleton className="mx-auto h-8 w-48" />
          <Skeleton className="mx-auto mt-4 h-4 w-64" />
        </div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!session) {
    return <AuthScreen />;
  }

  const loading = stats === undefined || tasks === undefined;

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Distraction-Free To-Do
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Focus on what matters. One task at a time.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} size="lg">
          + New Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">{stats.total}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{stats.pending}</div>
                <Badge variant="secondary">To Do</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{stats.inProgress}</div>
                <Badge variant="default">Active</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{stats.completed}</div>
                <Badge variant="success">
                  {stats.completionRate}%
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Lists */}
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="all">
            <StyledTabsList>
              <StyledTabsTrigger value="all">
                All Tasks
                {!loading && tasks && (
                  <Badge variant="subtle" className="ml-2">
                    {tasks.length}
                  </Badge>
                )}
              </StyledTabsTrigger>
              <StyledTabsTrigger value="pending">
                Pending
                {!loading && pendingTasks && (
                  <Badge variant="subtle" className="ml-2">
                    {pendingTasks.length}
                  </Badge>
                )}
              </StyledTabsTrigger>
              <StyledTabsTrigger value="in-progress">
                In Progress
                {!loading && inProgressTasks && (
                  <Badge variant="subtle" className="ml-2">
                    {inProgressTasks.length}
                  </Badge>
                )}
              </StyledTabsTrigger>
              <StyledTabsTrigger value="completed">
                Completed
                {!loading && completedTasks && (
                  <Badge variant="subtle" className="ml-2">
                    {completedTasks.length}
                  </Badge>
                )}
              </StyledTabsTrigger>
            </StyledTabsList>

            <StyledTabsContent value="all">
              <TaskList tasks={tasks || []} loading={loading} />
            </StyledTabsContent>

            <StyledTabsContent value="pending">
              <TaskList tasks={pendingTasks || []} loading={loading} />
            </StyledTabsContent>

            <StyledTabsContent value="in-progress">
              <TaskList tasks={inProgressTasks || []} loading={loading} />
            </StyledTabsContent>

            <StyledTabsContent value="completed">
              <TaskList tasks={completedTasks || []} loading={loading} />
            </StyledTabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
