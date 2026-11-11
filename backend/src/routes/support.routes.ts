
import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";

import {
  createTicket,
  listTickets,
  getTicketDetails,
  sendTicketMessage,
  closeTicket,
  getTicketSummary,
} from "../controllers/support.controller";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// Resumo dos chamados
router.get("/summary", getTicketSummary);

// Listar chamados do usuário
router.get("/", listTickets);

// Abrir chamado
router.post("/", createTicket);

// Consultar detalhes de um chamado
router.get("/:ticketId", getTicketDetails);

// Enviar mensagem
router.post("/:ticketId/messages", sendTicketMessage);

// Fechar chamado
router.patch("/:ticketId/close", closeTicket);

export default router;
