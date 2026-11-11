
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Search,
  Plus,
  Users,
  Building2,
  Mail,
  Phone,
  Pencil,
  Trash2,
  X,
  LoaderCircle,
  RefreshCw,
  UserRound,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";
import "./Clients.css";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  notes?: string | null;
  status: string;
  createdAt?: string;
}

interface ClientForm {
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  status: string;
}

const initialForm: ClientForm = {
  name: "",
  email: "",
  phone: "",
  company: "",
  notes: "",
  status: "ACTIVE",
};

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

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  return fallback;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(initialForm);

  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get<Client[]>("/clients");
      setClients(response.data);
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Não foi possível carregar os clientes."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return clients;

    return clients.filter((client) =>
      `${client.name} ${client.company ?? ""} ${client.email ?? ""} ${client.phone ?? ""}`
        .toLowerCase()
        .includes(term)
    );
  }, [clients, search]);

  function openCreateModal() {
    setEditingClient(null);
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setEditingClient(client);

    setForm({
      name: client.name,
      email: client.email ?? "",
      phone: client.phone ?? "",
      company: client.company ?? "",
      notes: client.notes ?? "",
      status: client.status || "ACTIVE",
    });

    setFormError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;

    setModalOpen(false);
    setEditingClient(null);
    setForm(initialForm);
    setFormError("");
  }

  function handleChange(
    field: keyof ClientForm,
    value: string
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
      setFormError("Informe o nome do cliente.");
      return;
    }

    setSaving(true);

    const payload = {
      name: form.name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      company: form.company.trim() || null,
      notes: form.notes.trim() || null,
      status: form.status,
    };

    try {
      if (editingClient) {
        await api.patch(
          `/clients/${editingClient.id}`,
          payload
        );

        setSuccess("Cliente atualizado com sucesso.");
      } else {
        await api.post("/clients", {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          company: payload.company,
          notes: payload.notes,
        });

        setSuccess("Cliente cadastrado com sucesso.");
      }

      setModalOpen(false);
      setEditingClient(null);
      setForm(initialForm);

      await loadClients();
    } catch (requestError) {
      setFormError(
        getErrorMessage(
          requestError,
          "Não foi possível salvar o cliente."
        )
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(
      `Deseja realmente excluir o cliente ${client.name}?`
    );

    if (!confirmed) return;

    setDeletingId(client.id);
    setError("");
    setSuccess("");

    try {
      await api.delete(`/clients/${client.id}`);

      setClients((current) =>
        current.filter((item) => item.id !== client.id)
      );

      setSuccess("Cliente excluído com sucesso.");
    } catch (requestError) {
      setError(
        getErrorMessage(
          requestError,
          "Não foi possível excluir o cliente. Ele pode possuir registros relacionados."
        )
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="dashboard clients-page">
      <div className="page-heading clients-heading">
        <div>
          <span className="eyebrow">RELACIONAMENTO</span>
          <h1>Clientes</h1>
          <p>
            Gerencie seus contatos e empresas em um só lugar.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openCreateModal}
        >
          <Plus size={18} />
          Novo cliente
        </button>
      </div>

      <div className="clients-summary">
        <div className="clients-summary-card">
          <div className="clients-summary-icon purple">
            <Users size={21} />
          </div>
          <div>
            <span>Total de clientes</span>
            <strong>{clients.length}</strong>
          </div>
        </div>

        <div className="clients-summary-card">
          <div className="clients-summary-icon cyan">
            <Building2 size={21} />
          </div>
          <div>
            <span>Empresas cadastradas</span>
            <strong>
              {
                new Set(
                  clients
                    .map((client) => client.company)
                    .filter(Boolean)
                ).size
              }
            </strong>
          </div>
        </div>

        <div className="clients-summary-card">
          <div className="clients-summary-icon green">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Clientes ativos</span>
            <strong>
              {
                clients.filter(
                  (client) => client.status === "ACTIVE"
                ).length
              }
            </strong>
          </div>
        </div>
      </div>

      {success && (
        <div className="clients-feedback success">
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
        <div className="clients-feedback error">
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

      <section className="panel clients-panel">
        <div className="clients-toolbar">
          <div>
            <h3>Todos os clientes</h3>
            <p>
              {filtered.length} de {clients.length} registros
            </p>
          </div>

          <div className="clients-toolbar-actions">
            <div className="search-box client-search">
              <Search size={17} />
              <input
                type="search"
                placeholder="Buscar clientes..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              {search && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearch("")}
                  aria-label="Limpar pesquisa"
                >
                  <X size={15} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="clients-refresh-button"
              onClick={() => void loadClients()}
              disabled={loading}
              title="Atualizar lista"
            >
              <RefreshCw
                size={17}
                className={loading ? "spinning" : ""}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="clients-state">
            <LoaderCircle className="spinning" size={28} />
            <h3>Carregando clientes</h3>
            <p>Estamos buscando os registros da sua empresa.</p>
          </div>
        ) : error && clients.length === 0 ? (
          <div className="clients-state">
            <AlertCircle size={30} />
            <h3>Não foi possível carregar</h3>
            <p>{error}</p>
            <button
              type="button"
              className="secondary-button"
              onClick={() => void loadClients()}
            >
              Tentar novamente
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="clients-state">
            <div className="clients-empty-icon">
              <Users size={28} />
            </div>

            <h3>
              {search
                ? "Nenhum resultado encontrado"
                : "Sua carteira começa aqui"}
            </h3>

            <p>
              {search
                ? "Tente pesquisar usando outro termo."
                : "Cadastre seu primeiro cliente e organize seus relacionamentos."}
            </p>

            {!search && (
              <button
                type="button"
                className="primary-button"
                onClick={openCreateModal}
              >
                <Plus size={17} />
                Cadastrar primeiro cliente
              </button>
            )}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>EMPRESA</th>
                  <th>CONTATO</th>
                  <th>STATUS</th>
                  <th className="actions-heading">AÇÕES</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id}>
                    <td>
                      <div className="client-name-cell">
                        <div className="client-avatar">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <strong>{client.name}</strong>
                      </div>
                    </td>

                    <td>
                      <div className="client-company-cell">
                        <Building2 size={15} />
                        {client.company || "Pessoa física"}
                      </div>
                    </td>

                    <td>
                      <div className="contact-cell">
                        <span>
                          <Mail size={14} />
                          {client.email || "E-mail não informado"}
                        </span>
                        <span>
                          <Phone size={14} />
                          {client.phone || "Telefone não informado"}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`status-pill ${
                          client.status === "ACTIVE"
                            ? "green"
                            : "neutral"
                        }`}
                      >
                        {client.status === "ACTIVE"
                          ? "Ativo"
                          : client.status}
                      </span>
                    </td>

                    <td>
                      <div className="client-row-actions">
                        <button
                          type="button"
                          onClick={() => openEditModal(client)}
                          title="Editar cliente"
                          aria-label={`Editar ${client.name}`}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          className="delete-action"
                          onClick={() => void handleDelete(client)}
                          disabled={deletingId === client.id}
                          title="Excluir cliente"
                          aria-label={`Excluir ${client.name}`}
                        >
                          {deletingId === client.id ? (
                            <LoaderCircle
                              size={16}
                              className="spinning"
                            />
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
          className="client-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeModal();
            }
          }}
        >
          <section
            className="client-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-modal-title"
          >
            <div className="client-modal-header">
              <div>
                <span className="eyebrow">
                  {editingClient ? "ATUALIZAÇÃO" : "NOVO REGISTRO"}
                </span>
                <h2 id="client-modal-title">
                  {editingClient ? "Editar cliente" : "Novo cliente"}
                </h2>
                <p>
                  Organize as informações de relacionamento.
                </p>
              </div>

              <button
                type="button"
                className="client-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Fechar"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="client-form-grid">
                <label className="client-form-field full">
                  <span>Nome completo *</span>
                  <div className="client-input-wrap">
                    <UserRound size={17} />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Nome do cliente"
                      value={form.name}
                      onChange={(event) =>
                        handleChange("name", event.target.value)
                      }
                      required
                      minLength={2}
                      maxLength={120}
                    />
                  </div>
                </label>

                <label className="client-form-field">
                  <span>E-mail</span>
                  <div className="client-input-wrap">
                    <Mail size={17} />
                    <input
                      type="email"
                      placeholder="cliente@email.com"
                      value={form.email}
                      onChange={(event) =>
                        handleChange("email", event.target.value)
                      }
                    />
                  </div>
                </label>

                <label className="client-form-field">
                  <span>Telefone</span>
                  <div className="client-input-wrap">
                    <Phone size={17} />
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      value={form.phone}
                      onChange={(event) =>
                        handleChange("phone", event.target.value)
                      }
                    />
                  </div>
                </label>

                <label className="client-form-field full">
                  <span>Empresa</span>
                  <div className="client-input-wrap">
                    <Building2 size={17} />
                    <input
                      type="text"
                      placeholder="Nome da empresa"
                      value={form.company}
                      onChange={(event) =>
                        handleChange("company", event.target.value)
                      }
                    />
                  </div>
                </label>

                {editingClient && (
                  <label className="client-form-field full">
                    <span>Status</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        handleChange("status", event.target.value)
                      }
                    >
                      <option value="ACTIVE">Ativo</option>
                      <option value="INACTIVE">Inativo</option>
                    </select>
                  </label>
                )}

                <label className="client-form-field full">
                  <span>Observações</span>
                  <textarea
                    rows={3}
                    placeholder="Adicione informações importantes sobre este cliente..."
                    value={form.notes}
                    onChange={(event) =>
                      handleChange("notes", event.target.value)
                    }
                  />
                </label>
              </div>

              {formError && (
                <div className="clients-feedback error form-feedback">
                  <AlertCircle size={17} />
                  {formError}
                </div>
              )}

              <div className="client-modal-footer">
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
                    <LoaderCircle size={17} className="spinning" />
                  ) : (
                    <Save size={17} />
                  )}

                  {saving
                    ? "Salvando..."
                    : editingClient
                      ? "Salvar alterações"
                      : "Cadastrar cliente"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
