
import {
  DealStatus,
  LeadStatus,
  TaskStatus,
  Prisma,
} from "@prisma/client";

import prisma from "../lib/prisma";

export type ReportPeriod = 7 | 30 | 90 | 365;

function getPeriodStart(period: ReportPeriod) {
  const date = new Date();

  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (period - 1));

  return date;
}

function getPreviousPeriodStart(startDate: Date, period: ReportPeriod) {
  const date = new Date(startDate);
  date.setDate(date.getDate() - period);

  return date;
}

function toNumber(
  value: Prisma.Decimal | number | null | undefined
) {
  return value == null ? 0 : Number(value);
}

export async function getCompanyReports(
  companyId: string,
  period: ReportPeriod
) {
  const startDate = getPeriodStart(period);
  const previousStartDate = getPreviousPeriodStart(
    startDate,
    period
  );

  const now = new Date();

  const [
    totalClients,
    activeClients,
    clientsCreated,
    totalLeads,
    leadsCreated,
    leadsByStatus,
    leadsBySource,
    dealsCreated,
    dealsByStatus,
    wonDeals,
    lostDeals,
    openDeals,
    tasksCreated,
    tasksByStatus,
    overdueTasks,
    appointmentsCreated,
    appointmentsByStatus,
    previousWonDeals,
    previousLeads,
    recentDeals,
    recentActivities,
  ] = await Promise.all([
    prisma.client.count({
      where: { companyId },
    }),

    prisma.client.count({
      where: {
        companyId,
        status: "ACTIVE",
      },
    }),

    prisma.client.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    }),

    prisma.lead.count({
      where: { companyId },
    }),

    prisma.lead.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    }),

    prisma.lead.groupBy({
      by: ["status"],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.lead.groupBy({
      by: ["source"],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        _count: {
          source: "desc",
        },
      },
    }),

    prisma.deal.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    }),

    prisma.deal.groupBy({
      by: ["status"],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.deal.aggregate({
      where: {
        companyId,
        status: DealStatus.WON,
        updatedAt: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        value: true,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.deal.aggregate({
      where: {
        companyId,
        status: DealStatus.LOST,
        updatedAt: {
          gte: startDate,
          lte: now,
        },
      },
      _sum: {
        value: true,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.deal.aggregate({
      where: {
        companyId,
        status: DealStatus.OPEN,
      },
      _sum: {
        value: true,
      },
      _count: {
        _all: true,
      },
    }),

    prisma.task.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    }),

    prisma.task.groupBy({
      by: ["status"],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.task.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
        dueDate: {
          lt: now,
        },
        status: {
          not: TaskStatus.COMPLETED,
        },
      },
    }),

    prisma.appointment.count({
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
    }),

    prisma.appointment.groupBy({
      by: ["status"],
      where: {
        companyId,
        createdAt: {
          gte: startDate,
          lte: now,
        },
      },
      _count: {
        _all: true,
      },
    }),

    prisma.deal.aggregate({
      where: {
        companyId,
        status: DealStatus.WON,
        updatedAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
      _sum: {
        value: true,
      },
    }),

    prisma.lead.count({
      where: {
        companyId,
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
      },
    }),

    prisma.deal.findMany({
      where: {
        companyId,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        value: true,
        status: true,
        stage: true,
        probability: true,
        expectedAt: true,
        createdAt: true,
        updatedAt: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.activity.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        type: true,
        description: true,
        createdAt: true,
        user: {
          select: {
            name: true,
          },
        },
        client: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  // CONTAGEM DOS STATUS

  const statusCount = <T extends string>(
    items: Array<{
      status: T;
      _count: {
        _all: number;
      };
    }>,
    status: T
  ) =>
    items.find((item) => item.status === status)?._count._all ?? 0;

  const totalLeadsInPeriod = leadsCreated;

  const convertedLeads = statusCount(
    leadsByStatus,
    LeadStatus.CONVERTED
  );

  const newLeads = statusCount(
    leadsByStatus,
    LeadStatus.NEW
  );

  const pendingTasks = statusCount(
    tasksByStatus,
    TaskStatus.PENDING
  );

  const inProgressTasks = statusCount(
    tasksByStatus,
    TaskStatus.IN_PROGRESS
  );

  const completedTasks = statusCount(
    tasksByStatus,
    TaskStatus.COMPLETED
  );

  // PRODUTIVIDADE

  const totalTasksInPeriod = tasksCreated;

  const taskProductivity =
    totalTasksInPeriod > 0
      ? Math.round(
          (completedTasks / totalTasksInPeriod) * 100
        )
      : 0;

  // PIPELINE COMERCIAL

  const openPipeline = toNumber(openDeals._sum.value);

  const weightedPipeline = await prisma.deal.findMany({
    where: {
      companyId,
      status: DealStatus.OPEN,
    },
    select: {
      value: true,
      probability: true,
    },
  });

  const weightedPipelineValue = weightedPipeline.reduce(
    (total, deal) =>
      total +
      toNumber(deal.value) * (deal.probability / 100),
    0
  );

  // FATURAMENTO E COMPARAÇÃO

  const wonRevenue = toNumber(wonDeals._sum.value);

  const previousWonRevenue = toNumber(
    previousWonDeals._sum.value
  );

  const revenueChange =
    previousWonRevenue > 0
      ? Number(
          (
            ((wonRevenue - previousWonRevenue) /
              previousWonRevenue) *
            100
          ).toFixed(1)
        )
      : null;

  const leadsChange =
    previousLeads > 0
      ? Number(
          (
            ((leadsCreated - previousLeads) /
              previousLeads) *
            100
          ).toFixed(1)
        )
      : null;

  const leadConversionRate =
    totalLeadsInPeriod > 0
      ? Number(
          (
            (convertedLeads / totalLeadsInPeriod) *
            100
          ).toFixed(1)
        )
      : 0;

  // EVOLUÇÃO MENSAL DO FATURAMENTO

  const monthlyStart = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1
  );

  const monthlyWonDeals = await prisma.deal.findMany({
    where: {
      companyId,
      status: DealStatus.WON,
      updatedAt: {
        gte: monthlyStart,
        lte: now,
      },
    },
    select: {
      value: true,
      updatedAt: true,
    },
  });

  const monthlyRevenue = Array.from(
    { length: 12 },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - 11 + index,
        1
      );

      return {
        month: date.toLocaleDateString("pt-BR", {
          month: "short",
          year: "numeric",
        }),
        revenue: 0,
      };
    }
  );

  monthlyWonDeals.forEach((deal) => {
    const monthIndex =
      (deal.updatedAt.getFullYear() -
        monthlyStart.getFullYear()) *
        12 +
      deal.updatedAt.getMonth() -
      monthlyStart.getMonth();

    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyRevenue[monthIndex].revenue += toNumber(
        deal.value
      );
    }
  });

  monthlyRevenue.forEach((item) => {
    item.revenue = Number(item.revenue.toFixed(2));
  });

  // RESPOSTA DOS RELATÓRIOS

  return {
    period,
    generatedAt: now.toISOString(),

    overview: {
      totalClients,
      activeClients,
      clientsCreated,
      totalLeads,
      leadsCreated,
      dealsCreated,
      tasksCreated,
      appointmentsCreated,
    },

    commercial: {
      wonRevenue,
      previousWonRevenue,
      revenueChange,
      openPipeline,
      weightedPipeline: Number(
        weightedPipelineValue.toFixed(2)
      ),
      wonDeals: wonDeals._count._all,
      lostDeals: lostDeals._count._all,
      lostDealValue: toNumber(lostDeals._sum.value),
      openDeals: openDeals._count._all,
    },

    leads: {
      total: totalLeadsInPeriod,
      new: newLeads,
      converted: convertedLeads,
      conversionRate: leadConversionRate,
      change: leadsChange,

      byStatus: leadsByStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),

      bySource: leadsBySource.map((item) => ({
        source: item.source || "Não informado",
        total: item._count._all,
      })),
    },

    tasks: {
      total: totalTasksInPeriod,
      pending: pendingTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
      overdue: overdueTasks,
      productivity: taskProductivity,
    },

    appointments: {
      total: appointmentsCreated,

      byStatus: appointmentsByStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
    },

    deals: {
      total: dealsCreated,

      byStatus: dealsByStatus.map((item) => ({
        status: item.status,
        total: item._count._all,
      })),
    },

    monthlyRevenue,

    recentDeals: recentDeals.map((deal) => ({
      id: deal.id,
      title: deal.title,
      value: toNumber(deal.value),
      status: deal.status,
      stage: deal.stage,
      probability: deal.probability,
      expectedAt: deal.expectedAt,
      createdAt: deal.createdAt,
      updatedAt: deal.updatedAt,
      clientName: deal.client.name,
    })),

    recentActivities: recentActivities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      description: activity.description,
      createdAt: activity.createdAt,
      userName: activity.user.name,
      clientName: activity.client?.name ?? null,
    })),
  };
}
