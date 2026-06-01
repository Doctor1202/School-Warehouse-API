import z from "zod";

export const stockMovementsSchema = z.object({
  itemId: z.uuid(),
  studentId: z.uuid(),
  type: z.enum(["issue", "return", "add", "remove"]).optional(),
  quantity: z.coerce.number(),
});

export const parsedQuaryStockMovementsSchema = z.object({
  type: z.enum(["issue", "return", "add", "remove"]).optional(),
  filter: z.enum(["createdAt", "quantity"]).optional(),
  sort: z.enum(["asc", "desc"]).optional(),

  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
});
