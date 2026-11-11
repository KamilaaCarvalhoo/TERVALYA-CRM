
import { Request, Response } from "express";
import prisma from "../lib/prisma";

// ======================================
// BUSCAR CONFIGURAÇÕES
// ======================================

export async function getSettings(req: Request, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        preferences: true,
        notifications: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        message: "Usuário não encontrado.",
      });
    }

    const {
      password,
      company,
      preferences,
      notifications,
      ...profile
    } = user;

    return res.status(200).json({
      profile,
      company,
      preferences,
      notifications,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);

    return res.status(500).json({
      message: "Erro ao carregar as configurações.",
    });
  }
}

// ======================================
// ATUALIZAR PERFIL
// ======================================

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const { name, email, phone, avatarUrl } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Nome e e-mail são obrigatórios.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      normalizedEmail
    );

    if (!emailIsValid) {
      return res.status(400).json({
        message: "Informe um e-mail válido.",
      });
    }

    if (phone !== undefined && phone !== null && typeof phone !== "string") {
      return res.status(400).json({
        message: "Telefone inválido.",
      });
    }

    if (
      avatarUrl !== undefined &&
      avatarUrl !== null &&
      typeof avatarUrl !== "string"
    ) {
      return res.status(400).json({
        message: "Endereço da imagem inválido.",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        message: "Este e-mail já está sendo utilizado.",
      });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name.trim(),
        email: normalizedEmail,
        ...(phone !== undefined && {
          phone: phone?.trim() || null,
        }),
        ...(avatarUrl !== undefined && {
          avatarUrl: avatarUrl?.trim() || null,
        }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Perfil atualizado com sucesso.",
      profile: user,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);

    return res.status(500).json({
      message: "Erro ao atualizar o perfil.",
    });
  }
}

// ======================================
// ATUALIZAR EMPRESA
// ======================================

export async function updateCompany(req: Request, res: Response) {
  try {
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(403).json({
        message: "Usuário não está vinculado a uma empresa.",
      });
    }

    const {
      name,
      tradeName,
      cnpj,
      email,
      phone,
      website,
      logoUrl,
      zipCode,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      country,
    } = req.body;

    if (name !== undefined && (
      typeof name !== "string" || !name.trim()
    )) {
      return res.status(400).json({
        message: "O nome da empresa é inválido.",
      });
    }

    const optionalFields = {
      tradeName,
      cnpj,
      email,
      phone,
      website,
      logoUrl,
      zipCode,
      address,
      addressNumber,
      complement,
      neighborhood,
      city,
      state,
      country,
    };

    for (const [field, value] of Object.entries(optionalFields)) {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== "string"
      ) {
        return res.status(400).json({
          message: `O campo ${field} deve ser um texto válido.`,
        });
      }
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        message: "Informe um e-mail empresarial válido.",
      });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(tradeName !== undefined && {
          tradeName: tradeName?.trim() || null,
        }),
        ...(cnpj !== undefined && {
          cnpj: cnpj?.trim() || null,
        }),
        ...(email !== undefined && {
          email: email?.trim().toLowerCase() || null,
        }),
        ...(phone !== undefined && {
          phone: phone?.trim() || null,
        }),
        ...(website !== undefined && {
          website: website?.trim() || null,
        }),
        ...(logoUrl !== undefined && {
          logoUrl: logoUrl?.trim() || null,
        }),
        ...(zipCode !== undefined && {
          zipCode: zipCode?.trim() || null,
        }),
        ...(address !== undefined && {
          address: address?.trim() || null,
        }),
        ...(addressNumber !== undefined && {
          addressNumber: addressNumber?.trim() || null,
        }),
        ...(complement !== undefined && {
          complement: complement?.trim() || null,
        }),
        ...(neighborhood !== undefined && {
          neighborhood: neighborhood?.trim() || null,
        }),
        ...(city !== undefined && {
          city: city?.trim() || null,
        }),
        ...(state !== undefined && {
          state: state?.trim() || null,
        }),
        ...(country !== undefined && {
          country: country?.trim() || null,
        }),
      },
    });

    return res.status(200).json({
      message: "Dados da empresa atualizados com sucesso.",
      company,
    });
  } catch (error) {
    console.error("Erro ao atualizar empresa:", error);

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        message: "Este CNPJ já está cadastrado em outra empresa.",
      });
    }

    return res.status(500).json({
      message: "Erro ao atualizar os dados da empresa.",
    });
  }
}

