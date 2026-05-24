import { eq, ilike, lte } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { items } from "../../db/schema";
import { itemParamsSchema, itemQuery, itemSchema } from "./schema";

export const itemsRoute = new Elysia();
itemsRoute
  .get("/items", async ({ set, query }) => {
    try {
      const parsedQuary = itemQuery.parse(query);

      if (!parsedQuary.search) {
        const itemList = await db.select().from(items);

        return itemList;
      }

      const itemFilteredList = await db
        .select()
        .from(items)
        .where(ilike(items.name, `%${parsedQuary.search}%`));

      return itemFilteredList;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .post("/items", async ({ body, set }) => {
    try {
      const data = itemSchema.parse(body);

      const newItem = await db
        .insert(items)
        .values({
          name: data.name,
          unit: data.unit,
          initialStock: data.initialStock,
          currentStock: data.initialStock,
        })
        .returning();

      return newItem;
    } catch {
      set.status = 400;

      return { error: "Invalid payload" };
    }
  })
  .get("/items/low-stock", async () => {
    const itemsLowStock = await db
      .select({ id: items.id, name: items.name, currentSotck: items.currentStock })
      .from(items)
      .where(lte(items.currentStock, items.initialStock));

    return itemsLowStock;
  })
  .get("/items/:id", async ({ params, set }) => {
    try {
      const { id } = itemParamsSchema.parse(params);
      const itemById = await db.select().from(items).where(eq(items.id, id));
      return itemById;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .patch("/items/:id", async ({ body, params, set }) => {
    try {
      const { id } = itemParamsSchema.parse(params);
      const data = itemSchema.parse(body);
      const itemUpdate = await db
        .update(items)
        .set({ name: data.name, unit: data.unit, initialStock: data.initialStock })
        .where(eq(items.id, id))
        .returning();

      return itemUpdate;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .delete("/items/:id", async ({ params, set }) => {
    try {
      const { id } = itemParamsSchema.parse(params);
      const dbTransition = await db.transaction(async tx => {
        const itemDeleteResult = await tx.delete(items).where(eq(items.id, id)).returning();
        if (!itemDeleteResult[0]) {
          set.status = 404;
          return { error: "Item not found" };
        }
        return itemDeleteResult;
      });
      return dbTransition;
    } catch (e) {
      set.status = 400;
      return { error: "Invalid payload", e };
    }
  });
