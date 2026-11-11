
import {
  Prisma,
  TaskPriority,
  TaskStatus,
} from "@prisma/client";

import prisma from "../lib/prisma";

export interface CreateTaskData {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
  clientId?: string | null;
}

export interface UpdateTaskData {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  clientId?: string | null;
}

export async function listTasks(companyId: string) {
  return prisma.task.findMany({
    where: { companyId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [
      { status: "asc" },
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function getTaskById(
  id: string,
  companyId: string
) {
  return prisma.task.findFirst({
    where: {
      id,
      companyId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
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

export async function createTask(
  data: CreateTaskData,
  userId: string,
  companyId: string
) {
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

  return prisma.task.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      priority: data.priority ?? TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      dueDate: data.dueDate ?? null,
      clientId: data.clientId ?? null,
      userId,
      companyId,
    },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function updateTask(
  id: string,
  companyId: string,
  data: UpdateTaskData
) {
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      companyId,
    },
    select: { id: true },
  });

  if (!existingTask) {
    throw new Error("Tarefa não encontrada.");
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

  const updateData: Prisma.TaskUncheckedUpdateInput = {
    ...data,
  };

  return prisma.task.update({
    where: { id },
    data: updateData,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

export async function deleteTask(
  id: string,
  companyId: string
) {
  const existingTask = await prisma.task.findFirst({
    where: {
      id,
      companyId,
    },
    select: { id: true },
  });

  if (!existingTask) {
    throw new Error("Tarefa não encontrada.");
  }

  return prisma.task.delete({
    where: { id },
  });
}
