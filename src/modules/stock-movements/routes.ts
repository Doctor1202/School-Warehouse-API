import { asc, desc, eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { stockMovements } from "../../db/schema";
import { parsedQuaryStockMovementsSchema } from "./schema";

export const stockMovementRoute = new Elysia();

stockMovementRoute.get("/stock-movements", async ({ query, set }) => {
  try {
    const parsedQuery = parsedQuaryStockMovementsSchema.parse(query);

    const sortField = parsedQuery.filter ?? "createdAt";
    const sortOrder = parsedQuery.sort ?? "desc";

    const orderColumn = sortField === "quantity" ? stockMovements.quantity : stockMovements.createdAt;

    const offset = (parsedQuery.page - 1) * parsedQuery.pageSize;

    const baseQuery = db
      .select()
      .from(stockMovements)
      .orderBy(sortOrder === "asc" ? asc(orderColumn) : desc(orderColumn))
      .limit(parsedQuery.pageSize)
      .offset(offset);

    if (parsedQuery.type) {
      const filteredListOfStockMovements = await baseQuery.where(eq(stockMovements.type, parsedQuery.type));

      return filteredListOfStockMovements;
    }

    const listOfStockMovements = await baseQuery;

    return listOfStockMovements;
  } catch {
    set.status = 400;

    return { error: "Invalid params" };
  }
});
