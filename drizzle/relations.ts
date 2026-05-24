import { relations } from "drizzle-orm/relations";
import { classes, students, items, issueRules } from "./schema";

export const studentsRelations = relations(students, ({one, many}) => ({
	class: one(classes, {
		fields: [students.classId],
		references: [classes.id]
	}),
	items: many(items),
}));

export const classesRelations = relations(classes, ({many}) => ({
	students: many(students),
}));

export const itemsRelations = relations(items, ({one, many}) => ({
	student: one(students, {
		fields: [items.studentId],
		references: [students.id]
	}),
	issueRules: many(issueRules),
}));

export const issueRulesRelations = relations(issueRules, ({one}) => ({
	item: one(items, {
		fields: [issueRules.itemId],
		references: [items.id]
	}),
}));