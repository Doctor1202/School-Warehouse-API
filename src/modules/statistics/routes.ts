import { count, eq, sum } from "drizzle-orm";
import Elysia from "elysia";
import { db } from "../../db/client";
import { classes, stockMovements, students } from "../../db/schema";

export const statisticRoute = new Elysia();
const stockMovementTypeIssue = "issue";

statisticRoute
  .get("/statistics/students", async () => {
    try {
      //на основі stock-movement -> students -> sum of quantity, count all students that have issue

      const studentStockMovementStatistic = await db
        .select({
          studentId: stockMovements.studentId,
          count: count(),
          sum: sum(stockMovements.quantity),
        })
        .from(stockMovements)
        .where(eq(stockMovements.type, stockMovementTypeIssue))
        .groupBy(stockMovements.studentId);

      return studentStockMovementStatistic;
    } catch (e) {
      return e;
    }
  })
  .get("/statistics/classes", async () => {
    const studentInClasses = await db
      .select({
        classId: classes.id,
        className: classes.name,
        count: count(stockMovements.id),
        sum: sum(stockMovements.quantity),
      })
      .from(stockMovements)
      .innerJoin(students, eq(students.id, stockMovements.studentId))
      .innerJoin(classes, eq(classes.id, students.classId))
      .where(eq(stockMovements.type, stockMovementTypeIssue))
      .groupBy(classes.id, classes.name);

    return studentInClasses;
  });
