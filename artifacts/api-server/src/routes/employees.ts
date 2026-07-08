import { Router, type IRouter } from "express";
import { db, employeesTable } from "@workspace/db";
import {
  CreateEmployeeBody,
  CreateEmployeeResponse,
  ListEmployeesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/employees", async (_req, res): Promise<void> => {
  const employees = await db.select().from(employeesTable).orderBy(employeesTable.name);
  res.json(ListEmployeesResponse.parse(employees));
});

router.post("/employees", async (req, res): Promise<void> => {
  const parsed = CreateEmployeeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { name, role, department, color } = parsed.data;
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);

  const [employee] = await db
    .insert(employeesTable)
    .values({
      name,
      role,
      department,
      color: color ?? "#6366f1",
      avatarInitials: initials,
    })
    .returning();

  res.status(201).json(CreateEmployeeResponse.parse(employee));
});

export default router;
