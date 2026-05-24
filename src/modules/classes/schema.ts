import z from "zod";

export const createClassSchema = z.object({
  name: z.coerce.string().min(1),
});

export const classIdSchema = z.object({
  id: z.coerce.string(),
});
