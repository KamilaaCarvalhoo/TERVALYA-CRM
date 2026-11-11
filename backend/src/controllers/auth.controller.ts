
import type { Request, Response } from "express";

import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator";

import {
  registerUser,
  loginUser,
  getAuthenticatedUser,
  requestPasswordReset,
  resetPassword as resetUserPassword,
  changeUserPassword,
} from "../services/auth.service";

// ======================================
// CADASTRO
// ======================================

export async function register(req: Request, res: Response) {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await registerUser(validation.data);

    return res.status(201).json({
      message: "Conta e empresa criadas com sucesso.",
      user: result.user,
      company: result.company,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("já está cadastrado")
    ) {
      return res.status(409).json({
        message: error.message,
      });
    }

    console.error("Erro no cadastro:", error);

    return res.status(500).json({
      message: "Não foi possível criar sua conta.",
    });
  }
}

// ======================================
// LOGIN
// ======================================

export async function login(req: Request, res: Response) {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      message: "Dados inválidos.",
      errors: validation.error.flatten().fieldErrors,
    });
  }

  try {
    const result = await loginUser(
      validation.data.email,
      validation.data.password,
      {
        userAgent: req.get("user-agent") || undefined,
        ipAddress: req.ip || undefined,
      }
    );

    return res.json({
      message: "Login realizado com sucesso.",
      ...result,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "E-mail ou senha incorretos."
    ) {
      return res.status(401).json({
        message: error.message,
      });
    }

    if (
      error instanceof Error &&
      error.message.includes("não está vinculado a uma empresa")
    ) {
      return res.status(403).json({
        message: error.message,
      });
    }

    console.error("Erro no login:", error);

    return res.status(500).json({
      message: "Não foi possível realizar o login.",
    });
  }
}

// ======================================
// USUÁRIO AUTENTICADO
// ======================================

export async function me(req: Request, res: Response) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      message: "Não autenticado.",
    });
  }

  try {
    const user = await getAuthenticatedUser(userId);

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    if (!user.companyId || !user.company) {
      return res.status(403).json({
        message: "Usuário não está vinculado a uma empresa.",
      });
    }

    return res.json({
      user,
    });
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);

    return res.status(500).json({
      message: "Erro ao consultar usuário.",
    });
  }
}

// ======================================
// SOLICITAR RECUPERAÇÃO DE SENHA
// ======================================

export async function forgotPassword(req: Request, res: Response) {
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      message: "Informe um endereço de e-mail válido.",
    });
  }

  try {
    await requestPasswordReset(email);

    return res.json({
      message:
        "Se o e-mail estiver cadastrado, você receberá as instruções de recuperação.",
    });
  } catch (error) {
    console.error("Erro na solicitação de recuperação:", error);

    return res.status(500).json({
      message:
        "Não foi possível enviar o e-mail de recuperação. Tente novamente.",
    });
  }
}

// ======================================
// REDEFINIR SENHA
// ======================================

export async function resetPassword(req: Request, res: Response) {
  const token =
    typeof req.body?.token === "string"
      ? req.body.token.trim()
      : "";

  const password =
    typeof req.body?.password === "string"
      ? req.body.password
      : "";

  if (!token || !password) {
    return res.status(400).json({
      message: "Informe o código de recuperação e a nova senha.",
    });
  }

  if (password.length < 8 || password.length > 72) {
    return res.status(400).json({
      message: "A senha deve ter entre 8 e 72 caracteres.",
    });
  }

  try {
    await resetUserPassword(token, password);

    return res.json({
      message: "Senha redefinida com sucesso. Você já pode entrar.",
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Link inválido ou expirado")
    ) {
      return res.status(400).json({
        message: error.message,
      });
    }

    console.error("Erro ao redefinir senha:", error);

    return res.status(500).json({
      message: "Não foi possível redefinir sua senha.",
    });
  }
}

// ======================================
// ALTERAR SENHA DO USUÁRIO AUTENTICADO
// ======================================

export async function changePassword(req: Request, res: Response) {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({
      message: "Usuário não autenticado.",
    });
  }

  const currentPassword =
    typeof req.body?.currentPassword === "string"
      ? req.body.currentPassword
      : "";

  const newPassword =
    typeof req.body?.newPassword === "string"
      ? req.body.newPassword
      : "";

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      message: "Informe a senha atual e a nova senha.",
    });
  }

  if (newPassword.length < 8 || newPassword.length > 72) {
    return res.status(400).json({
      message: "A nova senha deve ter entre 8 e 72 caracteres.",
    });
  }

  try {
    const result = await changeUserPassword(
      userId,
      currentPassword,
      newPassword
    );

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Usuário não encontrado.") {
        return res.status(404).json({
          message: error.message,
        });
      }

      if (
        error.message === "A senha atual está incorreta." ||
        error.message.includes("diferente da senha atual")
      ) {
        return res.status(400).json({
          message: error.message,
        });
      }
    }

    console.error("Erro ao alterar senha:", error);

    return res.status(500).json({
      message: "Não foi possível alterar a senha.",
    });
  }
}
