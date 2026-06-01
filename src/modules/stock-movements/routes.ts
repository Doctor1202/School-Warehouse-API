import { asc, desc, eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { stockMovements } from "../../db/schema";
import { parsedQuaryStockMovementsSchema } from "./schema";

export const stockMovementRoute = new Elysia();

stockMovementRoute.get("/stock-movements", async ({ query, status }) => {
  try {
    const parsedQuery = parsedQuaryStockMovementsSchema.safeParse(query);
    if (!parsedQuery.success) return status(400, "Bad Request");

    const sortField = parsedQuery.data.filter ?? "createdAt";
    const sortOrder = parsedQuery.data.sort ?? "desc";

    const orderColumn = sortField === "quantity" ? stockMovements.quantity : stockMovements.createdAt;

    const offset = (parsedQuery.data.page - 1) * parsedQuery.data.pageSize;

    const baseQuery = db
      .select()
      .from(stockMovements)
      .orderBy(sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn))
      .limit(parsedQuery.data.pageSize)
      .offset(offset);

    if (parsedQuery.data.type) {
      const filteredListOfStockMovements = await baseQuery.where(eq(stockMovements.type, parsedQuery.data.type));

      return filteredListOfStockMovements;
    }

    const listOfStockMovements = await baseQuery;

    return listOfStockMovements;
  } catch {
    return status(400, "Invalid payload");
  }
});
