import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { issueRules, items, stockMovements } from "../../db/schema";
import { paramsSchema } from "../issue/schema";
import { restockSchema } from "./schema";

export const restockRoutes = new Elysia();

restockRoutes
  .post("/restocks", async ({ body, set }) => {
    try {
      const data = restockSchema.parse(body);

      const item = await db.select().from(items).where(eq(items.id, data.itemId));

      if (!item[0]) {
        set.status = 404;
        return { error: "Item not found" };
      }

      const itemQuantity = item[0].currentStock;

      const currentItemQuantity = itemQuantity + data.quantity;

      const result = await db.transaction(async tx => {
        const itemUpdateResult = await tx
          .update(items)
          .set({ currentStock: currentItemQuantity })
          .where(eq(items.id, data.itemId))
          .returning();

        return { itemUpdateResult };
      });
      const stockMovementResult = await db
        .insert(stockMovements)
        .values({
          itemId: data.itemId,
          quantity: data.quantity,
          type: "restock",
        })
        .returning();
      return { stockMovementResult, result };
    } catch (e) {
      set.status = 400;
      return { error: "Invalid payload", e };
    }
  })
  .post("/issues/:id/return", async ({ params, set }) => {
    try {
      const { id } = paramsSchema.parse(params);

      const item = await db.select().from(items).where(eq(items.id, id));

      if (!item[0]) {
        set.status = 404;
        return { error: "Item not found" };
      }

      const isIssueReal = await db.select().from(issueRules).where(eq(issueRules.itemId, id));

      if (!isIssueReal) {
        set.status = 404;
        return { error: "Issue not found" };
      }

      //Повертаю все до InitialStock
      const itemInitialStock = item[0].initialStock;

      const currentToInitial = item[0].initialStock - item[0].currentStock;

      if (!item[0].initialStock) {
        set.status = 404;

        return { error: "Item not found" };
      }

      const result = await db.transaction(async tx => {
        const insertResult = await tx
          .insert(stockMovements)
          .values({
            itemId: id,
            quantity: currentToInitial,
            type: "return",
          })
          .returning();
        const updateResult = await tx
          .update(items)
          .set({ currentStock: itemInitialStock })
          .where(eq(items.id, id))
          .returning();

        // const updateIssue = await tx.update();
        return { insertResult, updateResult };
      });

      return result;
    } catch (e) {
      set.status = 400;
      return { error: "Invalid payload", e };
    }
  });
