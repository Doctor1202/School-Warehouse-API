import z from "zod";

export const restockSchema = z.object({
  itemId: z.coerce.string(),
  quantity: z.coerce.number(),
});
