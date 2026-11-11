
import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import upload from "../middlewares/upload.middleware";

import {
  getSettings,
  updateProfile,
  updateCompany,
  updatePreferences,
  updateNotifications,
} from "../controllers/settings.controller";

import {
  uploadProfilePhoto,
  uploadCompanyLogo,
} from "../controllers/media.controller";

const router = Router();

// Todas as rotas exigem autenticação
router.use(authenticate);

// Buscar configurações
router.get("/", getSettings);

// Perfil
router.patch("/profile", updateProfile);
router.post(
  "/profile/photo",
  upload.single("image"),
  uploadProfilePhoto
);

// Empresa
router.patch("/company", updateCompany);
router.post(
  "/company/logo",
  upload.single("image"),
  uploadCompanyLogo
);

// Preferências
router.patch("/preferences", updatePreferences);

// Notificações
router.patch("/notifications", updateNotifications);

export default router;
