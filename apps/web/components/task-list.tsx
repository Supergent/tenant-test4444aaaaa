"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Badge,
  Button,
  Skeleton,
} from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { CheckCircle, Circle, Clock, Trash2 } from "lucide-react";

interface Task {
  _id: Id<"tasks">;
  title: string;
  description?: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: number;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

export function TaskList({ tasks, loading }: TaskListProps) {
  const updateTask = useMutation(api.endpoints.tasks.update);
  const completeTask = useMutation(api.endpoints.tasks.complete);
  const deleteTask = useMutation(api.endpoints.tasks.remove);

  const handleStatusChange = async (taskId: Id<"tasks">, currentStatus: string) => {
    const nextStatus =
      currentStatus === "pending"
        ? "in_progress"
        : currentStatus === "in_progress"
        ? "completed"
        : "pending";

    if (nextStatus === "completed") {
      await completeTask({ id: taskId });
    } else {
      await updateTask({ id: taskId, status: nextStatus as any });
    }
  };

  const handleDelete = async (taskId: Id<"tasks">) => {
    if (confirm("Are you sure you want to delete this task?")) {
      await deleteTask({ id: taskId });
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border p-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Circle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No tasks yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first task to get started
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "warning";
      case "low":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task._id}
          className="group flex items-start gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <button
            onClick={() => handleStatusChange(task._id, task.status)}
            className="mt-0.5 transition-transform hover:scale-110"
            title={`Mark as ${task.status === "completed" ? "pending" : "completed"}`}
          >
            {getStatusIcon(task.status)}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3
                className={`font-medium ${
                  task.status === "completed"
                    ? "text-muted-foreground line-through"
                    : "text-foreground"
                }`}
              >
                {task.title}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(task._id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {task.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {task.description}
              </p>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={getPriorityColor(task.priority) as any}>
                {task.priority}
              </Badge>

              {task.status !== "pending" && (
                <Badge variant="secondary">{task.status.replace("_", " ")}</Badge>
              )}

              {task.dueDate && (
                <Badge variant="outline">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </Badge>
              )}

              {task.tags && task.tags.length > 0 && (
                <>
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="subtle">
                      #{tag}
                    </Badge>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
