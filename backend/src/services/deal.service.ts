
import { DealStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export interface CreateDealData {
  title: string;
  value: number;
  probability?: number;
  stage?: string;
  expectedAt?: Date | null;
  clientId: string;
}

export interface UpdateDealData {
  title?: string;
  value?: number;
  probability?: number;
  status?: DealStatus;
  stage?: string;
  expectedAt?: Date | null;
  clientId?: string;
}

export async function listDeals(companyId: string) {
  return prisma.deal.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDealById(id: string, companyId: string) {
  return prisma.deal.findFirst({
    where: { id, companyId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

export async function createDeal(
  data: CreateDealData,
  userId: string,
  companyId: string
) {
  const client = await prisma.client.findFirst({
    where: {
      id: data.clientId,
      companyId,
    },
    select: { id: true },
  });

  if (!client) {
    throw new Error("Cliente não encontrado nesta empresa.");
  }

  return prisma.deal.create({
    data: {
      title: data.title,
      value: new Prisma.Decimal(data.value),
      probability: data.probability ?? 0,
      status: DealStatus.OPEN,
      stage: data.stage ?? "PROSPECTION",
      expectedAt: data.expectedAt ?? null,
      clientId: data.clientId,
      userId,
      companyId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function updateDeal(
  id: string,
  companyId: string,
  data: UpdateDealData
) {
  const existingDeal = await prisma.deal.findFirst({
    where: { id, companyId },
    select: { id: true },
  });

  if (!existingDeal) {
    throw new Error("Negociação não encontrada.");
  }

  if (data.clientId) {
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        companyId,
      },
      select: { id: true },
    });

    if (!client) {
      throw new Error("Cliente não encontrado nesta empresa.");
    }
  }

  const updateData: Prisma.DealUncheckedUpdateInput = {
    ...data,
    ...(data.value !== undefined
      ? { value: new Prisma.Decimal(data.value) }
      : {}),
  };

  return prisma.deal.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
    },
  });
}

export async function deleteDeal(id: string, companyId: string) {
  const existingDeal = await prisma.deal.findFirst({
    where: { id, companyId },
    select: { id: true },
  });

  if (!existingDeal) {
    throw new Error("Negociação não encontrada.");
  }

  return prisma.deal.delete({
    where: { id },
  });
}
