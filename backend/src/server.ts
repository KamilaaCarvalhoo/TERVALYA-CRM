
import "dotenv/config";

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import clientRoutes from "./routes/client.routes";
import leadRoutes from "./routes/lead.routes";
import dealRoutes from "./routes/deal.routes";
import taskRoutes from "./routes/task.routes";
import appointmentRoutes from "./routes/appointment.routes";
import reportRoutes from "./routes/report.routes";
import settingsRoutes from "./routes/settings.routes";
import sessionsRoutes from "./routes/sessions.routes";
import supportRoutes from "./routes/support.routes";

const app = express();

// ======================================
// CONFIGURAÇÕES
// ======================================

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URLS || "").split(","),
  process.env.FRONTEND_URL || "",
]
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.replace(/\/$/, "");

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(
        new Error("Origem não autorizada pelo CORS.")
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ======================================
// ROTA PRINCIPAL
// ======================================

app.get("/", (_req, res) => {
  return res.json({
    name: "TERVALYA CRM API",
    status: "online",
    version: "1.0.0",
    modules: [
      "Authentication",
      "Clients",
      "Leads",
      "Deals",
      "Tasks",
      "Appointments",
      "Reports",
      "Settings",
      "Sessions",
      "Support",
    ],
  });
});

// ======================================
// VERIFICAÇÃO DA API
// ======================================

app.get("/api/health", (_req, res) => {
  return res.status(200).json({
    status: "ok",
    application: "TERVALYA CRM",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
  });
});

// ======================================
// ROTAS DA APLICAÇÃO
// ======================================

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/sessions", sessionsRoutes);
app.use("/api/support", supportRoutes);

// ======================================
// TRATAMENTO DE ERROS
// ======================================

app.use(
  (
    error: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error("Erro na API:", error.message);

    if (error.message === "Origem não autorizada pelo CORS.") {
      return res.status(403).json({
        message: "Origem não autorizada.",
      });
    }

    return res.status(500).json({
      message: "Ocorreu um erro interno no servidor.",
    });
  }
);

// ======================================
// INICIALIZAÇÃO DO SERVIDOR
// ======================================

const PORT = Number(process.env.PORT) || 3333;

app.listen(PORT, () => {
  console.log("-----------------------------------");
  console.log("TERVALYA CRM API");
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || "development"}`);
  console.log("Módulos carregados: 10");
  console.log("-----------------------------------");
});
