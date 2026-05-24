import z from "zod";

export const studentsSchema = z.object({
  fullName: z.string().min(1),
  classId: z.string(),
});

export const studentParamsSchema = z.object({
  id: z.string().min(1),
});

export const studentSearchSchema = z.object({
  search: z.string().optional(),
  classId: z.string().optional(),
});
