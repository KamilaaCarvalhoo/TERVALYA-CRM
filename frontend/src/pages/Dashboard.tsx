import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Users,
  Target,
  BriefcaseBusiness,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  MoreHorizontal,
  Clock3,
  Activity,
  TrendingUp,
  Sparkles,
  LoaderCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import StatCard from "../components/StatCard";
import api from "../services/api";

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
  recentDeals: {
    id: string;
    title: string;
    value: number;
    status: string;
    stage: string | null;
    probability: number;
    expectedAt: string | null;
    createdAt: string;
    updatedAt: string;
    clientName: string;
  }[];
  recentActivities: {
    id: string;
    type: string;
    description: string;
    createdAt: string;
    userName: string;
    clientName: string | null;
  }[];
};

const CHART_COLORS = ["#a78bfa", "#54d9ed", "#6ea8ff", "#55d6a1", "#e5bd75"];

const currencyFormatter = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

const numberFormatter = (value: number) =>
  new Intl.NumberFormat("pt-BR").format(Number(value) || 0);

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    OPEN: "Em aberto",
    WON: "Ganhas",
    LOST: "Perdidas",
    NEW: "Novos",
    CONTACTED: "Contatados",
    QUALIFIED: "Qualificados",
    CONVERTED: "Convertidos",
    LOST_LEAD: "Perdidos",
  };

  return labels[status] ?? status;
}

function getDealStatusColor(status: string) {
  const colors: Record<string, string> = {
    OPEN: "purple",
    WON: "green",
    LOST: "cyan",
  };

  return colors[status] ?? "blue";
}

function getActivityColor(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("deal") || normalized.includes("negoci")) return "green";
  if (normalized.includes("lead") || normalized.includes("prospec")) return "cyan";
  if (normalized.includes("task") || normalized.includes("tarefa")) return "blue";
  return "purple";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não disponível";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getChangeText(change: number | null) {
  if (change === null || !Number.isFinite(change)) return "—";
  const formatted = Math.abs(change).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  });
  return `${change > 0 ? "+" : change < 0 ? "−" : ""}${formatted}%`;
}

