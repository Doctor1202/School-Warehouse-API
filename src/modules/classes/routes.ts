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
  .get("/classes/:id", async ({ params, status }) => {
    const id = classIdSchema.safeParse(params);
    if (!id.success) return status(400, "Invalid payload");

    const [classById] = await db.select().from(classes).where(eq(classes.id, id.data.id)).limit(1);
    if (!classById) return status(404, "Class not found");

    return classById;
  })
  .post("/classes", async ({ body, status }) => {
    const data = createClassSchema.safeParse(body);
    if (!data.success) return status(400, "Invalid payload");

    const [newClass] = await db
      .insert(classes)
      .values({
        name: data.data.name,
      })
      .returning();

    return newClass;
  })
  .patch("/classes/:id", async ({ body, params, status }) => {
    const id = classIdSchema.safeParse(params);
    if (!id.success) return status(400, "Invalid payload");

    const data = createClassSchema.safeParse(body);
    if (!data.success) return status(400, "Invalid payload");

    const classeNameUpdate = await db
      .update(classes)
      .set({ name: data.data.name })
      .where(eq(classes.id, id.data.id))
      .returning();

    return classeNameUpdate;
  })
  .delete("/classes/:id", async ({ params, status }) => {
    const id = classIdSchema.safeParse(params);
    if (!id.success) return status(400, "Bad Request");

    const [classDelete] = await db.delete(classes).where(eq(classes.id, id.data.id)).returning();
    if (!classDelete) return status(404, "Class Not Found");

    return classDelete;
  });
