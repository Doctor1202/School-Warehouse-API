import { pgTable, foreignKey, uuid, text, timestamp, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const students = pgTable("students", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	classId: uuid("class_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.classId],
			foreignColumns: [classes.id],
			name: "students_class_id_classes_id_fk"
		}).onDelete("cascade"),
]);

export const items = pgTable("items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	studentId: uuid("student_id").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "items_student_id_students_id_fk"
		}).onDelete("cascade"),
]);

export const classes = pgTable("classes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
});

export const issueRules = pgTable("issue_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	itemId: uuid("item_id").notNull(),
	maxDays: integer("max_days").notNull(),
	maxQuantity: integer("max_quantity").notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.itemId],
			foreignColumns: [items.id],
			name: "issue_rules_item_id_items_id_fk"
		}),
]);
