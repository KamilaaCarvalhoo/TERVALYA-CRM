import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Filter,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Trophy,
  X,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import "./Deals.css";

type DealStatus = "OPEN" | "WON" | "LOST";

type Client = {
  id: string;
  name: string;
  email?: string | null;
};

type Deal = {
  id: string;
  title: string;
  value: number | string;
  probability: number;
  status: DealStatus;
  stage: string;
  expectedAt?: string | null;
  clientId: string;
  client: Client;
  createdAt: string;
};

type DealForm = {
  title: string;
  value: string;
  probability: number;
  stage: string;
  expectedAt: string;
  clientId: string;
  status: DealStatus;
};

const stages = [
  { id: "PROSPECTION", label: "Prospecção", color: "purple" },
  { id: "QUALIFICATION", label: "Qualificação", color: "blue" },
  { id: "PROPOSAL", label: "Proposta", color: "cyan" },
  { id: "NEGOTIATION", label: "Negociação", color: "gold" },
  { id: "CLOSING", label: "Fechamento", color: "green" },
];

const emptyForm: DealForm = {
  title: "",
  value: "",
  probability: 25,
  stage: "PROSPECTION",
  expectedAt: "",
  clientId: "",
  status: "OPEN",
};

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "Não definida";

  return new Intl.DateTimeFormat("pt-BR").format(new Date(value));
};

const getStageLabel = (stage: string) =>
  stages.find((item) => item.id === stage)?.label ?? stage;

const getStatusLabel = (status: DealStatus) => {
  const labels = {
    OPEN: "Em aberto",
    WON: "Ganha",
    LOST: "Perdida",
  };

  return labels[status];
};

