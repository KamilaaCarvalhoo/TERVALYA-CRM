
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getReports } from "../controllers/report.controller";

const router = Router();

router.use(authenticate);

router.get("/", getReports);

export default router;
