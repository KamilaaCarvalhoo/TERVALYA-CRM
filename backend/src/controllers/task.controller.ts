
import type { Request, Response } from "express";
import { TaskPriority, TaskStatus } from "@prisma/client";

import {
  listTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../services/task.service";

// ======================================
// IDENTIFICAR PARÂMETRO DA ROTA
// ======================================

function getParamId(req: Request): string {
  const id = req.params.id;

  if (Array.isArray(id)) {
    return id[0] ?? "";
  }

  return id ?? "";
}

// ======================================
// IDENTIFICAR USUÁRIO E EMPRESA
// ======================================

function getTenant(req: Request, res: Response) {
  const userId = req.userId;
  const companyId = req.companyId;

  if (!userId || !companyId) {
    res.status(401).json({
      message: "Usuário ou empresa não identificados.",
    });

    return null;
  }

  return { userId, companyId };
}

// ======================================
// VALIDAR DATA
// ======================================

function parseDueDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error("Data de vencimento inválida.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data de vencimento inválida.");
  }

  return date;
}

// ======================================
// LISTAR TAREFAS
// ======================================

export async function index(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  try {
    const tasks = await listTasks(tenant.companyId);

    return res.json(tasks);
  } catch (error) {
    console.error("Erro ao listar tarefas:", error);

    return res.status(500).json({
      message: "Não foi possível carregar as tarefas.",
    });
  }
}

// ======================================
// BUSCAR TAREFA POR ID
// ======================================

export async function show(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  try {
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador da tarefa inválido.",
      });
    }

    const task = await getTaskById(id, tenant.companyId);

    if (!task) {
      return res.status(404).json({
        message: "Tarefa não encontrada.",
      });
    }

    return res.json(task);
  } catch (error) {
    console.error("Erro ao buscar tarefa:", error);

    return res.status(500).json({
      message: "Não foi possível buscar a tarefa.",
    });
  }
}

// ======================================
// CADASTRAR TAREFA
// ======================================

export async function store(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  const {
    title,
    description,
    priority,
    dueDate,
    clientId,
  } = req.body;

  if (
    typeof title !== "string" ||
    title.trim().length < 2 ||
    title.trim().length > 150
  ) {
    return res.status(400).json({
      message: "Informe um título válido para a tarefa.",
    });
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      message: "Descrição inválida.",
    });
  }

  if (
    priority !== undefined &&
    !Object.values(TaskPriority).includes(priority)
  ) {
    return res.status(400).json({
      message: "Prioridade inválida.",
    });
  }

  if (
    clientId !== undefined &&
    clientId !== null &&
    (typeof clientId !== "string" || !clientId.trim())
  ) {
    return res.status(400).json({
      message: "Cliente inválido.",
    });
  }

  try {
    const parsedDate = parseDueDate(dueDate);

    const task = await createTask(
      {
        title: title.trim(),
        description: description?.trim() || null,
        priority,
        dueDate: parsedDate,
        clientId: clientId || null,
      },
      tenant.userId,
      tenant.companyId
    );

    return res.status(201).json({
      message: "Tarefa cadastrada com sucesso.",
      task,
    });
  } catch (error) {
    console.error("Erro ao cadastrar tarefa:", error);

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
      error.message === "Data de vencimento inválida."
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Não foi possível cadastrar a tarefa.",
    });
  }
}

// ======================================
// ATUALIZAR TAREFA
// ======================================

export async function update(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  const {
    title,
    description,
    status,
    priority,
    dueDate,
    clientId,
  } = req.body;

  if (
    title !== undefined &&
    (
      typeof title !== "string" ||
      title.trim().length < 2 ||
      title.trim().length > 150
    )
  ) {
    return res.status(400).json({
      message: "Informe um título válido.",
    });
  }

  if (
    description !== undefined &&
    description !== null &&
    typeof description !== "string"
  ) {
    return res.status(400).json({
      message: "Descrição inválida.",
    });
  }

  if (
    status !== undefined &&
    !Object.values(TaskStatus).includes(status)
  ) {
    return res.status(400).json({
      message: "Status inválido.",
    });
  }

  if (
    priority !== undefined &&
    !Object.values(TaskPriority).includes(priority)
  ) {
    return res.status(400).json({
      message: "Prioridade inválida.",
    });
  }

  if (
    clientId !== undefined &&
    clientId !== null &&
    (typeof clientId !== "string" || !clientId.trim())
  ) {
    return res.status(400).json({
      message: "Cliente inválido.",
    });
  }

  try {
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador da tarefa inválido.",
      });
    }

    const parsedDate = parseDueDate(dueDate);

    const data = {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(description !== undefined
        ? { description: description?.trim() || null }
        : {}),
      ...(status !== undefined ? { status } : {}),
      ...(priority !== undefined ? { priority } : {}),
      ...(dueDate !== undefined ? { dueDate: parsedDate } : {}),
      ...(clientId !== undefined ? { clientId: clientId || null } : {}),
    };

    const task = await updateTask(
      id,
      tenant.companyId,
      data
    );

    return res.json({
      message: "Tarefa atualizada com sucesso.",
      task,
    });
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);

    if (
      error instanceof Error &&
      error.message === "Tarefa não encontrada."
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
      error.message === "Data de vencimento inválida."
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Não foi possível atualizar a tarefa.",
    });
  }
}

// ======================================
// EXCLUIR TAREFA
// ======================================

export async function destroy(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  try {
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador da tarefa inválido.",
      });
    }

    await deleteTask(id, tenant.companyId);

    return res.json({
      message: "Tarefa excluída com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);

    if (
      error instanceof Error &&
      error.message === "Tarefa não encontrada."
    ) {
      return res.status(404).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Não foi possível excluir a tarefa.",
    });
  }
}