// ======================================
// ATUALIZAR PREFERÊNCIAS
// ======================================

export async function updatePreferences(req: Request, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const {
      language,
      dateFormat,
      timezone,
      theme,
    } = req.body;

    const allowedValues = {
      language: ["pt-BR", "en-US", "es-ES"],
      dateFormat: ["dd/MM/yyyy", "MM/dd/yyyy", "yyyy-MM-dd"],
      theme: ["dark", "light", "system"],
    };

    if (
      language !== undefined &&
      !allowedValues.language.includes(language)
    ) {
      return res.status(400).json({
        message: "Idioma inválido.",
      });
    }

    if (
      dateFormat !== undefined &&
      !allowedValues.dateFormat.includes(dateFormat)
    ) {
      return res.status(400).json({
        message: "Formato de data inválido.",
      });
    }

    if (
      theme !== undefined &&
      !allowedValues.theme.includes(theme)
    ) {
      return res.status(400).json({
        message: "Tema inválido.",
      });
    }

    if (
      timezone !== undefined &&
      (typeof timezone !== "string" || !timezone.trim())
    ) {
      return res.status(400).json({
        message: "Fuso horário inválido.",
      });
    }

    const preferences = await prisma.userPreferences.upsert({
      where: { userId },
      update: {
        ...(language !== undefined && { language }),
        ...(dateFormat !== undefined && { dateFormat }),
        ...(timezone !== undefined && { timezone: timezone.trim() }),
        ...(theme !== undefined && { theme }),
      },
      create: {
        userId,
        language: language ?? "pt-BR",
        dateFormat: dateFormat ?? "dd/MM/yyyy",
        timezone: timezone ?? "America/Sao_Paulo",
        theme: theme ?? "dark",
      },
    });

    return res.status(200).json({
      message: "Preferências atualizadas com sucesso.",
      preferences,
    });
  } catch (error) {
    console.error("Erro ao atualizar preferências:", error);

    return res.status(500).json({
      message: "Erro ao atualizar as preferências.",
    });
  }
}

// ======================================
// ATUALIZAR NOTIFICAÇÕES
// ======================================

export async function updateNotifications(req: Request, res: Response) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    const {
      tasks,
      leads,
      appointments,
      deals,
      emailEnabled,
      inAppEnabled,
    } = req.body;

    const notificationFields = {
      tasks,
      leads,
      appointments,
      deals,
      emailEnabled,
      inAppEnabled,
    };

    for (const [field, value] of Object.entries(notificationFields)) {
      if (value !== undefined && typeof value !== "boolean") {
        return res.status(400).json({
          message: `A configuração ${field} deve ser verdadeira ou falsa.`,
        });
      }
    }

    const notifications = await prisma.userNotificationSettings.upsert({
      where: { userId },
      update: {
        ...(tasks !== undefined && { tasks }),
        ...(leads !== undefined && { leads }),
        ...(appointments !== undefined && { appointments }),
        ...(deals !== undefined && { deals }),
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(inAppEnabled !== undefined && { inAppEnabled }),
      },
      create: {
        userId,
        tasks: tasks ?? true,
        leads: leads ?? true,
        appointments: appointments ?? true,
        deals: deals ?? false,
        emailEnabled: emailEnabled ?? true,
        inAppEnabled: inAppEnabled ?? true,
      },
    });

    return res.status(200).json({
      message: "Notificações atualizadas com sucesso.",
      notifications,
    });
  } catch (error) {
    console.error("Erro ao atualizar notificações:", error);

    return res.status(500).json({
      message: "Erro ao atualizar as notificações.",
    });
  }
}
