import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { classes } from "../../db/schema";
import { classIdSchema, createClassSchema } from "./schema";

export const route = "/health";

export const classesRoute = new Elysia();

classesRoute
  .get("/classes", async () => {
    const allClasses = await db.select().from(classes);

    return allClasses;
  })
  .get("/classes/:id", async ({ params, set }) => {
    try {
      const { id } = classIdSchema.parse(params);

      const classById = await db.select().from(classes).where(eq(classes.id, id)).limit(1);

      if (!classById[0]) {
        set.status = 404;
        return { error: "Class not found" };
      }
      return classById;
    } catch {
      set.status = 400;
      return { error: "Invalid params" };
    }
  })
  .post("/classes", async ({ body, set }) => {
    try {
      const data = createClassSchema.parse(body);

      const [newClass] = await db
        .insert(classes)
        .values({
          name: data.name,
        })
        .returning();

      return newClass;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .patch("/classes/:id", async ({ body, params, set }) => {
    try {
      const { id } = classIdSchema.parse(params);
      const data = createClassSchema.parse(body);

      const classeNameUpdate = await db.update(classes).set({ name: data.name }).where(eq(classes.id, id)).returning();

      return classeNameUpdate;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .delete("/classes/:id", async ({ params, set }) => {
    try {
      const { id } = classIdSchema.parse(params);
      const classDelete = await db.delete(classes).where(eq(classes.id, id)).returning();

      if (!classDelete[0]) {
        set.status = 404;
        return { error: "Class not found" };
      }
      return classDelete;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  });
