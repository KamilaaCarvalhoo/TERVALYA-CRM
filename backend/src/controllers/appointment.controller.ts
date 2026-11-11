
import type { Request, Response } from "express";
import {
  AppointmentStatus,
} from "@prisma/client";

import {
  listAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../services/appointment.service";

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id ?? "";
}

function getTenant(req: Request) {
  if (!req.userId || !req.companyId) {
    throw new Error("Usuário ou empresa não identificados.");
  }

  return {
    userId: req.userId,
    companyId: req.companyId,
  };
}

function parseDate(value: unknown): Date | undefined {
  if (value === undefined) return undefined;

  if (value === null || value === "") {
    throw new Error("Data inválida.");
  }

  if (typeof value !== "string") {
    throw new Error("A data deve estar em formato válido.");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Data inválida.");
  }

  return date;
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  return parseDate(value) ?? null;
}

function parseOptionalString(
  value: unknown,
  fieldName: string,
): string | null | undefined {
  if (value === undefined) return undefined;

  if (value === null || value === "") return null;

  if (typeof value !== "string") {
    throw new Error(`${fieldName} inválido.`);
  }

  return value.trim() || null;
}

function validateStatus(value: unknown): AppointmentStatus {
  if (
    typeof value !== "string" ||
    !Object.values(AppointmentStatus).includes(
      value as AppointmentStatus,
    )
  ) {
    throw new Error("Status do compromisso inválido.");
  }

  return value as AppointmentStatus;
}

function handleError(res: Response, error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : "Erro interno ao processar compromisso.";

  const status = message.includes("não encontrado")
    ? 404
    : 400;

  return res.status(status).json({ message });
}

export async function index(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);

    const startAt = parseDate(req.query.startAt);
    const endAt = parseDate(req.query.endAt);

    if (startAt && endAt && endAt < startAt) {
      return res.status(400).json({
        message: "O período final deve ser posterior ao inicial.",
      });
    }

    const appointments = await listAppointments(
      companyId,
      startAt,
      endAt,
    );

    return res.json(appointments);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function show(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador inválido.",
      });
    }

    const appointment = await getAppointmentById(id, companyId);

    if (!appointment) {
      return res.status(404).json({
        message: "Compromisso não encontrado.",
      });
    }

    return res.json(appointment);
  } catch (error) {
    return handleError(res, error);
  }
}

export async function store(req: Request, res: Response) {
  try {
    const { userId, companyId } = getTenant(req);

    const {
      title,
      description,
      startAt,
      endAt,
      status,
      location,
      reminderAt,
      clientId,
      dealId,
    } = req.body;

    if (
      typeof title !== "string" ||
      title.trim().length < 2 ||
      title.trim().length > 150
    ) {
      return res.status(400).json({
        message: "O título deve ter entre 2 e 150 caracteres.",
      });
    }

    const parsedStartAt = parseDate(startAt);

    if (!parsedStartAt) {
      return res.status(400).json({
        message: "Informe a data e o horário de início.",
      });
    }

    const appointment = await createAppointment(
      {
        title: title.trim(),
        description: parseOptionalString(
          description,
          "Descrição",
        ),
        startAt: parsedStartAt,
        endAt: parseOptionalDate(endAt),
        status:
          status === undefined
            ? AppointmentStatus.SCHEDULED
            : validateStatus(status),
        location: parseOptionalString(location, "Local"),
        reminderAt: parseOptionalDate(reminderAt),
        clientId: parseOptionalString(clientId, "Cliente"),
        dealId: parseOptionalString(dealId, "Negociação"),
      },
      userId,
      companyId,
    );

    return res.status(201).json({
      message: "Compromisso cadastrado com sucesso!",
      appointment,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function update(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador inválido.",
      });
    }

    const {
      title,
      description,
      startAt,
      endAt,
      status,
      location,
      reminderAt,
      clientId,
      dealId,
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
        message: "O título deve ter entre 2 e 150 caracteres.",
      });
    }

    const parsedStartAt = parseDate(startAt);

    const appointment = await updateAppointment(id, companyId, {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && {
        description: parseOptionalString(
          description,
          "Descrição",
        ),
      }),
      ...(startAt !== undefined && {
        startAt: parsedStartAt!,
      }),
      ...(endAt !== undefined && {
        endAt: parseOptionalDate(endAt),
      }),
      ...(status !== undefined && {
        status: validateStatus(status),
      }),
      ...(location !== undefined && {
        location: parseOptionalString(location, "Local"),
      }),
      ...(reminderAt !== undefined && {
        reminderAt: parseOptionalDate(reminderAt),
      }),
      ...(clientId !== undefined && {
        clientId: parseOptionalString(clientId, "Cliente"),
      }),
      ...(dealId !== undefined && {
        dealId: parseOptionalString(dealId, "Negociação"),
      }),
    });

    return res.json({
      message: "Compromisso atualizado com sucesso!",
      appointment,
    });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const { companyId } = getTenant(req);
    const id = getParamId(req);

    if (!id) {
      return res.status(400).json({
        message: "Identificador inválido.",
      });
    }

    await deleteAppointment(id, companyId);

    return res.json({
      message: "Compromisso excluído com sucesso!",
    });
  } catch (error) {
    return handleError(res, error);
  }
}
