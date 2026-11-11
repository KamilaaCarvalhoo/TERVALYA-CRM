
import type { Request, Response } from "express";
import { DealStatus } from "@prisma/client";

import {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../services/deal.service";

// ======================================
// PARÂMETROS DA REQUISIÇÃO
// ======================================

function getParamId(req: Request): string {
  const id = req.params.id;

  if (Array.isArray(id)) {
    return id[0] ?? "";
  }

  return id ?? "";
}

// ======================================
// IDENTIFICAÇÃO DO USUÁRIO E EMPRESA
// ======================================

function getTenant(req: Request) {
  const userId = req.userId;
  const companyId = req.companyId;

  if (!userId || !companyId) {
    throw new Error("Usuário ou empresa não identificados.");
  }

  return { userId, companyId };
}

// ======================================
// VALIDAÇÃO DE DATA
// ======================================

function validExpectedAt(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error("Data prevista inválida.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data prevista inválida.");
  }

  return date;
}

// ======================================
// LISTAR NEGOCIAÇÕES
// ======================================

export async function index(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);

    const deals = await listDeals(companyId);

    return res.json(deals);
  } catch (error) {
    console.error("Erro ao listar negociações:", error);

    return res.status(500).json({
      message: "Não foi possível carregar as negociações.",
    });
  }
}

// ======================================
// BUSCAR NEGOCIAÇÃO POR ID
// ======================================

export async function show(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador da negociação inválido.",
      });
    }

    const deal = await getDealById(id, companyId);

    if (!deal) {
      return res.status(404).json({
        message: "Negociação não encontrada.",
      });
    }

    return res.json(deal);
  } catch (error) {
    console.error("Erro ao buscar negociação:", error);

    return res.status(500).json({
      message: "Não foi possível buscar a negociação.",
    });
  }
}

// ======================================
// CADASTRAR NEGOCIAÇÃO
// ======================================

export async function store(req: Request, res: Response) {
  try {
    const { userId, companyId } = getTenant(req);

    const {
      title,
      value,
      probability,
      stage,
      expectedAt,
      clientId,
    } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      title.trim().length > 150
    ) {
      return res.status(400).json({
        message: "Informe um título válido para a negociação.",
      });
    }

    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      return res.status(400).json({
        message: "Informe um valor numérico válido.",
      });
    }

    if (
      probability !== undefined &&
      (!Number.isInteger(probability) ||
        probability < 0 ||
        probability > 100)
    ) {
      return res.status(400).json({
        message: "A probabilidade deve ser um número inteiro entre 0 e 100.",
      });
    }

    if (typeof clientId !== "string" || !clientId.trim()) {
      return res.status(400).json({
        message: "Selecione um cliente para a negociação.",
      });
    }

    if (
      stage !== undefined &&
      (typeof stage !== "string" ||
        !stage.trim() ||
        stage.trim().length > 50)
    ) {
      return res.status(400).json({
        message: "Informe uma etapa válida.",
      });
    }

    const parsedDate = validExpectedAt(expectedAt);

    const deal = await createDeal(
      {
        title: title.trim(),
        value,
        probability,
        stage: stage?.trim(),
        expectedAt: parsedDate,
        clientId,
      },
      userId,
      companyId
    );

    return res.status(201).json({
      message: "Negociação cadastrada com sucesso.",
      deal,
    });
  } catch (error) {
    console.error("Erro ao criar negociação:", error);

    if (
      error instanceof Error &&
      error.message.includes("Cliente não encontrado")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Data prevista inválida."
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Não foi possível cadastrar a negociação.",
    });
  }
}

// ======================================
// ATUALIZAR NEGOCIAÇÃO
// ======================================

export async function update(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador da negociação inválido.",
      });
    }

    const {
      title,
      value,
      probability,
      status,
      stage,
      expectedAt,
      clientId,
    } = req.body;

    if (
      title !== undefined &&
      (typeof title !== "string" ||
        !title.trim() ||
        title.trim().length > 150)
    ) {
      return res.status(400).json({
        message: "Informe um título válido.",
      });
    }

    if (
      value !== undefined &&
      (typeof value !== "number" ||
        !Number.isFinite(value) ||
        value < 0)
    ) {
      return res.status(400).json({
        message: "Informe um valor numérico válido.",
      });
    }

    if (
      probability !== undefined &&
      (!Number.isInteger(probability) ||
        probability < 0 ||
        probability > 100)
    ) {
      return res.status(400).json({
        message: "A probabilidade deve estar entre 0 e 100.",
      });
    }

    if (
      status !== undefined &&
      !Object.values(DealStatus).includes(status)
    ) {
      return res.status(400).json({
        message: "Status da negociação inválido.",
      });
    }

    if (
      stage !== undefined &&
      (typeof stage !== "string" ||
        !stage.trim() ||
        stage.trim().length > 50)
    ) {
      return res.status(400).json({
        message: "Etapa inválida.",
      });
    }

    if (
      clientId !== undefined &&
      (typeof clientId !== "string" || !clientId.trim())
    ) {
      return res.status(400).json({
        message: "Cliente inválido.",
      });
    }

    const parsedDate = validExpectedAt(expectedAt);

    const data = {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(value !== undefined ? { value } : {}),
      ...(probability !== undefined ? { probability } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(stage !== undefined ? { stage: stage.trim() } : {}),
      ...(expectedAt !== undefined ? { expectedAt: parsedDate } : {}),
      ...(clientId !== undefined ? { clientId } : {}),
    };

    const deal = await updateDeal(id, companyId, data);

    return res.json({
      message: "Negociação atualizada com sucesso.",
      deal,
    });
  } catch (error) {
    console.error("Erro ao atualizar negociação:", error);

    if (
      error instanceof Error &&
      error.message.includes("não encontrada")
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("Cliente não encontrado")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message === "Data prevista inválida."
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Não foi possível atualizar a negociação.",
    });
  }
}

// ======================================
// EXCLUIR NEGOCIAÇÃO
// ======================================

export async function destroy(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador da negociação inválido.",
      });
    }

    await deleteDeal(id, companyId);

    return res.json({
      message: "Negociação excluída com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir negociação:", error);

    if (
      error instanceof Error &&
      error.message === "Negociação não encontrada."
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Não foi possível excluir a negociação.",
    });
  }
}
