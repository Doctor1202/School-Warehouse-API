import { and, eq, gte } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { issueRules, items, stockMovements, students } from "../../db/schema";
import { stockMovementsSchema } from "../stock-movements/schema";

export const issueRoute = new Elysia();

issueRoute.post("/issues", async ({ body, set }) => {
  try {
    const data = stockMovementsSchema.parse(body);

    if (data.quantity < 0) {
      set.status = 400;
      return { error: "Invalid params" };
    }
    //Перевіряє чи є предмет та студент
    const itemCheck = await db.select().from(items).where(eq(items.id, data.itemId)).limit(1);

    if (!itemCheck[0]) {
      set.status = 404;
      return { error: "Item not found." };
    }

    const studentCheck = await db.select().from(students).where(eq(students.id, data.studentId)).limit(1);
    if (!studentCheck[0]) {
      set.status = 404;
      return { error: "Student not found." };
    }

    //перевірити що предмет не перевищував ліміт
    const itemIssueCheck = await db.select().from(issueRules).where(eq(issueRules.itemId, data.itemId)).limit(1);

    if (!itemIssueCheck[0]) {
      set.status = 404;
      return { error: "Issue rule not found" };
    }

    let days = 0;

    switch (itemIssueCheck[0].period) {
      case "day":
        days = 1;
        break;
      case "week":
        days = 7;
        break;
      case "month":
        days = 30;
        break;
    }

    const fromDate = new Date();

    fromDate.setDate(fromDate.getDate() - days);

    const issuedMovements = await db
      .select()
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.itemId, data.itemId),
          eq(stockMovements.type, "issue"),
          gte(stockMovements.createdAt, fromDate),
        ),
      )
      .limit(1);

    if (data.quantity > itemCheck[0].currentStock) {
      set.status = 409;
      return { error: "Limit overload" };
    }

    const totalIssued = issuedMovements.reduce((sum, movement) => sum + movement.quantity, 0);

    if (totalIssued + data.quantity > itemIssueCheck[0].limit) {
      set.status = 409;
      return { error: "Issue limit exceeded" };
    }

    const result = itemCheck[0].currentStock - data.quantity;

    const transactionDb = await db.transaction(async tx => {
      const issue = await tx
        .insert(stockMovements)
        .values({
          studentId: data.studentId,
          itemId: data.itemId,
          type: "issue",
          quantity: data.quantity,
        })
        .returning();

      const itemResult = await tx
        .update(items)
        .set({ currentStock: result })
        .where(eq(items.id, data.itemId))
        .returning();

      return { issue, itemResult };
    });

    return transactionDb;
  } catch (e) {
    set.status = 400;
    return { error: "Invalid payload", e };
  }
});
