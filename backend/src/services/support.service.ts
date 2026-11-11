
import {
  SupportTicketCategory,
  SupportTicketPriority,
  SupportTicketStatus,
  Prisma,
} from "@prisma/client";

import prisma from "../lib/prisma";

// ======================================
// TIPOS
// ======================================

interface CreateSupportTicketData {
  subject: string;
  description: string;
  category?: SupportTicketCategory;
  priority?: SupportTicketPriority;
}

interface ListSupportTicketsParams {
  userId: string;
  companyId: string;
  status?: SupportTicketStatus;
}

interface SupportTicketAccess {
  ticketId: string;
  userId: string;
  companyId: string;
}

// ======================================
// ABRIR CHAMADO
// ======================================

export async function createSupportTicket(
  userId: string,
  companyId: string,
  data: CreateSupportTicketData
) {
  const subject = data.subject.trim();
  const description = data.description.trim();

  if (!subject || !description) {
    throw new Error("Assunto e descrição são obrigatórios.");
  }

  if (subject.length > 150) {
    throw new Error("O assunto deve ter no máximo 150 caracteres.");
  }

  if (description.length > 5000) {
    throw new Error("A descrição deve ter no máximo 5000 caracteres.");
  }

  return prisma.supportTicket.create({
    data: {
      subject,
      description,
      category: data.category ?? SupportTicketCategory.GENERAL,
      priority: data.priority ?? SupportTicketPriority.NORMAL,
      requesterId: userId,
      companyId,
      messages: {
        create: {
          authorId: userId,
          message: description,
        },
      },
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      messages: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

// ======================================
// LISTAR CHAMADOS DO USUÁRIO
// ======================================

export async function listSupportTickets({
  userId,
  companyId,
  status,
}: ListSupportTicketsParams) {
  return prisma.supportTicket.findMany({
    where: {
      requesterId: userId,
      companyId,
      ...(status ? { status } : {}),
    },
    include: {
      _count: {
        select: {
          messages: true,
        },
      },
      messages: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          message: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

// ======================================
// CONSULTAR UM CHAMADO
// ======================================

export async function getSupportTicket({
  ticketId,
  userId,
  companyId,
}: SupportTicketAccess) {
  return prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      requesterId: userId,
      companyId,
    },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
      messages: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });
}

// ======================================
// ENVIAR MENSAGEM
// ======================================

export async function addSupportTicketMessage({
  ticketId,
  userId,
  companyId,
  message,
}: SupportTicketAccess & { message: string }) {
  const content = message.trim();

  if (!content) {
    throw new Error("A mensagem não pode ficar vazia.");
  }

  if (content.length > 5000) {
    throw new Error("A mensagem deve ter no máximo 5000 caracteres.");
  }

  return prisma.$transaction(async (transaction) => {
    const ticket = await transaction.supportTicket.findFirst({
      where: {
        id: ticketId,
        requesterId: userId,
        companyId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!ticket) {
      return null;
    }

    if (
      ticket.status === SupportTicketStatus.CLOSED ||
      ticket.status === SupportTicketStatus.RESOLVED
    ) {
      throw new Error(
        "Este chamado está encerrado. Abra um novo chamado para continuar."
      );
    }

    await transaction.supportTicketMessage.create({
      data: {
        ticketId,
        authorId: userId,
        message: content,
      },
    });

    return transaction.supportTicket.update({
      where: {
        id: ticketId,
      },
      data: {
        status: SupportTicketStatus.OPEN,
      },
      include: {
        messages: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
  });
}

// ======================================
// FECHAR CHAMADO PELO SOLICITANTE
// ======================================

export async function closeSupportTicket({
  ticketId,
  userId,
  companyId,
}: SupportTicketAccess) {
  const ticket = await prisma.supportTicket.findFirst({
    where: {
      id: ticketId,
      requesterId: userId,
      companyId,
      status: {
        not: SupportTicketStatus.CLOSED,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  if (!ticket) {
    return null;
  }

  return prisma.supportTicket.update({
    where: {
      id: ticketId,
    },
    data: {
      status: SupportTicketStatus.CLOSED,
    },
  });
}

// ======================================
// RESUMO DOS CHAMADOS DO USUÁRIO
// ======================================

export async function getSupportTicketSummary(
  userId: string,
  companyId: string
) {
  const [total, open, inProgress, waitingUser, resolved, closed] =
    await Promise.all([
      prisma.supportTicket.count({
        where: { requesterId: userId, companyId },
      }),

      prisma.supportTicket.count({
        where: {
          requesterId: userId,
          companyId,
          status: SupportTicketStatus.OPEN,
        },
      }),

      prisma.supportTicket.count({
        where: {
          requesterId: userId,
          companyId,
          status: SupportTicketStatus.IN_PROGRESS,
        },
      }),

      prisma.supportTicket.count({
        where: {
          requesterId: userId,
          companyId,
          status: SupportTicketStatus.WAITING_USER,
        },
      }),

      prisma.supportTicket.count({
        where: {
          requesterId: userId,
          companyId,
          status: SupportTicketStatus.RESOLVED,
        },
      }),

      prisma.supportTicket.count({
        where: {
          requesterId: userId,
          companyId,
          status: SupportTicketStatus.CLOSED,
        },
      }),
    ]);

  return {
    total,
    open,
    inProgress,
    waitingUser,
    resolved,
    closed,
  };
}
