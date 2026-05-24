import { relations } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: text("name").notNull(),

  classId: uuid("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "cascade" }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const items = pgTable("items", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  initialStock: integer("initial_stock").notNull(),
  currentStock: integer("current_stock").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const issueRules = pgTable("issue_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),

  limit: integer("limit").notNull(),
  period: text("period").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  quantity: integer("quantity").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const classesRelations = relations(classes, ({ many }) => ({
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  class: one(classes, {
    fields: [students.classId],
    references: [classes.id],
  }),
  items: many(items),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  issueRules: many(issueRules),
}));

export const issueRulesRelations = relations(issueRules, ({ one }) => ({
  items: one(items, {
    fields: [issueRules.itemId],
    references: [items.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  items: one(items, {
    fields: [stockMovements.itemId],
    references: [items.id],
  }),
  student: one(students, {
    fields: [stockMovements.studentId],
    references: [students.id],
  }),
}));
