import { and, eq, ilike } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { classes, students } from "../../db/schema";
import { studentParamsSchema, studentSearchSchema, studentsSchema } from "./schema";

export const studentsRoute = new Elysia();

studentsRoute
  .get("/students", async ({ query }) => {
    const parseQuaery = studentSearchSchema.parse(query);

    if (parseQuaery.search || parseQuaery.classId) {
      const filteredStudents = await db
        .select()
        .from(students)
        .where(
          and(
            parseQuaery.search ? ilike(students.fullName, `%${parseQuaery.search}%`) : undefined,
            parseQuaery.classId ? eq(students.classId, parseQuaery.classId) : undefined,
          ),
        );

      return filteredStudents;
    }

    const allStudents = await db.select().from(students);

    return allStudents;
  })
  .get("/students/:id", async ({ params, set }) => {
    try {
      const { id } = studentParamsSchema.parse(params);

      const result = await db.select().from(students).where(eq(students.id, id)).limit(1);

      if (!result[0]) {
        set.status = 404;
        return { error: "Student not found" };
      }

      return result;
    } catch {
      set.status = 400;
      return { error: "Invalid params" };
    }
  })
  .post("/students", async ({ body, set }) => {
    try {
      const data = studentsSchema.parse(body);

      const existingClass = await db.select().from(classes).where(eq(classes.id, data.classId)).limit(1);

      const existingClassId = existingClass[0];

      if (!existingClassId) {
        set.status = 404;
        return { error: "Class not found" };
      }

      if (existingClass.length === 0) {
        set.status = 400;
        return { error: "Class not found" };
      }

      const [newStudent] = await db
        .insert(students)
        .values({
          fullName: data.fullName,
          classId: data.classId,
        })
        .returning();

      return newStudent;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .patch("/students/:id", async ({ body, params, set }) => {
    try {
      const { id } = studentParamsSchema.parse(params);
      const data = studentsSchema.parse(body);
      const studentUpdate = await db
        .update(students)
        .set({ fullName: data.fullName, classId: data.classId })
        .where(eq(students.id, id))
        .returning();

      return studentUpdate;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .delete("/students/:id", async ({ params, set }) => {
    try {
      const { id } = studentParamsSchema.parse(params);
      const studentDeleteResult = await db.delete(students).where(eq(students.id, id)).returning();
      if (!studentDeleteResult[0]) {
        set.status = 404;
        return { error: "Student not found" };
      }
      return studentDeleteResult;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  });
