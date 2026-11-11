
import type { Request, Response } from "express";

import {
  listClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
} from "../services/client.service";

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
  const { userId, companyId } = req;

  if (!userId || !companyId) {
    res.status(401).json({
      message: "Usuário ou empresa não identificados.",
    });

    return null;
  }

  return {
    userId,
    companyId,
  };
}

// ======================================
// LISTAR CLIENTES
// ======================================

export async function index(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  try {
    const clients = await listClients(tenant.companyId);

    return res.json(clients);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);

    return res.status(500).json({
      message: "Erro ao buscar clientes.",
    });
  }
}

// ======================================
// BUSCAR CLIENTE POR ID
// ======================================

export async function show(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  try {
    const clientId = getParamId(req);

    if (!clientId) {
      return res.status(400).json({
        message: "Identificador do cliente inválido.",
      });
    }

    const client = await getClientById(
      clientId,
      tenant.companyId
    );

    if (!client) {
      return res.status(404).json({
        message: "Cliente não encontrado.",
      });
    }

    return res.json(client);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);

    return res.status(500).json({
      message: "Erro ao buscar cliente.",
    });
  }
}

// ======================================
// CADASTRAR CLIENTE
// ======================================

export async function store(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  const {
    name,
    email,
    phone,
    company,
    notes,
  } = req.body;

  if (
    typeof name !== "string" ||
    name.trim().length < 2 ||
    name.trim().length > 150
  ) {
    return res.status(400).json({
      message: "Informe um nome válido para o cliente.",
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
    [phone, company, notes].some(
      (value) =>
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
    )
  ) {
    return res.status(400).json({
      message: "Dados do cliente inválidos.",
    });
  }

  try {
    const client = await createClient(
      {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        notes: notes?.trim() || null,
      },
      tenant.userId,
      tenant.companyId
    );

    return res.status(201).json(client);
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);

    return res.status(500).json({
      message: "Erro ao cadastrar cliente.",
    });
  }
}

// ======================================
// ATUALIZAR CLIENTE
// ======================================

export async function update(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  const {
    name,
    email,
    phone,
    company,
    notes,
    status,
  } = req.body;

  if (
    name !== undefined &&
    (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 150
    )
  ) {
    return res.status(400).json({
      message: "Informe um nome válido.",
    });
  }

  if (
    [email, phone, company, notes].some(
      (value) =>
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
    )
  ) {
    return res.status(400).json({
      message: "Dados do cliente inválidos.",
    });
  }

  if (
    status !== undefined &&
    typeof status !== "string"
  ) {
    return res.status(400).json({
      message: "Status inválido.",
    });
  }

  try {
    const clientId = getParamId(req);

    if (!clientId) {
      return res.status(400).json({
        message: "Identificador do cliente inválido.",
      });
    }

    const client = await updateClient(
      clientId,
      tenant.companyId,
      {
        ...(name !== undefined ? { name: name.trim() } : {}),
        ...(email !== undefined ? { email: email?.trim() || null } : {}),
        ...(phone !== undefined ? { phone: phone?.trim() || null } : {}),
        ...(company !== undefined ? { company: company?.trim() || null } : {}),
        ...(notes !== undefined ? { notes: notes?.trim() || null } : {}),
        ...(status !== undefined ? { status } : {}),
      }
    );

    if (!client) {
      return res.status(404).json({
        message: "Cliente não encontrado.",
      });
    }

    return res.json(client);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);

    return res.status(500).json({
      message: "Erro ao atualizar cliente.",
    });
  }
}

// ======================================
// EXCLUIR CLIENTE
// ======================================

export async function destroy(req: Request, res: Response) {
  const tenant = getTenant(req, res);

  if (!tenant) return;

  try {
    const clientId = getParamId(req);

    if (!clientId) {
      return res.status(400).json({
        message: "Identificador do cliente inválido.",
      });
    }

    const deleted = await deleteClient(
      clientId,
      tenant.companyId
    );

    if (!deleted) {
      return res.status(404).json({
        message: "Cliente não encontrado.",
      });
    }

    return res.status(204).send();
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);

    return res.status(500).json({
      message:
        "Não foi possível excluir o cliente. Verifique se existem registros relacionados.",
    });
  }
}
