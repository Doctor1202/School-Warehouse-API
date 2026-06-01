import { and, eq, gte } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { issueRules, items, stockMovements, students } from "../../db/schema";
import { stockMovementsSchema } from "../stock-movements/schema";

export const issueRoute = new Elysia();

issueRoute.post("/issues", async ({ body, status }) => {
  try {
    const data = stockMovementsSchema.safeParse(body);
    if (!data.success) return status(400, "Invalid payload");
    if (data.data.quantity < 0) return status(400, "Bad Request");

    //Перевіряє чи є предмет та студент
    const [itemCheck] = await db.select().from(items).where(eq(items.id, data.data.itemId)).limit(1);
    if (!itemCheck) return status(404, "Item not found");

    const [studentCheck] = await db.select().from(students).where(eq(students.id, data.data.studentId)).limit(1);
    if (!studentCheck) return status(404, "Student not found");

    //перевірити що предмет не перевищував ліміт
    const [itemIssueCheck] = await db.select().from(issueRules).where(eq(issueRules.itemId, data.data.itemId)).limit(1);
    if (!itemIssueCheck) return status(404, "Issue rule not found");

    function dataDays(period: string): number {
      switch (period) {
        case "day": {
          return 1;
        }
        case "week": {
          return 7;
        }
        case "month": {
          return 30;
        }
        default: {
          return 1;
        }
      }
    }

    const fromDate = new Date();

    fromDate.setDate(fromDate.getDate() - dataDays(itemIssueCheck.period));

    const issuedMovements = await db
      .select()
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.itemId, data.data.itemId),
          eq(stockMovements.type, "issue"),
          gte(stockMovements.createdAt, fromDate),
        ),
      )
      .limit(1);

    if (data.data.quantity > itemCheck.currentStock) return status(409, "Limit overload");

    const totalIssued = issuedMovements.reduce((sum, movement) => sum + movement.quantity, 0);
    if (totalIssued + data.data.quantity > itemIssueCheck.limit) return status(409, "Issue limit exceeded");

    const result = itemCheck.currentStock - data.data.quantity;

    const transactionDb = await db.transaction(async tx => {
      const issue = await tx
        .insert(stockMovements)
        .values({
          studentId: data.data.studentId,
          itemId: data.data.itemId,
          type: "issue",
          quantity: data.data.quantity,
        })
        .returning();

      const itemResult = await tx
        .update(items)
        .set({ currentStock: result })
        .where(eq(items.id, data.data.itemId))
        .returning();

      return { issue, itemResult };
    });

    return transactionDb;
  } catch {
    return status(400, "Bad request");
  }
});
