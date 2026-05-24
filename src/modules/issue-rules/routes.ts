import { eq } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { issueRules, items } from "../../db/schema";
import { issueRulesSchema, paramsSchema } from "../issue/schema";

export const issueRuleRoute = new Elysia();

issueRuleRoute
  .post("/items/:id/rule", async ({ body, params, set }) => {
    try {
      const { id } = paramsSchema.parse(params);
      const data = issueRulesSchema.parse(body);

      const item = await db.select().from(items).where(eq(items.id, id)).limit(1);

      if (!item[0]) {
        set.status = 404;
        return { error: "Item not found" };
      }

      const ruleCheckIsCreatedBefore = await db.select().from(issueRules).where(eq(issueRules.itemId, id)).limit(1);

      if (ruleCheckIsCreatedBefore[0]) {
        const issueRulesListOfAll = await db
          .select()
          .from(issueRules)
          .where(eq(issueRules.id, ruleCheckIsCreatedBefore[0].id));

        if (issueRulesListOfAll[0]) {
          set.status = 400;
          return { error: "Rule is already created for item" };
        }
      }

      const [rule] = await db
        .insert(issueRules)
        .values({
          itemId: id,
          limit: data.limit,
          period: data.period,
        })
        .returning();

      const ruleCheck = await db.select().from(issueRules).where(eq(issueRules.itemId, id)).limit(1);

      if (!ruleCheck[0]) {
        set.status = 400;
        return { error: "Rule not found" };
      }

      return rule;
    } catch {
      set.status = 400;
      return { error: "Invalid payload" };
    }
  })
  .patch("/items/:id/rule", async ({ body, params, set }) => {
    try {
      const { id } = paramsSchema.parse(params);

      const itemCheck = await db.select().from(items).where(eq(items.id, id)).limit(1);
      if (!itemCheck[0]) {
        set.status = 404;
        return { error: "Item not found" };
      }

      const data = issueRulesSchema.parse(body);
      const issueRulesCheck = await db.select().from(issueRules).where(eq(issueRules.itemId, id)).limit(1);

      if (!issueRulesCheck[0]) {
        set.status = 404;
        return { error: "Issue rule not found" };
      }

      const issueRuleChange = await db
        .update(issueRules)
        .set({
          limit: data.limit,
          period: data.period,
        })
        .where(eq(issueRules.itemId, id))
        .returning();

      return issueRuleChange;
    } catch {
      set.status = 400;

      return { error: "Invalid payload" };
    }
  });
