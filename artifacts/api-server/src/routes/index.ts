import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import meetingsRouter from "./meetings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(meetingsRouter);

export default router;
