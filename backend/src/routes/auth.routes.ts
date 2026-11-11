
import { Router } from "express";

import {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller";

import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

// ======================================
// CADASTRO E LOGIN
// ======================================

router.post("/register", register);
router.post("/login", login);

// ======================================
// RECUPERAÇÃO DE SENHA
// ======================================

router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// ======================================
// USUÁRIO AUTENTICADO
// ======================================

router.get("/me", authenticate, me);

// ======================================
// ALTERAÇÃO DE SENHA
// ======================================

router.patch("/change-password", authenticate, changePassword);

export default router;
