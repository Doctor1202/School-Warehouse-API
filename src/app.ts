import "dotenv/config";

import Elysia from "elysia";
import { classesRoute, route } from "./modules/classes/routes";
import { issueRoute } from "./modules/issue/routes";
import { issueRuleRoute } from "./modules/issue-rules/routes";
import { itemsRoute } from "./modules/items/routes";
import { restockRoutes } from "./modules/restock/routes";
import { statisticRoute } from "./modules/statistics/routes";
import { stockMovementRoute } from "./modules/stock-movements/routes";
import { studentsRoute } from "./modules/students/routes";

export const app = new Elysia();

app
  .get(route, ({ status }) => status(200, true))
  .use(classesRoute)
  .use(studentsRoute)
  .use(itemsRoute)
  .use(issueRuleRoute)
  .use(issueRoute)
  .use(restockRoutes)
  .use(stockMovementRoute)
  .use(statisticRoute);
