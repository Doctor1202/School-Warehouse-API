import z from "zod";

export const issueRulesSchema = z.object({
  limit: z.coerce.number().positive(),
  period: z.enum(["day", "week", "month"]),
});

export const paramsSchema = z.object({
  id: z.uuid(),
});
