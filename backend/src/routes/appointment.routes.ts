
import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";

import {
  index,
  show,
  store,
  update,
  destroy,
} from "../controllers/appointment.controller";

const router = Router();

router.use(authenticate);

router.get("/", index);
router.post("/", store);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", destroy);

export default router;
