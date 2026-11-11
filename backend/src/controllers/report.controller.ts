
import type { Request, Response } from "express";
import {
  getCompanyReports,
  type ReportPeriod,
} from "../services/report.service";

export async function getReports(req: Request, res: Response) {
  try {
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(401).json({
        message: "Empresa não identificada.",
      });
    }

    const allowedPeriods: ReportPeriod[] = [7, 30, 90, 365];

    const requestedPeriod = Number(req.query.period ?? 30);

    if (!allowedPeriods.includes(requestedPeriod as ReportPeriod)) {
      return res.status(400).json({
        message: "Período inválido. Utilize 7, 30, 90 ou 365 dias.",
      });
    }

    const reports = await getCompanyReports(
      companyId,
      requestedPeriod as ReportPeriod
    );

    return res.status(200).json(reports);
  } catch (error) {
    console.error("Erro ao gerar relatórios:", error);

    return res.status(500).json({
      message: "Não foi possível gerar os relatórios.",
    });
  }
}
