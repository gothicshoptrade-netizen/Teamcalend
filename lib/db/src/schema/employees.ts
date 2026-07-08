import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const employeesTable = pgTable("employees", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  department: text("department").notNull(),
  avatarInitials: varchar("avatar_initials", { length: 4 }).notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#6366f1"),
});

export const insertEmployeeSchema = createInsertSchema(employeesTable).omit({ id: true });
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employeesTable.$inferSelect;
