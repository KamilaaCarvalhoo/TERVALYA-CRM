
import type { Request, Response, NextFunction } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

import prisma from "../lib/prisma";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não configurado no arquivo .env");
}

// ======================================
// TIPAGEM DO REQUEST
// ======================================

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
      companyId?: string;
      sessionId?: string;
    }
  }
}

// ======================================
// TIPAGEM DO TOKEN
// ======================================

interface TokenPayload extends JwtPayload {
  sub?: string;
  sid?: string;
}

// ======================================
// MIDDLEWARE DE AUTENTICAÇÃO
// ======================================

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Acesso não autorizado.",
    });
  }

  const token = authorization.slice(7).trim();

  if (!token) {
    return res.status(401).json({
      message: "Token não informado.",
    });
  }

  try {
    // ======================================
    // 1. VALIDAR JWT
    // ======================================

    const decoded = jwt.verify(
      token,
      JWT_SECRET
    ) as TokenPayload;

    if (
      typeof decoded.sub !== "string" ||
      typeof decoded.sid !== "string"
    ) {
      return res.status(401).json({
        message: "Token inválido ou sem identificação de sessão.",
      });
    }

    // ======================================
    // 2. VALIDAR SESSÃO NO BANCO
    // ======================================

    const now = new Date();

    const session = await prisma.userSession.findFirst({
      where: {
        id: decoded.sid,
        userId: decoded.sub,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

    if (!session) {
      return res.status(401).json({
        message: "Esta sessão foi encerrada ou expirou. Entre novamente.",
      });
    }

    // ======================================
    // 3. BUSCAR USUÁRIO E EMPRESA
    // ======================================

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.sub,
      },
      select: {
        id: true,
        role: true,
        companyId: true,
      },
    });

    if (!user || !user.companyId) {
      return res.status(401).json({
        message: "Usuário ou empresa não encontrados.",
      });
    }

    // ======================================
    // 4. ATUALIZAR ÚLTIMA ATIVIDADE
    // ======================================

    await prisma.userSession.updateMany({
      where: {
        id: session.id,
        userId: user.id,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        lastActiveAt: new Date(),
      },
    });

    // ======================================
    // 5. VINCULAR DADOS AO REQUEST
    // ======================================

    req.userId = user.id;
    req.userRole = user.role;
    req.companyId = user.companyId;
    req.sessionId = session.id;

    return next();
  } catch (error) {
    if (
      error instanceof jwt.TokenExpiredError ||
      error instanceof jwt.JsonWebTokenError
    ) {
      return res.status(401).json({
        message: "Sessão expirada ou token inválido. Entre novamente.",
      });
    }

    console.error("Erro na autenticação:", error);

    return res.status(500).json({
      message: "Não foi possível validar sua sessão.",
    });
  }
}
