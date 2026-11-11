
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import {
  randomUUID,
  randomBytes,
  createHash,
} from "crypto";

import prisma from "../lib/prisma";

const JWT_SECRET: string = process.env.JWT_SECRET ?? "";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET não foi configurado no arquivo .env");
}

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

// ======================================
// UTILITÁRIOS
// ======================================

function createCompanySlug(name: string) {
  const normalizedName = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const uniqueSuffix = randomUUID().slice(0, 8);

  return `${normalizedName || "empresa"}-${uniqueSuffix}`;
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[character];
  });
}

// ======================================
// ENVIO DE E-MAIL PELO RESEND
// ======================================

async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string
) {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY não foi configurada.");
  }

  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const safeName = escapeHtml(name);

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `TERVALYA CRM <${fromEmail}>`,
        to: [email],
        subject: "Recuperação de senha | TERVALYA CRM",
        html: `
          <div style="background:#090b14;padding:40px 20px;font-family:Arial,sans-serif;color:#ffffff;">
            <div style="max-width:520px;margin:auto;background:#111522;border:1px solid #292d40;border-radius:16px;padding:36px;">
              <h1 style="color:#b69aff;font-size:26px;">
                TERVALYA CRM
              </h1>

              <h2 style="font-size:21px;">
                Recuperação de senha
              </h2>

              <p style="color:#c3c5d0;line-height:1.7;">
                Olá, ${safeName}!
              </p>

              <p style="color:#c3c5d0;line-height:1.7;">
                Recebemos uma solicitação para redefinir a senha da sua conta.
                Clique no botão abaixo para criar uma nova senha.
              </p>

              <div style="text-align:center;margin:32px 0;">
                <a
                  href="${resetUrl}"
                  style="background:#b69aff;color:#111522;text-decoration:none;padding:15px 28px;border-radius:9px;font-weight:bold;display:inline-block;"
                >
                  Criar nova senha
                </a>
              </div>

              <p style="color:#999daf;font-size:13px;line-height:1.7;">
                Este link expira em 30 minutos e só pode ser utilizado uma vez.
              </p>

              <p style="color:#999daf;font-size:13px;line-height:1.7;">
                Se você não solicitou essa alteração, ignore este e-mail.
                Sua senha atual continuará funcionando.
              </p>

              <hr style="border:0;border-top:1px solid #292d40;margin:28px 0;" />

              <p style="color:#777d91;font-size:12px;">
                TERVALYA CRM · Gestão inteligente de negócios
              </p>
            </div>
          </div>
        `,
      }),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      console.error(
        "Erro no envio pelo Resend:",
        response.status,
        responseBody
      );

      throw new Error(
        `Resend recusou o envio. HTTP ${response.status}.`
      );
    }

    let result: { id?: string } = {};

    try {
      result = JSON.parse(responseBody);
    } catch {
      console.warn("O Resend respondeu sem um JSON válido.");
    }

    console.log(
      "E-mail de recuperação aceito pelo Resend:",
      result.id ?? "ID não informado"
    );
  } catch (error) {
    console.error("Falha ao conectar ou enviar e-mail pelo Resend:", error);
    throw error;
  }
}

// ======================================
// CADASTRO DE USUÁRIO
// ======================================

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  const name = data.name.trim();
  const email = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("Este e-mail já está cadastrado.");
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const companyName = `${name} - Empresa`;

  const result = await prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        slug: createCompanySlug(companyName),
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "ADMIN",
        companyId: company.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        companyId: true,
        createdAt: true,
      },
    });

    return {
      user,
      company,
    };
  });

  return result;
}

// ======================================
// LOGIN E REGISTRO DE SESSÃO
// ======================================

export async function loginUser(
  emailInput: string,
  password: string,
  deviceInfo?: {
    userAgent?: string;
    ipAddress?: string;
  }
) {
  const email = emailInput.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("E-mail ou senha incorretos.");
  }

  const passwordMatches = await bcrypt.compare(
    password,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("E-mail ou senha incorretos.");
  }

  if (!user.companyId || !user.company) {
    throw new Error(
      "Usuário não está vinculado a uma empresa. Entre em contato com o administrador."
    );
  }

  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await prisma.userSession.create({
    data: {
      userId: user.id,
      userAgent: deviceInfo?.userAgent?.slice(0, 1000) || null,
      ipAddress: deviceInfo?.ipAddress?.slice(0, 100) || null,
      expiresAt,
      lastActiveAt: new Date(),
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  const token = jwt.sign(
    {
      sub: user.id,
      sid: session.id,
    },
    JWT_SECRET,
    {
      expiresIn: "8h",
    }
  );

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      company: user.company,
    },
  };
}

// ======================================
// USUÁRIO AUTENTICADO
// ======================================

export async function getAuthenticatedUser(userId: string) {
  return prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      company: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      createdAt: true,
    },
  });
}

// ======================================
// SOLICITAR RECUPERAÇÃO DE SENHA
// ======================================

export async function requestPasswordReset(emailInput: string) {
  const email = emailInput.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!user) {
    return;
  }

  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(rawToken);

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: user.id,
      expiresAt,
    },
  });

  const appUrl = (
    process.env.APP_URL || "http://localhost:5173"
  ).replace(/\/+$/, "");

  const resetUrl =
    `${appUrl}/reset-password?token=${encodeURIComponent(rawToken)}`;

  try {
    await sendPasswordResetEmail(
      user.email,
      user.name,
      resetUrl
    );
  } catch (error) {
    await prisma.passwordResetToken.deleteMany({
      where: { tokenHash },
    });

    throw error;
  }
}

// ======================================
// REDEFINIR SENHA
// ======================================

export async function resetPassword(
  token: string,
  newPassword: string
) {
  const tokenHash = hashResetToken(token);

  const resetRecord = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (
    !resetRecord ||
    resetRecord.usedAt ||
    resetRecord.expiresAt <= new Date()
  ) {
    throw new Error(
      "Link inválido ou expirado. Solicite uma nova recuperação."
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    const updatedToken = await tx.passwordResetToken.updateMany({
      where: {
        id: resetRecord.id,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        usedAt: new Date(),
      },
    });

    if (updatedToken.count !== 1) {
      throw new Error(
        "Link inválido ou expirado. Solicite uma nova recuperação."
      );
    }

    await tx.user.update({
      where: {
        id: resetRecord.userId,
      },
      data: {
        password: hashedPassword,
      },
    });
  });

  await prisma.passwordResetToken.deleteMany({
    where: {
      userId: resetRecord.userId,
      id: {
        not: resetRecord.id,
      },
    },
  });

  // Invalida as sessões anteriores após redefinição de senha.
  await prisma.userSession.updateMany({
    where: {
      userId: resetRecord.userId,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

// ======================================
// ALTERAR SENHA DO USUÁRIO AUTENTICADO
// ======================================

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      password: true,
    },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const passwordMatches = await bcrypt.compare(
    currentPassword,
    user.password
  );

  if (!passwordMatches) {
    throw new Error("A senha atual está incorreta.");
  }

  if (currentPassword === newPassword) {
    throw new Error(
      "A nova senha deve ser diferente da senha atual."
    );
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    await tx.passwordResetToken.deleteMany({
      where: {
        userId,
        usedAt: null,
      },
    });

    // Encerra todas as sessões existentes após troca de senha.
    await tx.userSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  });

  return {
    message: "Senha alterada com sucesso. Entre novamente.",
  };
}
