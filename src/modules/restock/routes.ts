import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { issueRules, items, stockMovements } from "../../db/schema";
import { paramsSchema } from "../issue/schema";
import { restockSchema } from "./schema";

export const restockRoutes = new Elysia();

restockRoutes
  .post("/restocks", async ({ body, status }) => {
    try {
      const data = restockSchema.safeParse(body);
      if (!data.success) return status(400, "Bad Request");

      const [item] = await db.select().from(items).where(eq(items.id, data.data.itemId));

      if (!item) return status(404, "Item not found");

      const itemQuantity = item.currentStock;

      const currentItemQuantity = itemQuantity + data.data.quantity;

      const result = await db.transaction(async tx => {
        const itemUpdateResult = await tx
          .update(items)
          .set({ currentStock: currentItemQuantity })
          .where(eq(items.id, data.data.itemId))
          .returning();

        const stockMovementResult = await tx
          .insert(stockMovements)
          .values({
            itemId: data.data.itemId,
            quantity: data.data.quantity,
            type: "restock",
          })
          .returning();
        return { itemUpdateResult, stockMovementResult };
      });
      return { result };
    } catch {
      return status(400, "Invalid payload");
    }
  })
  .post("/issues/:id/return", async ({ params, status }) => {
    try {
      const id = paramsSchema.safeParse(params);
      if (!id.success) return status(400, "Bad Request");

      const [item] = await db.select().from(items).where(eq(items.id, id.data.id));
      if (!item) return status(404, "Item not found");

      const [isIssueReal] = await db.select().from(issueRules).where(eq(issueRules.itemId, id.data.id));
      if (!isIssueReal) return status(404, "Issue not found");

      //Повертаю все до InitialStock
      const itemInitialStock = item.initialStock;
      const currentToInitial = item.initialStock - item.currentStock;

      if (!item.initialStock) return status(404, "Item not found");

      const result = await db.transaction(async tx => {
        const insertResult = await tx
          .insert(stockMovements)
          .values({
            itemId: id.data.id,
            quantity: currentToInitial,
            type: "return",
          })
          .returning();
        const updateResult = await tx
          .update(items)
          .set({ currentStock: itemInitialStock })
          .where(eq(items.id, id.data.id))
          .returning();

        // const updateIssue = await tx.update();
        return { insertResult, updateResult };
      });

      return result;
    } catch {
      return status(400, "Invalid payload");
    }
  });
