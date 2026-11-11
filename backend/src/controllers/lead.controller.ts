
import type { Request, Response } from "express";
import {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  convertLeadToClient,
} from "../services/lead.service";

const validStatuses = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "LOST",
  "CONVERTED",
] as const;

type LeadStatusValue = (typeof validStatuses)[number];

function getTenant(req: Request, res: Response) {
  const { userId, companyId } = req;

  if (!userId || !companyId) {
    res.status(401).json({
      message: "Usuário ou empresa não identificados.",
    });
    return null;
  }

  return { userId, companyId };
}

function getParamId(req: Request) {
  const value = req.params.id;
  return Array.isArray(value) ? value[0] : value;
}

function isValidScore(score: unknown): score is number {
  return (
    typeof score === "number" &&
    Number.isInteger(score) &&
    score >= 0 &&
    score <= 100
  );
}

export async function index(req: Request, res: Response) {
  const tenant = getTenant(req, res);
  if (!tenant) return;

  try {
    const leads = await listLeads(tenant.companyId);
    return res.json(leads);
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return res.status(500).json({
      message: "Erro ao buscar leads.",
    });
  }
}

export async function show(req: Request, res: Response) {
  const tenant = getTenant(req, res);
  if (!tenant) return;

  try {
    const lead = await getLeadById(
      getParamId(req),
      tenant.companyId
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead não encontrado.",
      });
    }

    return res.json(lead);
  } catch (error) {
    console.error("Erro ao buscar lead:", error);
    return res.status(500).json({
      message: "Erro ao buscar lead.",
    });
  }
}

export async function store(req: Request, res: Response) {
  const tenant = getTenant(req, res);
  if (!tenant) return;

  const { name, email, phone, source, score } = req.body;

  if (typeof name !== "string" || name.trim().length < 2) {
    return res.status(400).json({
      message: "Informe um nome válido para o lead.",
    });
  }

  if (
    email !== undefined &&
    email !== null &&
    typeof email !== "string"
  ) {
    return res.status(400).json({
      message: "E-mail inválido.",
    });
  }

  if (
    score !== undefined &&
    !isValidScore(score)
  ) {
    return res.status(400).json({
      message: "A pontuação deve ser um número inteiro entre 0 e 100.",
    });
  }

  try {
    const lead = await createLead(
      { name, email, phone, source, score },
      tenant.userId,
      tenant.companyId
    );

    return res.status(201).json(lead);
  } catch (error) {
    console.error("Erro ao cadastrar lead:", error);
    return res.status(500).json({
      message: "Erro ao cadastrar lead.",
    });
  }
}

export async function update(req: Request, res: Response) {
  const tenant = getTenant(req, res);
  if (!tenant) return;

  const { name, email, phone, source, status, score } = req.body;

  if (
    name !== undefined &&
    (typeof name !== "string" || name.trim().length < 2)
  ) {
    return res.status(400).json({
      message: "Informe um nome válido.",
    });
  }

  if (
    status !== undefined &&
    !validStatuses.includes(status as LeadStatusValue)
  ) {
    return res.status(400).json({
      message: "Status inválido.",
    });
  }

  if (
    score !== undefined &&
    !isValidScore(score)
  ) {
    return res.status(400).json({
      message: "A pontuação deve ser um número inteiro entre 0 e 100.",
    });
  }

  try {
    const lead = await updateLead(
      getParamId(req),
      tenant.companyId,
      { name, email, phone, source, status, score }
    );

    if (!lead) {
      return res.status(404).json({
        message: "Lead não encontrado.",
      });
    }

    return res.json(lead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return res.status(500).json({
      message: "Erro ao atualizar lead.",
    });
  }
}

export async function destroy(req: Request, res: Response) {
  const tenant = getTenant(req, res);
  if (!tenant) return;

  try {
    const deleted = await deleteLead(
      getParamId(req),
      tenant.companyId
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Lead não encontrado.",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return res.status(500).json({
      message: "Não foi possível excluir o lead.",
    });
  }
}

export async function convert(req: Request, res: Response) {
  const tenant = getTenant(req, res);
  if (!tenant) return;

  try {
    const result = await convertLeadToClient(
      getParamId(req),
      tenant.userId,
      tenant.companyId
    );

    if (!result) {
      return res.status(404).json({
        message: "Lead não encontrado.",
      });
    }

    return res.status(201).json({
      message: "Lead convertido em cliente com sucesso.",
      ...result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Este lead já foi convertido."
    ) {
      return res.status(409).json({
        message: error.message,
      });
    }

    console.error("Erro ao converter lead:", error);
    return res.status(500).json({
      message: "Não foi possível converter o lead.",
    });
  }
}
