import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { issueRules, items } from "../../db/schema";
import { issueRulesSchema, paramsSchema } from "../issue/schema";

export const issueRuleRoute = new Elysia();

issueRuleRoute
  .post("/items/:id/rule", async ({ body, params, status }) => {
    try {
      const id = paramsSchema.safeParse(params);
      if (!id.success) return status(400, "Bad Request");

      const data = issueRulesSchema.safeParse(body);
      if (!data.success) return status(400, "Bad Request");

      const [item] = await db.select().from(items).where(eq(items.id, id.data.id)).limit(1);
      if (!item) return status(404, "Item not found");

      const [ruleCheckIsCreatedBefore] = await db
        .select()
        .from(issueRules)
        .where(eq(issueRules.itemId, id.data.id))
        .limit(1);

      if (ruleCheckIsCreatedBefore) {
        const [issueRulesListOfAll] = await db
          .select()
          .from(issueRules)
          .where(eq(issueRules.id, ruleCheckIsCreatedBefore.id));

        if (issueRulesListOfAll) return status(400, "Rule is already created for item");
      }

      const [rule] = await db
        .insert(issueRules)
        .values({
          itemId: id.data.id,
          limit: data.data.limit,
          period: data.data.period,
        })
        .returning();

      const [ruleCheck] = await db.select().from(issueRules).where(eq(issueRules.itemId, id.data.id)).limit(1);
      if (!ruleCheck) return status(404, "Rule not found ");

      return rule;
    } catch {
      return status(400, "Invalid payload");
    }
  })
  .patch("/items/:id/rule", async ({ body, params, status }) => {
    try {
      const id = paramsSchema.safeParse(params);
      if (!id.success) return status(400, "Bad Request");

      const data = issueRulesSchema.safeParse(body);
      if (!data.success) return status(400, "Bad Request");

      const itemCheck = await db.select().from(items).where(eq(items.id, id.data.id)).limit(1);
      if (!itemCheck[0]) return status(404, "Item not found");

      const [issueRulesCheck] = await db.select().from(issueRules).where(eq(issueRules.itemId, id.data.id)).limit(1);
      if (!issueRulesCheck) return status(404, "Issue rule not found");

      const result = await db.transaction(async tx => {
        const issueRuleChange = await tx
          .update(issueRules)
          .set({
            limit: data.data.limit,
            period: data.data.period,
          })
          .where(eq(issueRules.itemId, id.data.id))
          .returning();

        return issueRuleChange;
      });

      return result;
    } catch {
      return status(400, "Invalid payload");
    }
  });
