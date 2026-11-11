
import { LeadStatus, Prisma } from "@prisma/client";
import prisma from "../lib/prisma";

export interface CreateLeadData {
  name: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  score?: number;
}

export interface UpdateLeadData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: LeadStatus;
  score?: number;
}

export async function listLeads(companyId: string) {
  return prisma.lead.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          company: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getLeadById(
  id: string,
  companyId: string
) {
  return prisma.lead.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      client: true,
    },
  });
}

export async function createLead(
  data: CreateLeadData,
  userId: string,
  companyId: string
) {
  return prisma.lead.create({
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      source: data.source?.trim() || null,
      score: data.score ?? 0,
      status: "NEW",
      userId,
      companyId,
    },
  });
}

export async function updateLead(
  id: string,
  companyId: string,
  data: UpdateLeadData
) {
  const existing = await prisma.lead.findFirst({
    where: { id, companyId },
    select: { id: true },
  });

  if (!existing) return null;

  return prisma.lead.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.email !== undefined && {
        email: data.email?.trim() || null,
      }),
      ...(data.phone !== undefined && {
        phone: data.phone?.trim() || null,
      }),
      ...(data.source !== undefined && {
        source: data.source?.trim() || null,
      }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.score !== undefined && { score: data.score }),
    },
  });
}

export async function deleteLead(
  id: string,
  companyId: string
) {
  const existing = await prisma.lead.findFirst({
    where: { id, companyId },
    select: { id: true },
  });

  if (!existing) return false;

  await prisma.lead.delete({
    where: { id },
  });

  return true;
}

export async function convertLeadToClient(
  id: string,
  userId: string,
  companyId: string
) {
  return prisma.$transaction(async (transaction) => {
    const lead = await transaction.lead.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!lead) {
      return null;
    }

    if (lead.status === "CONVERTED" || lead.clientId) {
      throw new Error("Este lead já foi convertido.");
    }

    const client = await transaction.client.create({
      data: {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        companyId,
        userId,
        status: "ACTIVE",
      },
    });

    const updatedLead = await transaction.lead.update({
      where: { id: lead.id },
      data: {
        status: "CONVERTED",
        clientId: client.id,
      },
    });

    return {
      lead: updatedLead,
      client,
    };
  });
}
