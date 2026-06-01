import { and, eq, ilike } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { classes, students } from "../../db/schema";
import { studentParamsSchema, studentSearchSchema, studentsSchema } from "./schema";

export const studentsRoute = new Elysia();

studentsRoute
  .get("/students", async ({ query, status}) => {
    const parseQuaery = studentSearchSchema.safeParse(query);

    if(!parseQuaery.success) return status (400, "Invalid payload");

    if (parseQuaery.data.search || parseQuaery.data.classId) {
      const filteredStudents = await db
        .select()
        .from(students)
        .where(
          and(
            parseQuaery.data.search ? ilike(students.fullName, `%${parseQuaery.data.search}%`) : undefined,
            parseQuaery.data.classId ? eq(students.classId, parseQuaery.data.classId) : undefined,
          ),
        );

      return filteredStudents;
    }

    const allStudents = await db.select().from(students);

    return allStudents;
  })
  .get("/students/:id", async ({ params, status }) => {
      const id = studentParamsSchema.safeParse(params);

      if (!id.success) {
        return status(400, "Invalid params")
      }

      const [result] = await db.select().from(students).where(eq(students.id, id.data.id)).limit(1);

      if (!result) {
        return status(404, "Student not found");
      }

      return result;
  })
  .post("/students", async ({ body, status }) => {
      const data = studentsSchema.safeParse(body);

      if(!data.success) return status(400, "Invalid payload");

      const [existingClass] = await db.select().from(classes).where(eq(classes.id, data.data.classId)).limit(1);

      if (!existingClass) {
        return status(404, "Class not found");
      }

      const [newStudent] = await db
        .insert(students)
        .values({
          fullName: data.data.fullName,
          classId: data.data.classId,
        })
        .returning();

      return newStudent;
  })
  .patch("/students/:id", async ({ body, params, status }) => {
      const id = studentParamsSchema.safeParse(params);
      if(!id.success)return status (400, "Invalid payload");

      const data = studentsSchema.safeParse(body);
      if(!data.success)return status (400, "Invalid payload");

      const studentUpdate = await db
        .update(students)
        .set({ fullName: data.data.fullName, classId: data.data.classId })
        .where(eq(students.id, id.data.id))
        .returning();

      return studentUpdate;
  })
  .delete("/students/:id", async ({ params, status }) => {
      const id = studentParamsSchema.safeParse(params);
      if(!id.success) return status (400, "Invalid payload");

      const studentDeleteResult = await db.delete(students).where(eq(students.id, id.data.id)).returning();
      if (!studentDeleteResult[0]) return status(404, "Student not found");
      
      return studentDeleteResult;

  });
