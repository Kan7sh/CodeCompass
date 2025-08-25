import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { UserTable } from "./user";

export const MonitoringRepo = pgTable("monitoringRepo", {
  id: serial().primaryKey(),
  userId: integer()
    .notNull()
    .references(() => UserTable.id),
  repoName: varchar().notNull(),
  branchName: varchar().notNull(),
  webhookId: integer().notNull(),
  customPrompt: varchar(),
});
