
import {
  AppointmentStatus,
  Prisma,
} from "@prisma/client";

import prisma from "../lib/prisma";

export interface CreateAppointmentData {
  title: string;
  description?: string | null;
  startAt: Date;
  endAt?: Date | null;
  status?: AppointmentStatus;
  location?: string | null;
  reminderAt?: Date | null;
  clientId?: string | null;
  dealId?: string | null;
}

export interface UpdateAppointmentData {
  title?: string;
  description?: string | null;
  startAt?: Date;
  endAt?: Date | null;
  status?: AppointmentStatus;
  location?: string | null;
  reminderAt?: Date | null;
  clientId?: string | null;
  dealId?: string | null;
}

const appointmentInclude = {
  client: {
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
    },
  },
  deal: {
    select: {
      id: true,
      title: true,
      value: true,
      status: true,
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.AppointmentInclude;

async function validateRelations(
  companyId: string,
  clientId?: string | null,
  dealId?: string | null,
) {
  if (clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        companyId,
      },
      select: { id: true },
    });

    if (!client) {
      throw new Error("Cliente não encontrado nesta empresa.");
    }
  }

  if (dealId) {
    const deal = await prisma.deal.findFirst({
      where: {
        id: dealId,
        companyId,
      },
      select: {
        id: true,
        clientId: true,
      },
    });

    if (!deal) {
      throw new Error("Negociação não encontrada nesta empresa.");
    }

    if (clientId && deal.clientId !== clientId) {
      throw new Error(
        "A negociação selecionada não pertence ao cliente informado.",
      );
    }

    return deal;
  }

  return null;
}

export async function listAppointments(
  companyId: string,
  startAt?: Date,
  endAt?: Date,
) {
  return prisma.appointment.findMany({
    where: {
      companyId,
      ...(startAt || endAt
        ? {
            startAt: {
              ...(startAt ? { gte: startAt } : {}),
              ...(endAt ? { lte: endAt } : {}),
            },
          }
        : {}),
    },
    include: appointmentInclude,
    orderBy: {
      startAt: "asc",
    },
  });
}

export async function getAppointmentById(
  id: string,
  companyId: string,
) {
  return prisma.appointment.findFirst({
    where: {
      id,
      companyId,
    },
    include: appointmentInclude,
  });
}

export async function createAppointment(
  data: CreateAppointmentData,
  userId: string,
  companyId: string,
) {
  if (data.endAt && data.endAt <= data.startAt) {
    throw new Error(
      "O horário de término deve ser posterior ao horário de início.",
    );
  }

  if (data.reminderAt && data.reminderAt > data.startAt) {
    throw new Error(
      "O lembrete deve acontecer antes do compromisso.",
    );
  }

  await validateRelations(
    companyId,
    data.clientId,
    data.dealId,
  );

  return prisma.appointment.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      startAt: data.startAt,
      endAt: data.endAt ?? null,
      status: data.status ?? AppointmentStatus.SCHEDULED,
      location: data.location ?? null,
      reminderAt: data.reminderAt ?? null,
      userId,
      companyId,
      clientId: data.clientId ?? null,
      dealId: data.dealId ?? null,
    },
    include: appointmentInclude,
  });
}

export async function updateAppointment(
  id: string,
  companyId: string,
  data: UpdateAppointmentData,
) {
  const existing = await prisma.appointment.findFirst({
    where: {
      id,
      companyId,
    },
  });

  if (!existing) {
    throw new Error("Compromisso não encontrado.");
  }

  const nextStartAt = data.startAt ?? existing.startAt;
  const nextEndAt =
    data.endAt === undefined ? existing.endAt : data.endAt;

  if (nextEndAt && nextEndAt <= nextStartAt) {
    throw new Error(
      "O horário de término deve ser posterior ao horário de início.",
    );
  }

  if (
    data.reminderAt &&
    data.reminderAt > nextStartAt
  ) {
    throw new Error(
      "O lembrete deve acontecer antes do compromisso.",
    );
  }

  const nextClientId =
    data.clientId === undefined
      ? existing.clientId
      : data.clientId;

  const nextDealId =
    data.dealId === undefined
      ? existing.dealId
      : data.dealId;

  await validateRelations(
    companyId,
    nextClientId,
    nextDealId,
  );

  const updateData: Prisma.AppointmentUncheckedUpdateInput = {
    ...(data.title !== undefined && { title: data.title }),
    ...(data.description !== undefined && {
      description: data.description,
    }),
    ...(data.startAt !== undefined && {
      startAt: data.startAt,
    }),
    ...(data.endAt !== undefined && {
      endAt: data.endAt,
    }),
    ...(data.status !== undefined && {
      status: data.status,
    }),
    ...(data.location !== undefined && {
      location: data.location,
    }),
    ...(data.reminderAt !== undefined && {
      reminderAt: data.reminderAt,
      reminderSentAt: null,
    }),
    ...(data.clientId !== undefined && {
      clientId: data.clientId,
    }),
    ...(data.dealId !== undefined && {
      dealId: data.dealId,
    }),
  };

  return prisma.appointment.update({
    where: { id },
    data: updateData,
    include: appointmentInclude,
  });
}

export async function deleteAppointment(
  id: string,
  companyId: string,
) {
  const existing = await prisma.appointment.findFirst({
    where: {
      id,
      companyId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    throw new Error("Compromisso não encontrado.");
  }

  return prisma.appointment.delete({
    where: { id },
  });
}
