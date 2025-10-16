"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Card, CardContent, CardHeader, CardTitle, StyledTabsList, StyledTabsTrigger, StyledTabsContent, Tabs } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { Alert, AlertDescription, AlertTitle } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { Badge } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { Skeleton } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";
import { useToast } from "@jn7b6tyq8c6tpz02cef8h679f57skf7x/components";

export function DashboardHero() {
  const { toast } = useToast();
  const summary = useQuery(api.dashboard.summary);
  const recent = useQuery(api.dashboard.recent);

  const loading = !summary || !recent;
  const rows = useMemo(() => recent ?? [], [recent]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <Badge variant="subtle">Tone: Neutral</Badge>
            <CardTitle className="mt-2">Welcome back 👋</CardTitle>
          </div>
          <Button
            onClick={() =>
              toast({
                title: "Demo toast",
                description: "Using shared toast utilities wired to Convex",
              })
            }
          >
            Trigger toast
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <StyledTabsList>
              <StyledTabsTrigger value="overview">Overview</StyledTabsTrigger>
              <StyledTabsTrigger value="recent">Recent</StyledTabsTrigger>
              <StyledTabsTrigger value="insights">Insights</StyledTabsTrigger>
            </StyledTabsList>
            <StyledTabsContent value="overview">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card
                  className="bg-primary text-primary-foreground"
                  style={{ background: "#6366f1" }}
                >
                  <CardHeader>
                    <CardTitle>Total records</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-9 w-24" />
                    ) : (
                      <>
                        <p className="text-3xl font-semibold">{summary.totalRecords}</p>
                        <p className="text-sm opacity-80">Across all primary tables</p>
                      </>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Active users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <Skeleton className="h-9 w-20" />
                    ) : (
                      <p className="text-3xl font-semibold">{summary.activeUsers}</p>
                    )}
                    <p className="mt-2 text-sm text-neutral-foreground-secondary">
                      From Better Auth sessions
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert variant="warning">
                      <AlertTitle>Configure integrations</AlertTitle>
                      <AlertDescription>
                        Connect external services to populate richer analytics.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </div>
            </StyledTabsContent>
            <StyledTabsContent value="recent">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-neutral-foreground-secondary">
                        No records yet. Create one from the app to see it here.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => (
                      <TableRow key={row._id}>
                        <TableCell>{row.name ?? row.title ?? row._id}</TableCell>
                        <TableCell>{row.status ?? "--"}</TableCell>
                        <TableCell>
                          {row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "--"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </StyledTabsContent>
            <StyledTabsContent value="insights">
              <p className="text-sm text-neutral-foreground-secondary">
                Generate additional analytics endpoints to populate this tab with charts or insights.
              </p>
            </StyledTabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
