import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Headset,
  Plus,
  Search,
  MessageCircle,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Send,
  ArrowLeft,
  X,
  LoaderCircle,
  RefreshCw,
  Ticket,
} from "lucide-react";

import api from "../services/api";
import "./Support.css";

// ======================================
// TIPOS
// ======================================

type TicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

type TicketCategory =
  | "GENERAL"
  | "TECHNICAL"
  | "BILLING"
  | "SUGGESTION";

interface TicketMessage {
  id: string;
  message: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

interface SupportTicket {
  id: string;
  number: number;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  _count?: {
    messages: number;
  };
  messages?: TicketMessage[];
  requester?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TicketSummary {
  total: number;
  open: number;
  inProgress: number;
  waitingUser: number;
  resolved: number;
  closed: number;
}

// ======================================
// TRADUÇÕES
// ======================================

const statusLabels: Record<TicketStatus, string> = {
  OPEN: "Aberto",
  IN_PROGRESS: "Em atendimento",
  WAITING_USER: "Aguardando resposta",
  RESOLVED: "Resolvido",
  CLOSED: "Fechado",
};

const priorityLabels: Record<TicketPriority, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

const categoryLabels: Record<TicketCategory, string> = {
  GENERAL: "Dúvida geral",
  TECHNICAL: "Problema técnico",
  BILLING: "Financeiro",
  SUGGESTION: "Sugestão",
};

// ======================================
// FUNÇÕES AUXILIARES
// ======================================

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error
  ) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string;
          };
        };
      }
    ).response;

    return response?.data?.message || fallback;
  }

  return fallback;
}

// ======================================
// COMPONENTE PRINCIPAL
// ======================================

