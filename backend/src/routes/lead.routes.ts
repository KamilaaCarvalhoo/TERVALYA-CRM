
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";

import {
  index,
  show,
  store,
  update,
  destroy,
  convert,
} from "../controllers/lead.controller";

const router = Router();

router.use(authenticate);

router.get("/", index);
router.post("/", store);
router.get("/:id", show);
router.patch("/:id", update);
router.delete("/:id", destroy);
router.post("/:id/convert", convert);

export default router;
