
import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";

import {
  index,
  show,
  store,
  update,
  destroy,
} from "../controllers/client.controller";

const router = Router();

// Todas as rotas de clientes exigem autenticação.
router.use(authenticate);

router.get("/", index);
router.get("/:id", show);
router.post("/", store);
router.put("/:id", update);
router.patch("/:id", update);
router.delete("/:id", destroy);

export default router;
