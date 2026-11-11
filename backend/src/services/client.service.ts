
import prisma from "../lib/prisma";

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
}

export interface UpdateClientData {
  name?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  notes?: string | null;
  status?: string;
}

export async function listClients(companyId: string) {
  return prisma.client.findMany({
    where: {
      companyId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getClientById(
  clientId: string,
  companyId: string
) {
  return prisma.client.findFirst({
    where: {
      id: clientId,
      companyId,
    },
  });
}

export async function createClient(
  data: CreateClientData,
  userId: string,
  companyId: string
) {
  return prisma.client.create({
    data: {
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      company: data.company?.trim() || null,
      notes: data.notes?.trim() || null,
      userId,
      companyId,
    },
  });
}

export async function updateClient(
  clientId: string,
  companyId: string,
  data: UpdateClientData
) {
  const result = await prisma.client.updateMany({
    where: {
      id: clientId,
      companyId,
    },
    data: {
      ...(data.name !== undefined && {
        name: data.name.trim(),
      }),
      ...(data.email !== undefined && {
        email: data.email?.trim() || null,
      }),
      ...(data.phone !== undefined && {
        phone: data.phone?.trim() || null,
      }),
      ...(data.company !== undefined && {
        company: data.company?.trim() || null,
      }),
      ...(data.notes !== undefined && {
        notes: data.notes?.trim() || null,
      }),
      ...(data.status !== undefined && {
        status: data.status,
      }),
    },
  });

  if (result.count === 0) {
    return null;
  }

  return getClientById(clientId, companyId);
}

export async function deleteClient(
  clientId: string,
  companyId: string
) {
  const result = await prisma.client.deleteMany({
    where: {
      id: clientId,
      companyId,
    },
  });

  return result.count > 0;
}