export default function Dashboard() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get<ReportData>("/reports", {
        params: { period: 30 },
      });

      setData(response.data);
    } catch (err) {
      console.error("Erro ao carregar Dashboard:", err);
      setError(
        "Não foi possível carregar os indicadores. Verifique sua conexão e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const revenueData = useMemo(
    () =>
      (data?.monthlyRevenue ?? []).map((item) => ({
        month: item.month,
        revenue: Number(item.revenue) || 0,
      })),
    [data]
  );

  const pipelineData = useMemo(() => {
    const statusOrder = ["OPEN", "WON", "LOST"];
    const statuses = data?.deals.byStatus ?? [];

    return statusOrder
      .map((status) => {
        const found = statuses.find((item) => item.status === status);
        return {
          name: getStatusLabel(status),
          value: found?.total ?? 0,
          color: CHART_COLORS[statusOrder.indexOf(status)],
        };
      })
      .filter((item) => item.value > 0);
  }, [data]);

  const totalDealsInPeriod = pipelineData.reduce(
    (total, item) => total + item.value,
    0
  );

  const revenueChange = data?.commercial.revenueChange ?? null;
  const revenueChangePositive = revenueChange !== null && revenueChange >= 0;

  if (loading && !data) {
    return (
      <div className="dashboard dashboard-state">
        <LoaderCircle size={34} className="dashboard-spinner" />
        <strong>Carregando seu painel...</strong>
        <span>Buscando os dados reais da sua empresa.</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="dashboard dashboard-state dashboard-error">
        <AlertCircle size={32} />
        <h2>Não foi possível carregar o Dashboard</h2>
        <p>{error}</p>
        <button className="primary-button" type="button" onClick={loadDashboard}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="dashboard">
      <div className="page-heading">
        <div>
          <span className="eyebrow">PAINEL DE INTELIGÊNCIA</span>
          <h1>Visão geral</h1>
          <p>
            Uma visão estratégica do desempenho e das oportunidades do seu
            negócio.
          </p>
          <div className="dashboard-status">
            <span className="dashboard-status-dot" />
            Dados reais da empresa
            <span className="dashboard-status-separator">•</span>
            Atualizado em{" "}
            {new Date(data.generatedAt).toLocaleString("pt-BR", {
              dateStyle: "short",
              timeStyle: "short",
            })}
          </div>
        </div>

        <button className="primary-button" type="button">
          <Plus size={18} />
          Novo registro
        </button>
      </div>

      <section className="dashboard-insight-strip">
        <div className="dashboard-insight-icon">
          <Sparkles size={17} />
        </div>
        <div className="dashboard-insight-copy">
          <strong>Painel executivo TERVALYA</strong>
          <span>
            Indicadores calculados a partir dos registros da sua empresa.
          </span>
        </div>
        <div className="dashboard-insight-tag">
          <Activity size={13} />
          Dados consolidados
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          title="Total de clientes"
          value={numberFormatter(data.overview.totalClients)}
          change="—"
          description={`${numberFormatter(data.overview.activeClients)} ativos`}
          icon={Users}
          color="purple"
        />

        <StatCard
          title="Leads no período"
          value={numberFormatter(data.overview.leadsCreated)}
          change={getChangeText(data.leads.change)}
          description="vs. período anterior"
          icon={Target}
          color="cyan"
        />

        <StatCard
          title="Negociações abertas"
          value={numberFormatter(data.commercial.openDeals)}
          change="—"
          description={`${numberFormatter(data.commercial.wonDeals)} ganhas no período`}
          icon={BriefcaseBusiness}
          color="blue"
        />

        <StatCard
          title="Receita em negociação"
          value={currencyFormatter(data.commercial.openPipeline)}
          change="—"
          description="valor do pipeline aberto"
          icon={Wallet}
          color="green"
        />
      </section>

      <section className="charts-grid">
        <div className="panel revenue-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">FINANCEIRO</span>
              <h3>Desempenho financeiro</h3>
              <p>Receita de negociações ganhas nos últimos 12 meses</p>
            </div>

            <span className="select-button">Últimos 12 meses</span>
          </div>

          <div className="revenue-summary">
            <strong>{currencyFormatter(data.commercial.wonRevenue)}</strong>
            <span className={revenueChangePositive ? "positive" : "negative"}>
              {revenueChange !== null &&
                (revenueChangePositive ? (
                  <ArrowUpRight size={15} />
                ) : (
                  <ArrowDownRight size={15} />
                ))}
              {revenueChange === null
                ? "Sem comparação"
                : `${getChangeText(revenueChange)} no período`}
            </span>
          </div>

          <div className="chart-container">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={revenueData}
                  margin={{ top: 12, right: 8, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#a78bfa"
                        stopOpacity={0.34}
                      />
                      <stop
                        offset="100%"
                        stopColor="#a78bfa"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    stroke="#263047"
                    strokeDasharray="4 5"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#77839a"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    dy={8}
                  />
                  <YAxis
                    stroke="#77839a"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value: number) => `${value / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#151d30",
                      border: "1px solid #34405a",
                      borderRadius: 10,
                      color: "#eef2ff",
                      fontSize: 11,
                    }}
                    formatter={(value) => [
                      currencyFormatter(Number(value)),
                      "Receita realizada",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#b69aff"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                    activeDot={{
                      r: 5,
                      fill: "#54d9ed",
                      stroke: "#151d30",
                      strokeWidth: 3,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="dashboard-empty-chart">
                Ainda não há dados financeiros para exibir.
              </div>
            )}
          </div>
        </div>

        <div className="panel pipeline-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">COMERCIAL</span>
              <h3>Funil de vendas</h3>
              <p>Negociações criadas nos últimos 30 dias</p>
            </div>

            <button
              className="more-button"
              type="button"
              aria-label="Mais opções do funil de vendas"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="donut-container">
            {totalDealsInPeriod > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pipelineData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={5}
                      stroke="none"
                    >
                      {pipelineData.map((item) => (
                        <Cell key={item.name} fill={item.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#151d30",
                        border: "1px solid #34405a",
                        borderRadius: 10,
                        color: "#eef2ff",
                        fontSize: 11,
                      }}
                      formatter={(value) => [
                        numberFormatter(Number(value)),
                        "Negociações",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="donut-center">
                  <strong>{numberFormatter(totalDealsInPeriod)}</strong>
                  <span>Negociações</span>
                </div>
              </>
            ) : (
              <div className="dashboard-empty-chart">
                Nenhuma negociação criada no período.
              </div>
            )}
          </div>

          <div className="legend-list">
            {pipelineData.length > 0 ? (
              pipelineData.map((item) => {
                const percentage =
                  totalDealsInPeriod > 0
                    ? Math.round((item.value / totalDealsInPeriod) * 100)
                    : 0;

                return (
                  <div className="legend-item" key={item.name}>
                    <span className="legend-name">
                      <i style={{ background: item.color }} />
                      {item.name}
                    </span>
                    <strong>
                      {percentage}% ({numberFormatter(item.value)})
                    </strong>
                  </div>
                );
              })
            ) : (
              <span className="dashboard-muted">
                Os status aparecerão quando houver negociações.
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="bottom-grid">
        <div className="panel deals-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">OPORTUNIDADES</span>
              <h3>Negociações recentes</h3>
              <p>Consulte todas as oportunidades cadastradas.</p>
            </div>
            <span className="dashboard-muted">
              {numberFormatter(data.commercial.openDeals)} em aberto
            </span>
          </div>

          {data.recentDeals.length > 0 ? (
            <div className="deal-list">
              {data.recentDeals.map((deal) => (
                <div className="deal-row" key={deal.id}>
                  <div className="deal-avatar">
                    {(deal.title || "N").trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="deal-info">
                    <strong title={deal.title}>{deal.title}</strong>
                    <span>{deal.clientName || "Cliente não informado"}</span>
                    <span>
                      {deal.stage || getStatusLabel(deal.status)}
                      {` · ${deal.probability}% de probabilidade`}
                    </span>
                  </div>
                  <div className="deal-value">
                    <strong>{currencyFormatter(deal.value)}</strong>
                    <span className={`status-pill ${getDealStatusColor(deal.status)}`}>
                      {getStatusLabel(deal.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-list">
              <BriefcaseBusiness size={22} />
              <strong>Nenhuma negociação cadastrada</strong>
              <span>
                Quando sua empresa cadastrar oportunidades, elas aparecerão
                automaticamente aqui.
              </span>
            </div>
          )}
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="panel-kicker">WORKSPACE</span>
              <h3>Atividades recentes</h3>
              <p>Movimentações registradas no sistema.</p>
            </div>
            <button
              className="more-button"
              type="button"
              aria-label="Mais opções de atividades"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          {data.recentActivities.length > 0 ? (
            <div className="activity-list">
              {data.recentActivities.map((activity) => (
                <div className="activity-row" key={activity.id}>
                  <div className={`activity-icon ${getActivityColor(activity.type)}`}>
                    <Clock3 size={15} />
                  </div>
                  <div className="activity-info">
                    <strong>{activity.description || "Atividade registrada"}</strong>
                    <span>
                      {activity.userName || "Usuário"}
                      {activity.clientName ? ` · ${activity.clientName}` : ""}
                    </span>
                    <small>{formatDateTime(activity.createdAt)}</small>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="dashboard-empty-list">
              <Clock3 size={22} />
              <strong>Nenhuma atividade registrada</strong>
              <span>
                As movimentações realizadas pela equipe aparecerão neste
                histórico.
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="dashboard-footer">
        <span>TERVALYA CRM © 2026</span>
        <span>
          <TrendingUp size={12} />
          Gestão inteligente de relacionamentos
        </span>
      </div>
    </div>
  );
}
