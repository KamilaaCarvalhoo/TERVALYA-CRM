
import type { Request, Response } from "express";
import prisma from "../lib/prisma";

// ======================================
// IDENTIFICAR DISPOSITIVO
// ======================================

function getDeviceName(userAgent?: string | null) {
  if (!userAgent) {
    return "Dispositivo desconhecido";
  }

  let browser = "Navegador desconhecido";
  let operatingSystem = "Sistema desconhecido";

  if (/Edg\//i.test(userAgent)) {
    browser = "Microsoft Edge";
  } else if (/OPR\/|Opera/i.test(userAgent)) {
    browser = "Opera";
  } else if (/Chrome\//i.test(userAgent) && !/Edg\//i.test(userAgent)) {
    browser = "Google Chrome";
  } else if (/Firefox\//i.test(userAgent)) {
    browser = "Mozilla Firefox";
  } else if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    browser = "Safari";
  }

  if (/Windows/i.test(userAgent)) {
    operatingSystem = "Windows";
  } else if (/Android/i.test(userAgent)) {
    operatingSystem = "Android";
  } else if (/iPhone|iPad|iPod/i.test(userAgent)) {
    operatingSystem = "iOS";
  } else if (/Mac OS|Macintosh/i.test(userAgent)) {
    operatingSystem = "macOS";
  } else if (/Linux/i.test(userAgent)) {
    operatingSystem = "Linux";
  }

  return `${browser} · ${operatingSystem}`;
}

// ======================================
// LISTAR SESSÕES DO USUÁRIO
// ======================================

export async function listSessions(req: Request, res: Response) {
  const userId = req.userId;
  const currentSessionId = req.sessionId;

  if (!userId || !currentSessionId) {
    return res.status(401).json({
      message: "Sessão não identificada.",
    });
  }

  try {
    const now = new Date();

    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      orderBy: {
        lastActiveAt: "desc",
      },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActiveAt: true,
        expiresAt: true,
      },
    });

    const formattedSessions = sessions.map((session) => ({
      id: session.id,
      device: getDeviceName(session.userAgent),
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSessionId,
    }));

    return res.json({
      sessions: formattedSessions,
      total: formattedSessions.length,
    });
  } catch (error) {
    console.error("Erro ao listar sessões:", error);

    return res.status(500).json({
      message: "Não foi possível consultar os dispositivos conectados.",
    });
  }
}

// ======================================
// ENCERRAR UMA SESSÃO
// ======================================

export async function revokeSession(req: Request, res: Response) {
  const userId = req.userId;
  const sessionId = req.params.sessionId;

  if (!userId) {
    return res.status(401).json({
      message: "Usuário não autenticado.",
    });
  }

  if (!sessionId || typeof sessionId !== "string") {
    return res.status(400).json({
      message: "Informe uma sessão válida.",
    });
  }

  try {
    const result = await prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    if (result.count === 0) {
      return res.status(404).json({
        message: "Sessão não encontrada ou já encerrada.",
      });
    }

    return res.json({
      message: "Sessão encerrada com sucesso.",
    });
  } catch (error) {
    console.error("Erro ao encerrar sessão:", error);

    return res.status(500).json({
      message: "Não foi possível encerrar a sessão.",
    });
  }
}

// ======================================
// ENCERRAR TODAS AS OUTRAS SESSÕES
// ======================================

export async function revokeOtherSessions(req: Request, res: Response) {
  const userId = req.userId;
  const currentSessionId = req.sessionId;

  if (!userId || !currentSessionId) {
    return res.status(401).json({
      message: "Sessão atual não identificada.",
    });
  }

  try {
    const result = await prisma.userSession.updateMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return res.json({
      message: "As outras sessões foram encerradas com sucesso.",
      revokedCount: result.count,
    });
  } catch (error) {
    console.error("Erro ao encerrar outras sessões:", error);

    return res.status(500).json({
      message: "Não foi possível encerrar as outras sessões.",
    });
  }
}
