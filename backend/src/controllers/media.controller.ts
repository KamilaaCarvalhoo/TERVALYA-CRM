
import { Request, Response } from "express";
import { UploadApiResponse } from "cloudinary";
import cloudinary from "../lib/cloudinary";
import prisma from "../lib/prisma";

// ======================================
// FUNÇÃO DE ENVIO AO CLOUDINARY
// ======================================

function uploadImage(
  file: Express.Multer.File,
  publicId: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
        transformation: [
          {
            width: 800,
            height: 800,
            crop: "limit",
            quality: "auto",
            fetch_format: "auto",
          },
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        if (!result) {
          reject(new Error("Não foi possível enviar a imagem."));
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

// ======================================
// FOTO DE PERFIL
// ======================================

export async function uploadProfilePhoto(
  req: Request,
  res: Response
) {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Usuário não autenticado.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Selecione uma imagem para enviar.",
      });
    }

    const publicId = `tervalya/users/${userId}/avatar`;

    const result = await uploadImage(req.file, publicId);

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: result.secure_url,
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    return res.status(200).json({
      message: "Foto de perfil atualizada com sucesso.",
      profile: user,
    });
  } catch (error) {
    console.error("Erro ao enviar foto de perfil:", error);

    return res.status(500).json({
      message: "Não foi possível atualizar a foto de perfil.",
    });
  }
}

// ======================================
// LOGOTIPO DA EMPRESA
// ======================================

export async function uploadCompanyLogo(
  req: Request,
  res: Response
) {
  try {
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(403).json({
        message: "Usuário não está vinculado a uma empresa.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        message: "Selecione uma imagem para enviar.",
      });
    }

    const publicId = `tervalya/companies/${companyId}/logo`;

    const result = await uploadImage(req.file, publicId);

    const company = await prisma.company.update({
      where: { id: companyId },
      data: {
        logoUrl: result.secure_url,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
      },
    });

    return res.status(200).json({
      message: "Logotipo atualizado com sucesso.",
      company,
    });
  } catch (error) {
    console.error("Erro ao enviar logotipo:", error);

    return res.status(500).json({
      message: "Não foi possível atualizar o logotipo.",
    });
  }
}
