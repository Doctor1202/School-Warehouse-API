import z from "zod";

export const itemSchema = z.object({
  name: z.coerce.string().min(1),
  unit: z.coerce.string().min(1),
  initialStock: z.coerce.number(),
});

export const itemQuery = z.object({
  search: z.string().optional(),
});

export const itemParamsSchema = z.object({
  id: z.coerce.string().min(1),
});
