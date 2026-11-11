
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Search,
  Plus,
  Target,
  Users,
  CheckCircle2,
  Clock3,
  X,
  Pencil,
  Trash2,
  RefreshCw,
  LoaderCircle,
  Mail,
  Phone,
  Globe,
  UserRound,
  Save,
  AlertCircle,
  ArrowRightLeft,
  Filter,
  TrendingUp,
} from "lucide-react";

import api from "../services/api";
import "./Leads.css";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "LOST"
  | "CONVERTED";

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: LeadStatus;
  score: number;
  clientId?: string | null;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    company: string | null;
  } | null;
}

interface LeadForm {
  name: string;
  email: string;
  phone: string;
  source: string;
  score: number;
  status: LeadStatus;
}

const initialForm: LeadForm = {
  name: "",
  email: "",
  phone: "",
  source: "",
  score: 50,
  status: "NEW",
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  LOST: "Perdido",
  CONVERTED: "Convertido",
};

const statusOptions: LeadStatus[] = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "LOST",
  "CONVERTED",
];

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
}

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<LeadStatus | "ALL">("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [form, setForm] = useState<LeadForm>(initialForm);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Lead[]>("/leads");
      setLeads(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Não foi possível carregar os leads."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  const filteredLeads = useMemo(() => {
    const term = search.trim().toLowerCase();

    return leads.filter((lead) => {
      const matchesSearch =
        !term ||
        `${lead.name} ${lead.email ?? ""} ${lead.phone ?? ""} ${lead.source ?? ""}`
          .toLowerCase()
          .includes(term);

      const matchesStatus =
        activeFilter === "ALL" || lead.status === activeFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, search, activeFilter]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((lead) => lead.status === "NEW").length,
      qualified: leads.filter((lead) => lead.status === "QUALIFIED").length,
      converted: leads.filter((lead) => lead.status === "CONVERTED").length,
      averageScore: leads.length
        ? Math.round(
            leads.reduce((sum, lead) => sum + lead.score, 0) / leads.length
          )
        : 0,
    };
  }, [leads]);

  function openCreateModal() {
    setEditingLead(null);
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(lead: Lead) {
    setEditingLead(lead);
    setForm({
      name: lead.name,
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      source: lead.source ?? "",
      score: lead.score,
      status: lead.status,
    });
    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingLead(null);
    setForm(initialForm);
    setFormError("");
  }

  function changeField<K extends keyof LeadForm>(
    field: K,
    value: LeadForm[K]
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    setSuccess("");

    if (form.name.trim().length < 2) {
      setFormError("Informe o nome do lead.");
      return;
    }

    if (!Number.isInteger(form.score) || form.score < 0 || form.score > 100) {
      setFormError("A pontuação deve estar entre 0 e 100.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      source: form.source.trim() || null,
      score: form.score,
      ...(editingLead ? { status: form.status } : {}),
    };

    try {
      if (editingLead) {
        await api.patch(`/leads/${editingLead.id}`, payload);
        setSuccess("Lead atualizado com sucesso.");
      } else {
        await api.post("/leads", payload);
        setSuccess("Lead cadastrado com sucesso.");
      }

      setModalOpen(false);
      setEditingLead(null);
      setForm(initialForm);
      await loadLeads();
    } catch (requestError) {
      setFormError(
        getErrorMessage(
          requestError,
          "Não foi possível salvar o lead."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(lead: Lead) {
    if (lead.status === "CONVERTED") {
      setError("Leads convertidos não podem ser excluídos por esta tela.");
      return;
    }

    const confirmed = window.confirm(
      `Deseja realmente excluir o lead ${lead.name}?`
    );

    if (!confirmed) return;

    setDeletingId(lead.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/leads/${lead.id}`);
      setLeads((current) => current.filter((item) => item.id !== lead.id));
      setSuccess("Lead excluído com sucesso.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Não foi possível excluir o lead."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleConvert(lead: Lead) {
    if (lead.status === "CONVERTED" || lead.clientId) {
      setError("Este lead já foi convertido.");
      return;
    }

    const confirmed = window.confirm(
      `Deseja converter ${lead.name} em cliente?`
    );

    if (!confirmed) return;

    setConvertingId(lead.id);
    setError("");
    setSuccess("");

    try {
      await api.post(`/leads/${lead.id}/convert`);
      setSuccess(`${lead.name} foi convertido em cliente com sucesso.`);
      await loadLeads();
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Não foi possível converter este lead."
        )
      );
    } finally {
      setConvertingId(null);
    }
  }

  return (
    <div className="dashboard leads-page">
      <div className="page-heading leads-heading">
        <div>
          <span className="eyebrow">GESTÃO COMERCIAL</span>
          <h1>Leads</h1>
          <p>
            Acompanhe oportunidades e transforme contatos em clientes.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Novo lead
        </button>
      </div>

      <section className="leads-summary">
        <div className="leads-summary-card">
          <div className="leads-summary-icon purple">
            <Target size={21} />
          </div>
          <div>
            <span>Total de leads</span>
            <strong>{stats.total}</strong>
          </div>
        </div>

        <div className="leads-summary-card">
          <div className="leads-summary-icon cyan">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Novos leads</span>
            <strong>{stats.new}</strong>
          </div>
        </div>

        <div className="leads-summary-card">
          <div className="leads-summary-icon gold">
            <TrendingUp size={21} />
          </div>
          <div>
            <span>Qualificados</span>
            <strong>{stats.qualified}</strong>
          </div>
        </div>

        <div className="leads-summary-card">
          <div className="leads-summary-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Convertidos</span>
            <strong>{stats.converted}</strong>
          </div>
        </div>
      </section>

      <section className="leads-score-panel">
        <div className="leads-score-icon">
          <TrendingUp size={20} />
        </div>
        <div className="leads-score-copy">
          <strong>Pontuação média dos leads</strong>
          <span>Indicador baseado nos registros cadastrados.</span>
        </div>
        <div className="leads-score-value">
          {stats.averageScore}
          <small>/100</small>
        </div>
      </section>

      {success && (
        <div className="leads-feedback success">
          <CheckCircle2 size={17} />
          {success}
          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Fechar mensagem"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="leads-feedback error">
          <AlertCircle size={17} />
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Fechar mensagem"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className="panel leads-panel">
        <div className="leads-toolbar">
          <div>
            <h3>Pipeline comercial</h3>
            <p>
              {filteredLeads.length} de {leads.length} oportunidades
            </p>
          </div>

          <div className="leads-toolbar-actions">
            <div className="search-box leads-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Buscar leads..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button
                  type="button"
                  className="leads-search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Limpar busca"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="leads-refresh-button"
              onClick={() => void loadLeads()}
              disabled={loading}
              title="Atualizar leads"
            >
              <RefreshCw
                size={17}
                className={loading ? "leads-spinning" : ""}
              />
            </button>
          </div>
        </div>

        <div className="leads-filters">
          <div className="leads-filter-label">
            <Filter size={15} />
            Filtrar por etapa
          </div>

          <div className="leads-filter-list">
            <button
              type="button"
              className={activeFilter === "ALL" ? "active" : ""}
              onClick={() => setActiveFilter("ALL")}
            >
              Todos
              <span>{stats.total}</span>
            </button>

            {statusOptions.map((status) => (
              <button
                type="button"
                key={status}
                className={activeFilter === status ? "active" : ""}
                onClick={() => setActiveFilter(status)}
              >
                {statusLabels[status]}
                <span>
                  {leads.filter((lead) => lead.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="leads-state">
            <LoaderCircle size={29} className="leads-spinning" />
            <h3>Carregando oportunidades</h3>
            <p>Buscando os leads da sua empresa.</p>
          </div>
        ) : error && leads.length === 0 ? (
          <div className="leads-state">
            <AlertCircle size={30} />
            <h3>Não foi possível carregar</h3>
            <p>{error}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadLeads()}
            >
              Tentar novamente
            </button>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="leads-state">
            <div className="leads-empty-icon">
              <Users size={28} />
            </div>
            <h3>
              {search || activeFilter !== "ALL"
                ? "Nenhum lead encontrado"
                : "Seu pipeline começa aqui"}
            </h3>
            <p>
              {search || activeFilter !== "ALL"
                ? "Experimente alterar a pesquisa ou o filtro."
                : "Cadastre sua primeira oportunidade comercial."}
            </p>
            {!search && activeFilter === "ALL" && (
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Cadastrar primeiro lead
              </button>
            )}
          </div>
        ) : (
          <div className="leads-table-wrapper">
            <table className="leads-table">
              <thead>
                <tr>
                  <th>OPORTUNIDADE</th>
                  <th>ORIGEM</th>
                  <th>PONTUAÇÃO</th>
                  <th>ETAPA</th>
                  <th>DATA</th>
                  <th className="leads-actions-heading">AÇÕES</th>
                </tr>
              </thead>

              <tbody>
                {filteredLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td>
                      <div className="lead-person-cell">
                        <div className="lead-avatar">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{lead.name}</strong>
                          <span>{lead.email || "E-mail não informado"}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="lead-source-cell">
                        <Globe size={15} />
                        {lead.source || "Não informada"}
                      </div>
                    </td>

                    <td>
                      <div className="lead-score-cell">
                        <div className="lead-score-track">
                          <div
                            className="lead-score-fill"
                            style={{
                              width: `${Math.min(100, Math.max(0, lead.score))}%`,
                            }}
                          />
                        </div>
                        <strong>{lead.score}</strong>
                      </div>
                    </td>

                    <td>
                      <span className={`lead-status ${lead.status.toLowerCase()}`}>
                        {statusLabels[lead.status]}
                      </span>
                    </td>

                    <td>
                      <span className="lead-date">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </td>

                    <td>
                      <div className="lead-row-actions">
                        {lead.status !== "CONVERTED" && (
                          <button
                            type="button"
                            className="convert-action"
                            onClick={() => void handleConvert(lead)}
                            disabled={convertingId === lead.id}
                            title="Converter em cliente"
                            aria-label={`Converter ${lead.name} em cliente`}
                          >
                            {convertingId === lead.id ? (
                              <LoaderCircle size={16} className="leads-spinning" />
                            ) : (
                              <ArrowRightLeft size={16} />
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openEditModal(lead)}
                          title="Editar lead"
                          aria-label={`Editar ${lead.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="delete-action"
                          onClick={() => void handleDelete(lead)}
                          disabled={deletingId === lead.id}
                          title="Excluir lead"
                          aria-label={`Excluir ${lead.name}`}
                        >
                          {deletingId === lead.id ? (
                            <LoaderCircle size={16} className="leads-spinning" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen && (
        <div
          className="lead-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            className="lead-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lead-modal-title"
          >
            <div className="lead-modal-header">
              <div>
                <span className="eyebrow">
                  {editingLead ? "ATUALIZAÇÃO COMERCIAL" : "NOVA OPORTUNIDADE"}
                </span>
                <h2 id="lead-modal-title">
                  {editingLead ? "Editar lead" : "Novo lead"}
                </h2>
                <p>Preencha os dados da oportunidade comercial.</p>
              </div>

              <button
                type="button"
                className="lead-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="lead-form-grid">
                <label className="lead-form-field full">
                  <span>Nome do contato *</span>
                  <div className="lead-input-wrap">
                    <UserRound size={17} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nome completo"
                      value={form.name}
                      onChange={(event) => changeField("name", event.target.value)}
                      required
                      minLength={2}
                    />
                  </div>
                </label>

                <label className="lead-form-field">
                  <span>E-mail</span>
                  <div className="lead-input-wrap">
                    <Mail size={17} />
                    <input
                      type="email"
                      placeholder="contato@email.com"
                      value={form.email}
                      onChange={(event) => changeField("email", event.target.value)}
                    />
                  </div>
                </label>

                <label className="lead-form-field">
                  <span>Telefone</span>
                  <div className="lead-input-wrap">
                    <Phone size={17} />
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={form.phone}
                      onChange={(event) => changeField("phone", event.target.value)}
                    />
                  </div>
                </label>

                <label className="lead-form-field full">
                  <span>Origem do lead</span>
                  <div className="lead-input-wrap">
                    <Globe size={17} />
                    <select
                      value={form.source}
                      onChange={(event) => changeField("source", event.target.value)}
                    >
                      <option value="">Selecione a origem</option>
                      <option value="Site">Site</option>
                      <option value="Instagram">Instagram</option>
                      <option value="Indicação">Indicação</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Anúncio">Anúncio</option>
                      <option value="Evento">Evento</option>
                      <option value="Prospecção ativa">Prospecção ativa</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </label>

                <label className="lead-form-field full">
                  <span>
                    Pontuação do lead: <strong>{form.score}/100</strong>
                  </span>
                  <input
                    className="lead-score-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.score}
                    onChange={(event) =>
                      changeField("score", Number(event.target.value))
                    }
                  />
                  <small>
                    Avalie o potencial desta oportunidade comercial.
                  </small>
                </label>

                {editingLead && (
                  <label className="lead-form-field full">
                    <span>Etapa comercial</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        changeField("status", event.target.value as LeadStatus)
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {statusLabels[status]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {formError && (
                <div className="leads-feedback error lead-form-feedback">
                  <AlertCircle size={17} />
                  {formError}
                </div>
              )}

              <div className="lead-modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving ? (
                    <LoaderCircle size={17} className="leads-spinning" />
                  ) : (
                    <Save size={17} />
                  )}
                  {saving
                    ? "Salvando..."
                    : editingLead
                      ? "Salvar alterações"
                      : "Cadastrar lead"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
