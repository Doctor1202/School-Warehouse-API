import z from "zod";

export const restockSchema = z.object({
  itemId: z.uuid(),
  quantity: z.coerce.number(),
});
