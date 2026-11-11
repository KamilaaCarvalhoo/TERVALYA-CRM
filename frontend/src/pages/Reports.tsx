
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileBarChart,
  LoaderCircle,
  Target,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../services/api";
import "./Reports.css";
type ReportData = {
  period: number;
  generatedAt: string;
  overview: {
    totalClients: number;
    activeClients: number;
    clientsCreated: number;
    totalLeads: number;
    leadsCreated: number;
    dealsCreated: number;
    tasksCreated: number;
    appointmentsCreated: number;
  };
  commercial: {
    wonRevenue: number;
    previousWonRevenue: number;
    revenueChange: number | null;
    openPipeline: number;
    weightedPipeline: number;
    wonDeals: number;
    lostDeals: number;
    lostDealValue: number;
    openDeals: number;
  };
  leads: {
    total: number;
    new: number;
    converted: number;
    conversionRate: number;
    change: number | null;
    byStatus: { status: string; total: number }[];
    bySource: { source: string; total: number }[];
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    productivity: number;
  };
  appointments: {
    total: number;
    byStatus: { status: string; total: number }[];
  };
  deals: {
    total: number;
    byStatus: { status: string; total: number }[];
  };
  monthlyRevenue: {
    month: string;
    revenue: number;
  }[];
};
const COLORS = ["#b69aff", "#54d9ed", "#e5bd75", "#55d6a1", "#ff819b"];
const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
const number = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(value);
const statusLabels: Record<string, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  LOST: "Perdido",
  CONVERTED: "Convertido",
  OPEN: "Em aberto",
  WON: "Ganho",
  PENDING: "Pendente",
  IN_PROGRESS: "Em andamento",
  COMPLETED: "Concluído",
  SCHEDULED: "Agendado",
  CANCELED: "Cancelado",
};
export default function Reports() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get<ReportData>("/reports", {
        params: { period },
      });
      setData(response.data);
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      setError("Não foi possível carregar os relatórios. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }, [period]);
  useEffect(() => {
    loadReports();
  }, [loadReports]);
  const exportCSV = () => {
    if (!data) return;
    const rows = [
      ["TERVALYA CRM - Relatório Executivo"],
      ["Período", `${data.period} dias`],
      [],
      ["Indicador", "Resultado"],
      ["Clientes cadastrados", data.overview.totalClients],
      ["Clientes ativos", data.overview.activeClients],
      ["Novos clientes", data.overview.clientsCreated],
      ["Total de leads", data.overview.totalLeads],
      ["Novos leads", data.leads.total],
      ["Leads convertidos", data.leads.converted],
      ["Taxa de conversão", `${data.leads.conversionRate}%`],
      ["Faturamento ganho", currency(data.commercial.wonRevenue)],
      ["Pipeline aberto", currency(data.commercial.openPipeline)],
      ["Pipeline ponderado", currency(data.commercial.weightedPipeline)],
      ["Negociações ganhas", data.commercial.wonDeals],
      ["Negociações perdidas", data.commercial.lostDeals],
      ["Tarefas concluídas", data.tasks.completed],
      ["Tarefas pendentes", data.tasks.pending],
      ["Tarefas atrasadas", data.tasks.overdue],
      ["Produtividade", `${data.tasks.productivity}%`],
    ];
    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(";")
      )
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `tervalya-relatorios-${period}-dias.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  if (loading && !data) {
    return (
      <div className="reports-loading">
        <LoaderCircle size={34} className="reports-spinner" />
        <span>Preparando seus relatórios...</span>
      </div>
    );
  }
  if (error && !data) {
    return (
      <div className="reports-error">
        <AlertCircle size={30} />
        <h2>Não foi possível carregar os relatórios</h2>
        <p>{error}</p>
        <button onClick={loadReports}>Tentar novamente</button>
      </div>
    );
  }
  if (!data) return null;
  const taskChart = [
    { name: "Concluídas", value: data.tasks.completed },
    { name: "Pendentes", value: data.tasks.pending },
    { name: "Em andamento", value: data.tasks.inProgress },
  ];
  const dealChart = [
    {
      name: "Abertas",
      total:
        data.deals.byStatus.find((item) => item.status === "OPEN")?.total ?? 0,
    },
    {
      name: "Ganhas",
      total:
        data.deals.byStatus.find((item) => item.status === "WON")?.total ?? 0,
    },
    {
      name: "Perdidas",
      total:
        data.deals.byStatus.find((item) => item.status === "LOST")?.total ?? 0,
    },
  ];
  const leadSourceChart = data.leads.bySource.map((item) => ({
    name: item.source,
    total: item.total,
  }));

  const monthlyRevenueChart = data.monthlyRevenue ?? [];
  return (
    <div className="reports-page">
      <div className="reports-heading">
        <div>
          <span className="reports-eyebrow">
            TERVALYA CRM / INTELIGÊNCIA DE NEGÓCIOS
          </span>
          <h1>Relatórios</h1>
          <p>
            Acompanhe os resultados e o desempenho da sua operação.
          </p>
        </div>
        <div className="reports-actions">
          <div className="reports-period">
            <CalendarDays size={17} />
            <select
              value={period}
              onChange={(event) => setPeriod(Number(event.target.value))}
            >
              <option value={7}>Últimos 7 dias</option>
              <option value={30}>Últimos 30 dias</option>
              <option value={90}>Últimos 90 dias</option>
              <option value={365}>Últimos 365 dias</option>
            </select>
          </div>
          <button
            className="reports-export"
            onClick={exportCSV}
          >
            <Download size={17} />
            Exportar CSV
          </button>
        </div>
      </div>
      {error && (
        <div className="reports-inline-error">
          {error}
          <button onClick={loadReports}>Tentar novamente</button>
        </div>
      )}
      <div className="reports-section-heading">
        <div>
          <span>VISÃO EXECUTIVA</span>
          <h2>Resumo da operação</h2>
        </div>
        <span className="reports-updated">
          <Activity size={14} />
          Dados atualizados
        </span>
      </div>
      <div className="reports-kpi-grid">
        <article className="reports-kpi purple">
          <div className="reports-kpi-top">
            <span>Clientes ativos</span>
            <div className="reports-icon">
              <Users size={20} />
            </div>
          </div>
          <strong>{number(data.overview.activeClients)}</strong>
          <small>
            {number(data.overview.totalClients)} clientes cadastrados
          </small>
        </article>
        <article className="reports-kpi cyan">
          <div className="reports-kpi-top">
            <span>Leads no período</span>
            <div className="reports-icon">
              <Target size={20} />
            </div>
          </div>
          <strong>{number(data.leads.total)}</strong>
          <small>
            {number(data.leads.converted)} convertidos
          </small>
        </article>
        <article className="reports-kpi gold">
          <div className="reports-kpi-top">
            <span>Faturamento ganho</span>
            <div className="reports-icon">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <strong>{currency(data.commercial.wonRevenue)}</strong>
          <small>
            {data.commercial.revenueChange === null
              ? "Sem histórico para comparação"
              : `${data.commercial.revenueChange > 0 ? "+" : ""}${data.commercial.revenueChange}% em relação ao período anterior`}
          </small>
        </article>
        <article className="reports-kpi green">
          <div className="reports-kpi-top">
            <span>Produtividade</span>
            <div className="reports-icon">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <strong>{data.tasks.productivity}%</strong>
          <small>
            {number(data.tasks.completed)} tarefas concluídas
          </small>
        </article>
      </div>
      <div className="reports-section-heading">
        <div>
          <span>DESEMPENHO COMERCIAL</span>
          <h2>Resultados de vendas</h2>
        </div>
      </div>
      <div className="reports-financial-grid">
        <article className="reports-panel reports-revenue-panel">
          <div className="reports-panel-heading">
            <div>
              <span>RECEITA REALIZADA</span>
              <h3>Faturamento ganho</h3>
            </div>
            <CircleDollarSign size={21} />
          </div>
          <strong className="reports-big-value">
            {currency(data.commercial.wonRevenue)}
          </strong>
          <div className="reports-comparison">
            {data.commercial.revenueChange !== null && (
              <>
                {data.commercial.revenueChange >= 0 ? (
                  <ArrowUpRight size={17} />
                ) : (
                  <ArrowDownRight size={17} />
                )}
                <span>
                  {Math.abs(data.commercial.revenueChange)}% em relação ao
                  período anterior
                </span>
              </>
            )}
            {data.commercial.revenueChange === null && (
              <span>Sem período anterior com faturamento</span>
            )}
          </div>
        </article>
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>OPORTUNIDADES</span>
              <h3>Pipeline comercial</h3>
            </div>
            <BarChart3 size={21} />
          </div>
          <strong className="reports-big-value">
            {currency(data.commercial.openPipeline)}
          </strong>
          <div className="reports-pipeline-details">
            <div>
              <span>Pipeline ponderado</span>
              <strong>{currency(data.commercial.weightedPipeline)}</strong>
            </div>
            <div>
              <span>Negociações abertas</span>
              <strong>{number(data.commercial.openDeals)}</strong>
            </div>
          </div>
        </article>
      </div>
      <div className="reports-charts-grid">
        <article className="reports-panel reports-monthly-panel">
          <div className="reports-panel-heading">
            <div>
              <span>EVOLUÇÃO FINANCEIRA</span>
              <h3>Faturamento mensal</h3>
            </div>
            <CircleDollarSign size={20} />
          </div>
          <div className="reports-chart">
            {monthlyRevenueChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueChart}>
                  <CartesianGrid stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="month" stroke="#8993a9" tickLine={false} axisLine={false} tick={{ fontSize: 10 }} />
                  <YAxis
                    stroke="#8993a9"
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `R$ ${Number(value).toLocaleString("pt-BR")}`}
                  />
                  <Tooltip
                    formatter={(value) => currency(Number(value))}
                    contentStyle={{
                      background: "#151d30",
                      border: "1px solid #343d53",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="revenue" name="Faturamento" fill="#b69aff" radius={[7, 7, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="reports-empty-chart">
                <CircleDollarSign size={28} />
                <span>Nenhum faturamento mensal registrado.</span>
              </div>
            )}
          </div>
        </article>

        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>FUNIL COMERCIAL</span>
              <h3>Negociações por status</h3>
            </div>
            <BarChart3 size={20} />
          </div>
          <div className="reports-chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dealChart}>
                <CartesianGrid
                  stroke="#ffffff10"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#8993a9"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#8993a9"
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "#151d30",
                    border: "1px solid #343d53",
                    borderRadius: 10,
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="total"
                  name="Negociações"
                  radius={[7, 7, 0, 0]}
                >
                  {dealChart.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={["#54d9ed", "#55d6a1", "#ff819b"][index]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>CAPTAÇÃO</span>
              <h3>Leads por origem</h3>
            </div>
            <Target size={20} />
          </div>
          <div className="reports-chart">
            {leadSourceChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leadSourceChart}>
                  <CartesianGrid
                    stroke="#ffffff10"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    stroke="#8993a9"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#8993a9"
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#151d30",
                      border: "1px solid #343d53",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="total"
                    name="Leads"
                    fill="#b69aff"
                    radius={[7, 7, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="reports-empty-chart">
                <Target size={28} />
                <span>Nenhum lead registrado neste período.</span>
              </div>
            )}
          </div>
        </article>
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>PRODUTIVIDADE</span>
              <h3>Status das tarefas</h3>
            </div>
            <CheckCircle2 size={20} />
          </div>
          <div className="reports-chart reports-pie-chart">
            {data.tasks.total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskChart}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {taskChart.map((item, index) => (
                      <Cell
                        key={item.name}
                        fill={COLORS[index]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#151d30",
                      border: "1px solid #343d53",
                      borderRadius: 10,
                      color: "#fff",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="reports-empty-chart">
                <CheckCircle2 size={28} />
                <span>Nenhuma tarefa registrada neste período.</span>
              </div>
            )}
          </div>
        </article>
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>CONVERSÃO</span>
              <h3>Desempenho dos leads</h3>
            </div>
            <Target size={20} />
          </div>
          <div className="reports-conversion">
            <strong>{data.leads.conversionRate}%</strong>
            <span>Taxa de conversão</span>
            <div className="reports-progress">
              <div
                style={{
                  width: `${Math.min(data.leads.conversionRate, 100)}%`,
                }}
              />
            </div>
            <div className="reports-conversion-stats">
              <div>
                <span>Novos</span>
                <strong>{number(data.leads.new)}</strong>
              </div>
              <div>
                <span>Convertidos</span>
                <strong>{number(data.leads.converted)}</strong>
              </div>
              <div>
                <span>Total</span>
                <strong>{number(data.leads.total)}</strong>
              </div>
            </div>
          </div>
        </article>
      </div>
      <div className="reports-section-heading">
        <div>
          <span>OPERAÇÃO</span>
          <h2>Produtividade e atividades</h2>
        </div>
      </div>
      <div className="reports-operation-grid">
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>GESTÃO DE TAREFAS</span>
              <h3>Resumo de atividades</h3>
            </div>
            <Clock3 size={20} />
          </div>
          <div className="reports-task-list">
            <div>
              <span className="task-dot green-dot" />
              <span>Concluídas</span>
              <strong>{number(data.tasks.completed)}</strong>
            </div>
            <div>
              <span className="task-dot purple-dot" />
              <span>Em andamento</span>
              <strong>{number(data.tasks.inProgress)}</strong>
            </div>
            <div>
              <span className="task-dot cyan-dot" />
              <span>Pendentes</span>
              <strong>{number(data.tasks.pending)}</strong>
            </div>
            <div>
              <span className="task-dot red-dot" />
              <span>Atrasadas</span>
              <strong>{number(data.tasks.overdue)}</strong>
            </div>
          </div>
        </article>
        <article className="reports-panel">
          <div className="reports-panel-heading">
            <div>
              <span>AGENDA</span>
              <h3>Compromissos cadastrados</h3>
            </div>
            <CalendarDays size={20} />
          </div>
          <strong className="reports-big-value">
            {number(data.appointments.total)}
          </strong>
          <div className="reports-appointment-list">
            {data.appointments.byStatus.length > 0 ? (
              data.appointments.byStatus.map((item) => (
                <div key={item.status}>
                  <span>
                    {statusLabels[item.status] ?? item.status}
                  </span>
                  <strong>{number(item.total)}</strong>
                </div>
              ))
            ) : (
              <div className="reports-no-appointments">
                Nenhum compromisso cadastrado no período.
              </div>
            )}
          </div>
        </article>
      </div>
      <div className="reports-footer">
        <FileBarChart size={16} />
        <span>
          Relatório gerado em{" "}
          {new Date(data.generatedAt).toLocaleString("pt-BR")}
        </span>
      </div>
    </div>
  );
}
