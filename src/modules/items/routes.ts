import { eq, ilike, lte } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { items } from "../../db/schema";
import { itemParamsSchema, itemQuery, itemSchema } from "./schema";

export const itemsRoute = new Elysia({ prefix: "/items" });
itemsRoute
  .get("/items", async ({ status, query }) => {
    try {
      const parsedQuary = itemQuery.safeParse(query);
      if (!parsedQuary.success) return status(400, "Bad Request");

      if (!parsedQuary.data.search) {
        const itemList = await db.select().from(items);
        return itemList;
      }

      const itemFilteredList = await db
        .select()
        .from(items)
        .where(ilike(items.name, `%${parsedQuary.data.search}%`));

      return itemFilteredList;
    } catch {
      return status(400, "Invalid payload");
    }
  })
  .post("/items", async ({ body, status }) => {
    try {
      const data = itemSchema.safeParse(body);
      if (!data.success) return status(400, "Bad Request");

      const newItem = await db
        .insert(items)
        .values({
          ...data.data,
          currentStock: data.data.initialStock,
        })
        .returning();

      return newItem;
    } catch {
      return status(400, "Invalid payload");
    }
  })
  .get("/items/low-stock", async () => {
    const itemsLowStock = await db
      .select({ id: items.id, name: items.name, currentSotck: items.currentStock })
      .from(items)
      .where(lte(items.currentStock, items.initialStock));

    return itemsLowStock;
  })
  .get("/items/:id", async ({ params, status }) => {
    try {
      const id = itemParamsSchema.safeParse(params);
      if (!id.success) return status(400, "Invalid payload");

      const itemById = await db.select().from(items).where(eq(items.id, id.data.id));
      return itemById;
    } catch {
      return status(400, "Invalid payload");
    }
  })
  .patch("/items/:id", async ({ body, params, status }) => {
    try {
      const id = itemParamsSchema.safeParse(params);
      if (!id.success) return status(400, "Bad Request");

      const data = itemSchema.safeParse(body);
      if (!data.success) return status(400, "Bad Request");

      const result = await db.transaction(async tx => {
        const itemUpdate = await tx
          .update(items)
          .set({ ...data.data })
          .where(eq(items.id, id.data.id))
          .returning();

        return itemUpdate;
      });
      return result;
    } catch {
      return status(400, "Bad Request");
    }
  })
  .delete("/items/:id", async ({ params, status }) => {
    try {
      const id = itemParamsSchema.safeParse(params);
      if (!id.success) return status(400, "Bad Request");

      const dbTransition = await db.transaction(async tx => {
        const [itemDeleteResult] = await tx.delete(items).where(eq(items.id, id.data.id)).returning();
        if (!itemDeleteResult) return status(404, "Item Not Found");

        return itemDeleteResult;
      });
      return dbTransition;
    } catch {
      return status(400, "Invalid payload");
    }
  });
