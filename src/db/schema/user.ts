import {
  pgTable,
  serial,
  varchar,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

export const UserTable = pgTable("user", {
  id: serial().primaryKey(),
  name: varchar().notNull(),
  email: varchar().unique(),
  imageUrl: varchar(),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  githubId: varchar(),
});
