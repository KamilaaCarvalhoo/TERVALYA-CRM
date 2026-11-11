
import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";

import {
  listSessions,
  revokeSession,
  revokeOtherSessions,
} from "../controllers/sessions.controller";

const router = Router();

// Todas as rotas exigem autenticação.
router.use(authenticate);

// Listar dispositivos conectados.
router.get("/", listSessions);

// Encerrar todas as outras sessões.
router.post("/revoke-others", revokeOtherSessions);

// Encerrar uma sessão específica.
router.delete("/:sessionId", revokeSession);

export default router;
