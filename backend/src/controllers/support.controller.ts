
import type { Request, Response } from "express";

import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@prisma/client";

import {
  createSupportTicket,
  listSupportTickets,
  getSupportTicket,
  addSupportTicketMessage,
  closeSupportTicket,
  getSupportTicketSummary,
} from "../services/support.service";

// ======================================
// DADOS DO USUÁRIO AUTENTICADO
// ======================================

function getAuthenticatedData(req: Request) {
  return {
    userId: req.userId,
    companyId: req.companyId,
  };
}

// ======================================
// OBTER PARÂMETRO DA ROTA
// ======================================

function getTicketId(req: Request): string {
  const param = req.params.ticketId;

  if (Array.isArray(param)) {
    return param[0] ?? "";
  }

  return param ?? "";
}

// ======================================
// ABRIR CHAMADO
// ======================================

export async function createTicket(req: Request, res: Response) {
  try {
    const { userId, companyId } = getAuthenticatedData(req);

    if (!userId || !companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não identificados.",
      });
    }

    const { subject, description, category, priority } = req.body;

    const allowedCategories = Object.values(SupportTicketCategory);
    const allowedPriorities = Object.values(SupportTicketPriority);

    if (
      category !== undefined &&
      !allowedCategories.includes(category)
    ) {
      return res.status(400).json({
        message: "Categoria de chamado inválida.",
      });
    }

    if (
      priority !== undefined &&
      !allowedPriorities.includes(priority)
    ) {
      return res.status(400).json({
        message: "Prioridade de chamado inválida.",
      });
    }

    if (
      typeof subject !== "string" ||
      typeof description !== "string"
    ) {
      return res.status(400).json({
        message: "Informe o assunto e a descrição do chamado.",
      });
    }

    const ticket = await createSupportTicket(
      userId,
      companyId,
      {
        subject,
        description,
        category,
        priority,
      }
    );

    return res.status(201).json({
      message: "Chamado aberto com sucesso.",
      ticket,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível abrir o chamado.";

    return res.status(400).json({ message });
  }
}

// ======================================
// LISTAR CHAMADOS
// ======================================

export async function listTickets(req: Request, res: Response) {
  try {
    const { userId, companyId } = getAuthenticatedData(req);

    if (!userId || !companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não identificados.",
      });
    }

    const status = req.query.status;

    if (
      status !== undefined &&
      (typeof status !== "string" ||
        !Object.values(SupportTicketStatus).includes(
          status as SupportTicketStatus
        ))
    ) {
      return res.status(400).json({
        message: "Status de chamado inválido.",
      });
    }

    const tickets = await listSupportTickets({
      userId,
      companyId,
      status: status as SupportTicketStatus | undefined,
    });

    return res.status(200).json({
      tickets,
      total: tickets.length,
    });
  } catch (error) {
    console.error("Erro ao listar chamados:", error);

    return res.status(500).json({
      message: "Não foi possível listar os chamados.",
    });
  }
}

// ======================================
// DETALHES DO CHAMADO
// ======================================

export async function getTicketDetails(
  req: Request,
  res: Response
) {
  try {
    const { userId, companyId } = getAuthenticatedData(req);
    const ticketId = getTicketId(req);

    if (!userId || !companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não identificados.",
      });
    }

    if (!ticketId) {
      return res.status(400).json({
        message: "Identificador do chamado inválido.",
      });
    }

    const ticket = await getSupportTicket({
      ticketId,
      userId,
      companyId,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Chamado não encontrado.",
      });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Erro ao consultar chamado:", error);

    return res.status(500).json({
      message: "Não foi possível consultar o chamado.",
    });
  }
}

// ======================================
// ENVIAR MENSAGEM
// ======================================

export async function sendTicketMessage(
  req: Request,
  res: Response
) {
  try {
    const { userId, companyId } = getAuthenticatedData(req);
    const ticketId = getTicketId(req);

    if (!userId || !companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não identificados.",
      });
    }

    if (!ticketId) {
      return res.status(400).json({
        message: "Identificador do chamado inválido.",
      });
    }

    const { message } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        message: "Digite uma mensagem antes de enviar.",
      });
    }

    const ticket = await addSupportTicketMessage({
      ticketId,
      userId,
      companyId,
      message,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Chamado não encontrado.",
      });
    }

    return res.status(201).json({
      message: "Mensagem enviada com sucesso.",
      ticket,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Não foi possível enviar a mensagem.";

    const statusCode =
      message.includes("encerrado") ||
      message.includes("não pode ficar") ||
      message.includes("no máximo")
        ? 400
        : 500;

    return res.status(statusCode).json({ message });
  }
}

// ======================================
// FECHAR CHAMADO
// ======================================

export async function closeTicket(req: Request, res: Response) {
  try {
    const { userId, companyId } = getAuthenticatedData(req);
    const ticketId = getTicketId(req);

    if (!userId || !companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não identificados.",
      });
    }

    if (!ticketId) {
      return res.status(400).json({
        message: "Identificador do chamado inválido.",
      });
    }

    const ticket = await closeSupportTicket({
      ticketId,
      userId,
      companyId,
    });

    if (!ticket) {
      return res.status(404).json({
        message: "Chamado não encontrado ou já fechado.",
      });
    }

    return res.status(200).json({
      message: "Chamado fechado com sucesso.",
      ticket,
    });
  } catch (error) {
    console.error("Erro ao fechar chamado:", error);

    return res.status(500).json({
      message: "Não foi possível fechar o chamado.",
    });
  }
}

// ======================================
// RESUMO DOS CHAMADOS
// ======================================

export async function getTicketSummary(
  req: Request,
  res: Response
) {
  try {
    const { userId, companyId } = getAuthenticatedData(req);

    if (!userId || !companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não identificados.",
      });
    }

    const summary = await getSupportTicketSummary(
      userId,
      companyId
    );

    return res.status(200).json({ summary });
  } catch (error) {
    console.error("Erro ao gerar resumo dos chamados:", error);

    return res.status(500).json({
      message: "Não foi possível gerar o resumo dos chamados.",
    });
  }
}
