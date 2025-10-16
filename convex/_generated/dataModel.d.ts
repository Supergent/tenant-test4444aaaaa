// Auto-generated type stubs for development
// These will be replaced by 'npx convex dev'

export type DataModel = {
  "tasks": any;
  "taskComments": any;
  "taskActivity": any;
  "userPreferences": any;
  "threads": any;
  "messages": any;
};

export type TableNames = "tasks" | "taskComments" | "taskActivity" | "userPreferences" | "threads" | "messages";

export type Id<TableName extends TableNames> = string & { __tableName: TableName };
export type Doc<TableName extends TableNames> = any;