export default function Support() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);

  const [summary, setSummary] = useState<TicketSummary>({
    total: 0,
    open: 0,
    inProgress: 0,
    waitingUser: 0,
    resolved: 0,
    closed: 0,
  });

  const [selectedTicket, setSelectedTicket] =
    useState<SupportTicket | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [closing, setClosing] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "GENERAL" as TicketCategory,
    priority: "NORMAL" as TicketPriority,
  });

  // ======================================
  // CARREGAR CHAMADOS E RESUMO
  // ======================================

  const loadSupport = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [ticketsResponse, summaryResponse] =
        await Promise.all([
          api.get("/support"),
          api.get("/support/summary"),
        ]);

      setTickets(ticketsResponse.data.tickets ?? []);

      setSummary(
        summaryResponse.data.summary ?? {
          total: 0,
          open: 0,
          inProgress: 0,
          waitingUser: 0,
          resolved: 0,
          closed: 0,
        }
      );
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível carregar a Central de Suporte."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSupport();
  }, [loadSupport]);

  // ======================================
  // FILTRAR CHAMADOS
  // ======================================

  const filteredTickets = tickets.filter((ticket) => {
    const term = search.toLowerCase().trim();

    return (
      ticket.subject.toLowerCase().includes(term) ||
      String(ticket.number).includes(term)
    );
  });

  // ======================================
  // ABRIR NOVO CHAMADO
  // ======================================

  async function handleCreateTicket(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setCreating(true);
      setError("");
      setSuccess("");

      await api.post("/support", {
        subject: form.subject.trim(),
        description: form.description.trim(),
        category: form.category,
        priority: form.priority,
      });

      setForm({
        subject: "",
        description: "",
        category: "GENERAL",
        priority: "NORMAL",
      });

      setShowForm(false);
      setSuccess("Seu chamado foi aberto com sucesso.");

      await loadSupport();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível abrir o chamado."
        )
      );
    } finally {
      setCreating(false);
    }
  }

  // ======================================
  // CONSULTAR DETALHES
  // ======================================

  async function openTicket(ticketId: string) {
    try {
      setLoadingDetails(true);
      setError("");
      setSuccess("");

      const response = await api.get(
        `/support/${ticketId}`
      );

      setSelectedTicket(response.data.ticket);
      setMessage("");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível abrir este chamado."
        )
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  // ======================================
  // ENVIAR MENSAGEM
  // ======================================

  async function handleSendMessage(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedTicket || !message.trim()) {
      return;
    }

    try {
      setSending(true);
      setError("");

      const response = await api.post(
        `/support/${selectedTicket.id}/messages`,
        {
          message: message.trim(),
        }
      );

      setSelectedTicket(response.data.ticket);
      setMessage("");

      await loadSupport();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível enviar sua mensagem."
        )
      );
    } finally {
      setSending(false);
    }
  }

  // ======================================
  // FECHAR CHAMADO
  // ======================================

  async function handleCloseTicket() {
    if (!selectedTicket) {
      return;
    }

    const confirmed = window.confirm(
      "Deseja realmente fechar este chamado?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setClosing(true);
      setError("");

      await api.patch(
        `/support/${selectedTicket.id}/close`
      );

      const response = await api.get(
        `/support/${selectedTicket.id}`
      );

      setSelectedTicket(response.data.ticket);

      setSuccess("Chamado fechado com sucesso.");

      await loadSupport();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível fechar o chamado."
        )
      );
    } finally {
      setClosing(false);
    }
  }

  // ======================================
  // VOLTAR PARA A LISTA
  // ======================================

  function backToList() {
    setSelectedTicket(null);
    setMessage("");
    setError("");
    setSuccess("");
  }

  // ======================================
  // CARREGAMENTO
  // ======================================

  if (loading && tickets.length === 0) {
    return (
      <div className="support-page">
        <div className="support-loading">
          <LoaderCircle
            size={34}
            className="support-spinner"
          />

          <strong>
            Carregando central de suporte...
          </strong>

          <span>
            Buscando suas solicitações.
          </span>
        </div>
      </div>
    );
  }

  // ======================================
  // TELA PRINCIPAL
  // ======================================

  return (
    <div className="support-page">
      {/* CABEÇALHO */}

      <div className="support-heading">
        <div>
          <span className="eyebrow">
            ATENDIMENTO TERVALYA
          </span>

          <h1>Central de suporte</h1>

          <p>
            Estamos aqui para ajudar você a aproveitar
            melhor o TERVALYA CRM.
          </p>
        </div>

        {!selectedTicket && (
          <button
            className="primary-button"
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccess("");
            }}
          >
            <Plus size={18} />
            Abrir chamado
          </button>
        )}
      </div>

      {/* MENSAGENS DE RETORNO */}

      {error && (
        <div className="support-alert support-alert-error">
          <AlertCircle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Fechar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {success && (
        <div className="support-alert support-alert-success">
          <CheckCircle2 size={17} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Fechar aviso"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {!selectedTicket ? (
        <>
          {/* RESUMO */}

          <section className="support-summary">
            <div className="support-summary-card">
              <div className="support-summary-icon purple">
                <Ticket size={20} />
              </div>

              <span>Total de chamados</span>

              <strong>{summary.total}</strong>
            </div>

            <div className="support-summary-card">
              <div className="support-summary-icon cyan">
                <Clock3 size={20} />
              </div>

              <span>Abertos</span>

              <strong>{summary.open}</strong>
            </div>

            <div className="support-summary-card">
              <div className="support-summary-icon blue">
                <Headset size={20} />
              </div>

              <span>Em atendimento</span>

              <strong>{summary.inProgress}</strong>
            </div>

            <div className="support-summary-card">
              <div className="support-summary-icon green">
                <CheckCircle2 size={20} />
              </div>

              <span>Resolvidos</span>

              <strong>{summary.resolved}</strong>
            </div>
          </section>

          {/* LISTA DE CHAMADOS */}

          <section className="support-panel">
            <div className="support-panel-heading">
              <div>
                <span className="panel-kicker">
                  ACOMPANHAMENTO
                </span>

                <h2>Meus chamados</h2>

                <p>
                  Consulte suas solicitações e acompanhe
                  as respostas.
                </p>
              </div>

              <button
                className="support-refresh-button"
                type="button"
                onClick={() => void loadSupport()}
                disabled={loading}
                aria-label="Atualizar chamados"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "support-spinner" : ""}
                />
              </button>
            </div>

            {/* PESQUISA */}

            <div className="support-search">
              <Search size={17} />

              <input
                type="text"
                placeholder="Pesquisar por assunto ou número..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
              />
            </div>

            {/* RESULTADOS */}

            {loading ? (
              <div className="support-list-loading">
                <LoaderCircle
                  size={22}
                  className="support-spinner"
                />

                Atualizando chamados...
              </div>
            ) : filteredTickets.length > 0 ? (
              <div className="support-ticket-list">
                {filteredTickets.map((ticket) => (
                  <button
                    className="support-ticket-item"
                    key={ticket.id}
                    type="button"
                    onClick={() =>
                      void openTicket(ticket.id)
                    }
                  >
                    <div className="support-ticket-icon">
                      <MessageCircle size={20} />
                    </div>

                    <div className="support-ticket-content">
                      <div className="support-ticket-title">
                        <strong>{ticket.subject}</strong>

                        <span>#{ticket.number}</span>
                      </div>

                      <div className="support-ticket-meta">
                        <span>
                          {categoryLabels[ticket.category]}
                        </span>

                        <span>•</span>

                        <span>
                          {formatDate(ticket.updatedAt)}
                        </span>
                      </div>
                    </div>

                    <div className="support-ticket-side">
                      <span
                        className={`support-status status-${ticket.status.toLowerCase()}`}
                      >
                        {statusLabels[ticket.status]}
                      </span>

                      <span className="support-ticket-priority">
                        Prioridade:{" "}
                        {priorityLabels[ticket.priority]}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="support-empty">
                <div className="support-empty-icon">
                  <Headset size={28} />
                </div>

                <h3>
                  {search
                    ? "Nenhum chamado encontrado"
                    : "Você ainda não possui chamados"}
                </h3>

                <p>
                  {search
                    ? "Tente pesquisar utilizando outro assunto ou número."
                    : "Quando precisar de ajuda, abra um chamado. Nossa equipe poderá acompanhar sua solicitação por aqui."}
                </p>

                {!search && (
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => setShowForm(true)}
                  >
                    <Plus size={17} />
                    Abrir primeiro chamado
                  </button>
                )}
              </div>
            )}
          </section>
        </>
      ) : (
        /* DETALHES E CONVERSA */

        <section className="support-panel support-conversation">
          <div className="support-conversation-heading">
            <button
              className="support-back-button"
              type="button"
              onClick={backToList}
            >
              <ArrowLeft size={17} />
              Voltar aos chamados
            </button>

            <div className="support-detail-title">
              <div>
                <span className="panel-kicker">
                  CHAMADO #{selectedTicket.number}
                </span>

                <h2>{selectedTicket.subject}</h2>

                <p>
                  Aberto em{" "}
                  {formatDate(selectedTicket.createdAt)}
                </p>
              </div>

              <span
                className={`support-status status-${selectedTicket.status.toLowerCase()}`}
              >
                {statusLabels[selectedTicket.status]}
              </span>
            </div>

            <div className="support-detail-info">
              <span>
                Categoria:{" "}
                <strong>
                  {categoryLabels[selectedTicket.category]}
                </strong>
              </span>

              <span>
                Prioridade:{" "}
                <strong>
                  {priorityLabels[selectedTicket.priority]}
                </strong>
              </span>
            </div>

            <div className="support-ticket-description">
              {selectedTicket.description}
            </div>
          </div>

          {/* CONVERSA */}

          <div className="support-message-list">
            {(selectedTicket.messages ?? []).map((item) => {
              const isCurrentUser =
                item.author.id === selectedTicket.requester?.id;

              return (
                <div
                  className={`support-message ${
                    isCurrentUser
                      ? "support-message-user"
                      : "support-message-team"
                  }`}
                  key={item.id}
                >
                  <div className="support-message-author">
                    <strong>{item.author.name}</strong>

                    <span>
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  <div className="support-message-bubble">
                    {item.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* RESPONDER */}

          {selectedTicket.status !== "CLOSED" &&
            selectedTicket.status !== "RESOLVED" && (
              <form
                className="support-reply-form"
                onSubmit={handleSendMessage}
              >
                <textarea
                  placeholder="Escreva sua mensagem para a equipe de suporte..."
                  value={message}
                  onChange={(event) =>
                    setMessage(event.target.value)
                  }
                  maxLength={5000}
                  rows={3}
                  required
                />

                <div className="support-reply-footer">
                  <span>
                    {message.length}/5000 caracteres
                  </span>

                  <button
                    className="primary-button"
                    type="submit"
                    disabled={sending || !message.trim()}
                  >
                    {sending ? (
                      <LoaderCircle
                        size={17}
                        className="support-spinner"
                      />
                    ) : (
                      <Send size={17} />
                    )}

                    Enviar mensagem
                  </button>
                </div>
              </form>
            )}

          {/* FECHAR CHAMADO */}

          {selectedTicket.status !== "CLOSED" &&
            selectedTicket.status !== "RESOLVED" && (
              <div className="support-close-area">
                <button
                  className="support-close-button"
                  type="button"
                  onClick={() => void handleCloseTicket()}
                  disabled={closing}
                >
                  {closing
                    ? "Fechando..."
                    : "Fechar chamado"}
                </button>
              </div>
            )}

          {/* CHAMADO ENCERRADO */}

          {(selectedTicket.status === "CLOSED" ||
            selectedTicket.status === "RESOLVED") && (
            <div className="support-closed-notice">
              <CheckCircle2 size={18} />

              Este chamado está encerrado e não aceita
              novas mensagens.
            </div>
          )}
        </section>
      )}

      {/* FORMULÁRIO DE ABERTURA */}

      {showForm && (
        <div
          className="support-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowForm(false);
            }
          }}
        >
          <div
            className="support-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="support-modal-title"
          >
            <div className="support-modal-heading">
              <div>
                <span className="panel-kicker">
                  NOVO ATENDIMENTO
                </span>

                <h2 id="support-modal-title">
                  Abrir chamado
                </h2>

                <p>
                  Conte para nossa equipe como podemos ajudar.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Fechar formulário"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className="support-form"
              onSubmit={handleCreateTicket}
            >
              <label htmlFor="support-subject">
                Assunto
              </label>

              <input
                id="support-subject"
                type="text"
                placeholder="Ex.: Problema ao cadastrar cliente"
                value={form.subject}
                onChange={(event) =>
                  setForm({
                    ...form,
                    subject: event.target.value,
                  })
                }
                maxLength={150}
                required
              />

              <label htmlFor="support-category">
                Categoria
              </label>

              <select
                id="support-category"
                value={form.category}
                onChange={(event) =>
                  setForm({
                    ...form,
                    category: event.target.value as TicketCategory,
                  })
                }
              >
                <option value="GENERAL">Dúvida geral</option>
                <option value="TECHNICAL">
                  Problema técnico
                </option>
                <option value="BILLING">Financeiro</option>
                <option value="SUGGESTION">Sugestão</option>
              </select>

              <label htmlFor="support-priority">
                Prioridade
              </label>

              <select
                id="support-priority"
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority: event.target.value as TicketPriority,
                  })
                }
              >
                <option value="LOW">Baixa</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">Alta</option>
                <option value="URGENT">Urgente</option>
              </select>

              <label htmlFor="support-description">
                Descrição
              </label>

              <textarea
                id="support-description"
                placeholder="Descreva detalhadamente o que aconteceu..."
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description: event.target.value,
                  })
                }
                maxLength={5000}
                rows={5}
                required
              />

              <div className="support-form-footer">
                <span>
                  {form.description.length}/5000 caracteres
                </span>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={
                    creating ||
                    !form.subject.trim() ||
                    !form.description.trim()
                  }
                >
                  {creating ? (
                    <LoaderCircle
                      size={17}
                      className="support-spinner"
                    />
                  ) : (
                    <Plus size={17} />
                  )}

                  Enviar chamado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CARREGAMENTO DOS DETALHES */}

      {loadingDetails && (
        <div className="support-details-loading">
          <LoaderCircle
            size={22}
            className="support-spinner"
          />

          Abrindo chamado...
        </div>
      )}
    </div>
  );
}