export default function Deals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [stageFilter, setStageFilter] = useState("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DealForm>(emptyForm);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [dealsResponse, clientsResponse] = await Promise.all([
        api.get<Deal[]>("/deals"),
        api.get<Client[]>("/clients"),
      ]);

      setDeals(dealsResponse.data);
      setClients(clientsResponse.data);
    } catch (err) {
      console.error("Erro ao carregar negociações:", err);
      setError("Não foi possível carregar os dados. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const term = search.toLowerCase();

      const matchesSearch =
        deal.title.toLowerCase().includes(term) ||
        deal.client?.name?.toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "ALL" || deal.status === statusFilter;

      const matchesStage =
        stageFilter === "ALL" || deal.stage === stageFilter;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [deals, search, statusFilter, stageFilter]);

  const openDeals = deals.filter((deal) => deal.status === "OPEN");
  const wonDeals = deals.filter((deal) => deal.status === "WON");
  const lostDeals = deals.filter((deal) => deal.status === "LOST");

  const totalPipeline = openDeals.reduce(
    (total, deal) => total + Number(deal.value),
    0
  );

  const totalWon = wonDeals.reduce(
    (total, deal) => total + Number(deal.value),
    0
  );

  const weightedRevenue = openDeals.reduce(
    (total, deal) =>
      total + Number(deal.value) * (deal.probability / 100),
    0
  );

  const averageProbability =
    openDeals.length > 0
      ? Math.round(
          openDeals.reduce(
            (total, deal) => total + deal.probability,
            0
          ) / openDeals.length
        )
      : 0;

  const updateField = <K extends keyof DealForm>(
    field: K,
    value: DealForm[K]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  };

  const openEditModal = (deal: Deal) => {
    setEditingId(deal.id);

    setForm({
      title: deal.title,
      value: String(deal.value),
      probability: deal.probability,
      stage: deal.stage,
      expectedAt: deal.expectedAt
        ? deal.expectedAt.slice(0, 10)
        : "",
      clientId: deal.clientId,
      status: deal.status,
    });

    setError("");
    setModalOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.clientId) {
      setError("Selecione um cliente para continuar.");
      return;
    }

    const value = Number(form.value.replace(",", "."));

    if (!Number.isFinite(value) || value < 0) {
      setError("Informe um valor válido para a negociação.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        title: form.title.trim(),
        value,
        probability: Number(form.probability),
        stage: form.stage,
        expectedAt: form.expectedAt
          ? new Date(`${form.expectedAt}T12:00:00`).toISOString()
          : null,
        clientId: form.clientId,
        ...(editingId ? { status: form.status } : {}),
      };

      if (editingId) {
        await api.patch(`/deals/${editingId}`, payload);
        setSuccess("Negociação atualizada com sucesso!");
      } else {
        await api.post("/deals", payload);
        setSuccess("Negociação cadastrada com sucesso!");
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      console.error("Erro ao salvar negociação:", err);
      setError(
        err.response?.data?.message ??
          "Não foi possível salvar a negociação."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (deal: Deal) => {
    const confirmed = window.confirm(
      `Deseja realmente excluir a negociação "${deal.title}"?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/deals/${deal.id}`);
      setSuccess("Negociação excluída com sucesso!");
      await loadData();
    } catch (err: any) {
      console.error("Erro ao excluir negociação:", err);
      setError(
        err.response?.data?.message ??
          "Não foi possível excluir a negociação."
      );
    }
  };

  const moveDeal = async (deal: Deal, stage: string) => {
    try {
      await api.patch(`/deals/${deal.id}`, { stage });
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Não foi possível alterar a etapa."
      );
    }
  };

  const changeStatus = async (deal: Deal, status: DealStatus) => {
    try {
      await api.patch(`/deals/${deal.id}`, { status });
      setSuccess(`Negociação marcada como ${getStatusLabel(status).toLowerCase()}.`);
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ??
          "Não foi possível atualizar o status."
      );
    }
  };

  return (
    <div className="deals-page">
      <header className="deals-heading">
        <div>
          <span className="deals-eyebrow">
            <Sparkles size={14} /> PERFORMANCE COMERCIAL
          </span>

          <h1>Negociações</h1>

          <p>
            Gerencie oportunidades, acompanhe seu pipeline e impulsione
            seus resultados.
          </p>
        </div>

        <button className="deal-primary-button" onClick={openCreateModal}>
          <Plus size={18} />
          Nova negociação
        </button>
      </header>

      {error && (
        <div className="deal-feedback error">
          <XCircle size={17} />
          {error}
          <button onClick={() => setError("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="deal-feedback success">
          <Check size={17} />
          {success}
          <button onClick={() => setSuccess("")} aria-label="Fechar">
            <X size={16} />
          </button>
        </div>
      )}

      <section className="deal-metrics">
        <article className="deal-metric-card">
          <div className="deal-metric-top">
            <span>Pipeline aberto</span>
            <div className="deal-metric-icon purple">
              <BriefcaseBusiness size={20} />
            </div>
          </div>
          <strong>{currency(totalPipeline)}</strong>
          <small>{openDeals.length} oportunidades em aberto</small>
        </article>

        <article className="deal-metric-card">
          <div className="deal-metric-top">
            <span>Receita conquistada</span>
            <div className="deal-metric-icon green">
              <Trophy size={20} />
            </div>
          </div>
          <strong>{currency(totalWon)}</strong>
          <small>{wonDeals.length} negociações ganhas</small>
        </article>

        <article className="deal-metric-card">
          <div className="deal-metric-top">
            <span>Receita ponderada</span>
            <div className="deal-metric-icon cyan">
              <TrendingUp size={20} />
            </div>
          </div>
          <strong>{currency(weightedRevenue)}</strong>
          <small>Considerando a probabilidade</small>
        </article>

        <article className="deal-metric-card">
          <div className="deal-metric-top">
            <span>Conversão potencial</span>
            <div className="deal-metric-icon gold">
              <Target size={20} />
            </div>
          </div>
          <strong>{averageProbability}%</strong>
          <small>
            {lostDeals.length} negociações perdidas
          </small>
        </article>
      </section>

      <section className="deal-pipeline-section">
        <div className="deal-section-heading">
          <div>
            <span className="deals-eyebrow">VISÃO COMERCIAL</span>
            <h2>Pipeline de vendas</h2>
            <p>Acompanhe suas oportunidades em cada etapa.</p>
          </div>

          <span className="deal-total-count">
            {filteredDeals.length} oportunidades
          </span>
        </div>

        <div className="deal-toolbar">
          <div className="deal-search">
            <Search size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar negociação ou cliente..."
            />
          </div>

          <label className="deal-filter">
            <Filter size={16} />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="ALL">Todos os status</option>
              <option value="OPEN">Em aberto</option>
              <option value="WON">Ganhas</option>
              <option value="LOST">Perdidas</option>
            </select>
            <ChevronDown size={15} />
          </label>

          <label className="deal-filter">
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
            >
              <option value="ALL">Todas as etapas</option>
              {stages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.label}
                </option>
              ))}
            </select>
            <ChevronDown size={15} />
          </label>
        </div>

        {loading ? (
          <div className="deal-loading">
            <LoaderCircle className="spin" size={28} />
            <span>Carregando negociações...</span>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="deal-empty">
            <div className="deal-empty-icon">
              <CircleDollarSign size={30} />
            </div>
            <h3>Nenhuma negociação encontrada</h3>
            <p>
              Cadastre sua primeira oportunidade ou ajuste os filtros
              para visualizar os resultados.
            </p>
            <button
              className="deal-primary-button"
              onClick={openCreateModal}
            >
              <Plus size={17} />
              Criar negociação
            </button>
          </div>
        ) : (
          <div className="deal-kanban">
            {stages.map((stage) => {
              const stageDeals = filteredDeals.filter(
                (deal) =>
                  deal.stage === stage.id &&
                  deal.status === "OPEN"
              );

              const stageValue = stageDeals.reduce(
                (total, deal) => total + Number(deal.value),
                0
              );

              return (
                <div className="deal-column" key={stage.id}>
                  <div className="deal-column-heading">
                    <div className={`deal-stage-dot ${stage.color}`} />
                    <h3>{stage.label}</h3>
                    <span>{stageDeals.length}</span>
                  </div>

                  <strong className="deal-column-value">
                    {currency(stageValue)}
                  </strong>

                  <div className="deal-column-cards">
                    {stageDeals.map((deal) => (
                      <article className="deal-card" key={deal.id}>
                        <div className="deal-card-top">
                          <span className="deal-card-label">
                            OPORTUNIDADE
                          </span>

                          <div className="deal-card-actions">
                            <button
                              onClick={() => openEditModal(deal)}
                              title="Editar"
                              aria-label="Editar negociação"
                            >
                              <Pencil size={15} />
                            </button>

                            <button
                              onClick={() => handleDelete(deal)}
                              title="Excluir"
                              aria-label="Excluir negociação"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>

                        <h4>{deal.title}</h4>

                        <p className="deal-card-client">
                          <BriefcaseBusiness size={14} />
                          {deal.client?.name ?? "Cliente não identificado"}
                        </p>

                        <strong className="deal-card-value">
                          {currency(Number(deal.value))}
                        </strong>

                        <div className="deal-probability">
                          <div>
                            <span>Probabilidade</span>
                            <strong>{deal.probability}%</strong>
                          </div>

                          <div className="deal-progress">
                            <span
                              style={{
                                width: `${deal.probability}%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="deal-card-footer">
                          <span>
                            <CalendarDays size={13} />
                            {formatDate(deal.expectedAt)}
                          </span>

                          <select
                            value={deal.stage}
                            onChange={(event) =>
                              moveDeal(deal, event.target.value)
                            }
                            aria-label="Alterar etapa"
                          >
                            {stages.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="deal-card-status-actions">
                          <button
                            onClick={() => changeStatus(deal, "WON")}
                            title="Marcar como ganha"
                          >
                            <Check size={14} /> Ganha
                          </button>

                          <button
                            onClick={() => changeStatus(deal, "LOST")}
                            title="Marcar como perdida"
                          >
                            <XCircle size={14} /> Perdida
                          </button>
                        </div>
                      </article>
                    ))}

                    {stageDeals.length === 0 && (
                      <div className="deal-column-empty">
                        Nenhuma oportunidade nesta etapa
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="deal-results">
        <div className="deal-section-heading">
          <div>
            <span className="deals-eyebrow">RESULTADOS</span>
            <h2>Histórico de negociações</h2>
            <p>Negociações concluídas e oportunidades registradas.</p>
          </div>
        </div>

        <div className="deal-table-wrapper">
          <table className="deal-table">
            <thead>
              <tr>
                <th>Negociação</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Etapa</th>
                <th>Status</th>
                <th>Previsão</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {filteredDeals.map((deal) => (
                <tr key={deal.id}>
                  <td>
                    <strong>{deal.title}</strong>
                  </td>
                  <td>{deal.client?.name ?? "—"}</td>
                  <td className="deal-table-value">
                    {currency(Number(deal.value))}
                  </td>
                  <td>{getStageLabel(deal.stage)}</td>
                  <td>
                    <span className={`deal-status ${deal.status.toLowerCase()}`}>
                      {getStatusLabel(deal.status)}
                    </span>
                  </td>
                  <td>{formatDate(deal.expectedAt)}</td>
                  <td>
                    <div className="deal-table-actions">
                      <button
                        onClick={() => openEditModal(deal)}
                        title="Editar"
                        aria-label="Editar negociação"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(deal)}
                        title="Excluir"
                        aria-label="Excluir negociação"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDeals.length === 0 && (
                <tr>
                  <td colSpan={7} className="deal-table-empty">
                    Nenhum registro para exibir.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div
          className="deal-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <div className="deal-modal">
            <div className="deal-modal-header">
              <div>
                <span className="deals-eyebrow">
                  GESTÃO DE OPORTUNIDADES
                </span>
                <h2>
                  {editingId ? "Editar negociação" : "Nova negociação"}
                </h2>
                <p>
                  Preencha as informações comerciais da oportunidade.
                </p>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Fechar"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>
                Título da negociação *
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  placeholder="Ex.: Projeto de implantação CRM"
                  maxLength={150}
                  required
                />
              </label>

              <label>
                Cliente *
                <select
                  value={form.clientId}
                  onChange={(event) =>
                    updateField("clientId", event.target.value)
                  }
                  required
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </label>

              {clients.length === 0 && (
                <p className="deal-form-hint">
                  Cadastre um cliente antes de criar uma negociação.
                </p>
              )}

              <div className="deal-form-grid">
                <label>
                  Valor da negociação (R$) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.value}
                    onChange={(event) =>
                      updateField("value", event.target.value)
                    }
                    placeholder="0,00"
                    required
                  />
                </label>

                <label>
                  Previsão de fechamento
                  <input
                    type="date"
                    value={form.expectedAt}
                    onChange={(event) =>
                      updateField("expectedAt", event.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                Etapa comercial
                <select
                  value={form.stage}
                  onChange={(event) =>
                    updateField("stage", event.target.value)
                  }
                >
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>
                      {stage.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Probabilidade de fechamento: {form.probability}%
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={form.probability}
                  onChange={(event) =>
                    updateField("probability", Number(event.target.value))
                  }
                  className="deal-range"
                />
              </label>

              {editingId && (
                <label>
                  Status da negociação
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField(
                        "status",
                        event.target.value as DealStatus
                      )
                    }
                  >
                    <option value="OPEN">Em aberto</option>
                    <option value="WON">Ganha</option>
                    <option value="LOST">Perdida</option>
                  </select>
                </label>
              )}

              {error && (
                <div className="deal-feedback error">
                  <XCircle size={16} />
                  {error}
                </div>
              )}

              <div className="deal-modal-footer">
                <button
                  type="button"
                  className="deal-secondary-button"
                  onClick={() => setModalOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="deal-primary-button"
                  disabled={saving || clients.length === 0}
                >
                  {saving ? (
                    <>
                      <LoaderCircle className="spin" size={17} />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Check size={17} />
                      {editingId ? "Salvar alterações" : "Cadastrar negociação"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
