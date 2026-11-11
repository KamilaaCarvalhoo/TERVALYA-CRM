import {

  useCallback,

  useEffect,

  useMemo,

  useState,

  type FormEvent,

} from "react";

import {

  AlertCircle,

  CalendarDays,

  Check,

  CheckCircle2,

  Circle,

  Clock3,

  Filter,

  ListTodo,

  LoaderCircle,

  Pencil,

  Plus,

  Search,

  Trash2,

  UserRound,

  X,

  XCircle,

  Flag,

} from "lucide-react";

import api from "../services/api";

import "./Tasks.css";

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";

type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

type Client = {

  id: string;

  name: string;

  email?: string | null;

};

type Task = {

  id: string;

  title: string;

  description?: string | null;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate?: string | null;

  clientId?: string | null;

  client?: Client | null;

  createdAt: string;

};

type TaskForm = {

  title: string;

  description: string;

  status: TaskStatus;

  priority: TaskPriority;

  dueDate: string;

  clientId: string;

};

const emptyForm: TaskForm = {

  title: "",

  description: "",

  status: "PENDING",

  priority: "MEDIUM",

  dueDate: "",

  clientId: "",

};

const priorityLabels: Record<TaskPriority, string> = {

  LOW: "Baixa",

  MEDIUM: "Média",

  HIGH: "Alta",

};

function isOverdue(task: Task) {

  if (!task.dueDate || task.status === "COMPLETED") {

    return false;

  }

  const due = new Date(task.dueDate);

  const today = new Date();

  due.setHours(0, 0, 0, 0);

  today.setHours(0, 0, 0, 0);

  return due < today;

}

function formatDate(value?: string | null) {

  if (!value) return "Sem prazo";

  return new Intl.DateTimeFormat("pt-BR").format(

    new Date(value)

  );

}

function formatDateInput(value?: string | null) {

  if (!value) return "";

  return new Date(value).toISOString().slice(0, 10);

}

export default function Tasks() {

  const [tasks, setTasks] = useState<Task[]>([]);

  const [clients, setClients] = useState<Client[]>([]);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [priorityFilter, setPriorityFilter] = useState("ALL");

  const [modalOpen, setModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<TaskForm>(emptyForm);

  const loadData = useCallback(async () => {

    setLoading(true);

    setError("");

    try {

      const [tasksResponse, clientsResponse] = await Promise.all([

        api.get<Task[]>("/tasks"),

        api.get<Client[]>("/clients"),

      ]);

      setTasks(tasksResponse.data);

      setClients(clientsResponse.data);

    } catch (err) {

      console.error("Erro ao carregar tarefas:", err);

      setError(

        "Não foi possível carregar as tarefas. Verifique sua conexão."

      );

    } finally {

      setLoading(false);

    }

  }, []);

  useEffect(() => {

    void loadData();

  }, [loadData]);

  const pendingTasks = tasks.filter(

    (task) => task.status === "PENDING"

  );

  const progressTasks = tasks.filter(

    (task) => task.status === "IN_PROGRESS"

  );

  const completedTasks = tasks.filter(

    (task) => task.status === "COMPLETED"

  );

  const overdueTasks = tasks.filter(isOverdue);

  const highPriorityTasks = tasks.filter(

    (task) =>

      task.priority === "HIGH" &&

      task.status !== "COMPLETED"

  );

  const filteredTasks = useMemo(() => {

    return tasks.filter((task) => {

      const term = search.toLowerCase();

      const matchesSearch =

        task.title.toLowerCase().includes(term) ||

        task.description?.toLowerCase().includes(term) ||

        task.client?.name?.toLowerCase().includes(term);

      const matchesStatus =

        statusFilter === "ALL" ||

        task.status === statusFilter;

      const matchesPriority =

        priorityFilter === "ALL" ||

        task.priority === priorityFilter;

      return (

        matchesSearch &&

        matchesStatus &&

        matchesPriority

      );

    });

  }, [tasks, search, statusFilter, priorityFilter]);

  const updateField = <K extends keyof TaskForm>(

    field: K,

    value: TaskForm[K]

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

  const openEditModal = (task: Task) => {

    setEditingId(task.id);

    setForm({

      title: task.title,

      description: task.description ?? "",

      status: task.status,

      priority: task.priority,

      dueDate: formatDateInput(task.dueDate),

      clientId: task.clientId ?? "",

    });

    setError("");

    setModalOpen(true);

  };

  const handleSubmit = async (

    event: FormEvent<HTMLFormElement>

  ) => {

    event.preventDefault();

    setError("");

    setSuccess("");

    if (form.title.trim().length < 2) {

      setError("Informe um título válido.");

      return;

    }

    setSaving(true);

    try {

      const payload = {

        title: form.title.trim(),

        description: form.description.trim() || null,

        status: form.status,

        priority: form.priority,

        dueDate: form.dueDate

          ? new Date(

              `${form.dueDate}T12:00:00`

            ).toISOString()

          : null,

        clientId: form.clientId || null,

      };

      if (editingId) {

        await api.patch(`/tasks/${editingId}`, payload);

        setSuccess("Tarefa atualizada com sucesso!");

      } else {

        await api.post("/tasks", payload);

        setSuccess("Tarefa cadastrada com sucesso!");

      }

      setModalOpen(false);

      setForm(emptyForm);

      setEditingId(null);

      await loadData();

    } catch (err: any) {

      console.error("Erro ao salvar tarefa:", err);

      setError(

        err.response?.data?.message ??

          "Não foi possível salvar a tarefa."

      );

    } finally {

      setSaving(false);

    }

  };

  const handleStatusChange = async (

    task: Task,

    status: TaskStatus

  ) => {

    try {

      await api.patch(`/tasks/${task.id}`, { status });

      setSuccess("Status atualizado com sucesso!");

      await loadData();

    } catch (err: any) {

      console.error("Erro ao atualizar status:", err);

      setError(

        err.response?.data?.message ??

          "Não foi possível atualizar o status."

      );

    }

  };

  const handleDelete = async (task: Task) => {

    const confirmed = window.confirm(

      `Deseja realmente excluir a tarefa "${task.title}"?`

    );

    if (!confirmed) return;

    try {

      await api.delete(`/tasks/${task.id}`);

      setSuccess("Tarefa excluída com sucesso!");

      await loadData();

    } catch (err: any) {

      console.error("Erro ao excluir tarefa:", err);

      setError(

        err.response?.data?.message ??

          "Não foi possível excluir a tarefa."

      );

    }

  };

  return (

    <div className="tasks-page">

      {/* CABEÇALHO */}

      <header className="tasks-heading">

        <div>

          <span className="tasks-eyebrow">

            <ListTodo size={14} />

            PRODUTIVIDADE E ORGANIZAÇÃO

          </span>

          <h1>Minhas tarefas</h1>

          <p>

            Organize atividades, acompanhe prazos e mantenha

            sua operação em movimento.

          </p>

        </div>

        <button

          className="task-primary-button"

          onClick={openCreateModal}

        >

          <Plus size={18} />

          Nova tarefa

        </button>

      </header>

      {/* MENSAGENS */}

      {error && (

        <div className="task-feedback error">

          <XCircle size={17} />

          <span>{error}</span>

          <button

            onClick={() => setError("")}

            aria-label="Fechar mensagem"

          >

            <X size={16} />

          </button>

        </div>

      )}

      {success && (

        <div className="task-feedback success">

          <CheckCircle2 size={17} />

          <span>{success}</span>

          <button

            onClick={() => setSuccess("")}

            aria-label="Fechar mensagem"

          >

            <X size={16} />

          </button>

        </div>

      )}

      {/* INDICADORES */}

      <section className="task-metrics">

        <article className="task-metric-card">

          <div className="task-metric-top">

            <span>Total de tarefas</span>

            <div className="task-metric-icon purple">

              <ListTodo size={20} />

            </div>

          </div>

          <strong>{tasks.length}</strong>

          <small>Atividades cadastradas</small>

        </article>

        <article className="task-metric-card">

          <div className="task-metric-top">

            <span>Pendentes</span>

            <div className="task-metric-icon cyan">

              <Clock3 size={20} />

            </div>

          </div>

          <strong>{pendingTasks.length}</strong>

          <small>Aguardando execução</small>

        </article>

        <article className="task-metric-card">

          <div className="task-metric-top">

            <span>Atrasadas</span>

            <div className="task-metric-icon gold">

              <AlertCircle size={20} />

            </div>

          </div>

          <strong>{overdueTasks.length}</strong>

          <small>Prazo ultrapassado</small>

        </article>

        <article className="task-metric-card">

          <div className="task-metric-top">

            <span>Concluídas</span>

            <div className="task-metric-icon green">

              <CheckCircle2 size={20} />

            </div>

          </div>

          <strong>{completedTasks.length}</strong>

          <small>Atividades finalizadas</small>

        </article>

      </section>

      {/* RESUMO DE PRODUTIVIDADE */}

      <section className="task-productivity">

        <div className="task-productivity-heading">

          <div>

            <span className="tasks-eyebrow">

              VISÃO DE PRODUTIVIDADE

            </span>

            <h2>Seu desempenho</h2>

            <p>

              Acompanhe o andamento das suas atividades.

            </p>

          </div>

          <div className="task-completion-number">

            {tasks.length > 0

              ? Math.round(

                  (completedTasks.length / tasks.length) * 100

                )

              : 0}

            <span>%</span>

          </div>

        </div>

        <div className="task-completion-track">

          <span

            style={{

              width: `${

                tasks.length > 0

                  ? (completedTasks.length / tasks.length) * 100

                  : 0

              }%`,

            }}

          />

        </div>

        <div className="task-productivity-footer">

          <span>

            <CheckCircle2 size={14} />

            {completedTasks.length} concluídas

          </span>

          <span>

            <Circle size={14} />

            {progressTasks.length} em andamento

          </span>

          <span>

            <Flag size={14} />

            {highPriorityTasks.length} de alta prioridade

          </span>

        </div>

      </section>

      {/* LISTA DE TAREFAS */}

      <section className="task-list-section">

        <div className="task-section-heading">

          <div>

            <span className="tasks-eyebrow">

              CENTRAL DE ATIVIDADES

            </span>

            <h2>Gerenciamento de tarefas</h2>

            <p>

              Organize suas atividades e acompanhe cada entrega.

            </p>

          </div>

          <span className="task-count">

            {filteredTasks.length} tarefas

          </span>

        </div>

        {/* FILTROS */}

        <div className="task-toolbar">

          <div className="task-search">

            <Search size={18} />

            <input

              value={search}

              onChange={(event) =>

                setSearch(event.target.value)

              }

              placeholder="Buscar tarefa, descrição ou cliente..."

            />

          </div>

          <label className="task-filter">

            <Filter size={15} />

            <select

              value={statusFilter}

              onChange={(event) =>

                setStatusFilter(event.target.value)

              }

            >

              <option value="ALL">Todos os status</option>

              <option value="PENDING">Pendentes</option>

              <option value="IN_PROGRESS">Em andamento</option>

              <option value="COMPLETED">Concluídas</option>

            </select>

          </label>

          <label className="task-filter">

            <Flag size={15} />

            <select

              value={priorityFilter}

              onChange={(event) =>

                setPriorityFilter(event.target.value)

              }

            >

              <option value="ALL">Todas as prioridades</option>

              <option value="HIGH">Alta</option>

              <option value="MEDIUM">Média</option>

              <option value="LOW">Baixa</option>

            </select>

          </label>

        </div>

        {/* CARREGAMENTO */}

        {loading ? (

          <div className="task-loading">

            <LoaderCircle className="task-spin" size={28} />

            <span>Carregando tarefas...</span>

          </div>

        ) : filteredTasks.length === 0 ? (

          <div className="task-empty">

            <div className="task-empty-icon">

              <ListTodo size={30} />

            </div>

            <h3>Nenhuma tarefa encontrada</h3>

            <p>

              Cadastre sua primeira atividade ou ajuste os

              filtros para visualizar os resultados.

            </p>

            <button

              className="task-primary-button"

              onClick={openCreateModal}

            >

              <Plus size={17} />

              Criar primeira tarefa

            </button>

          </div>

        ) : (

          <div className="task-table-wrapper">

            <table className="task-table">

              <thead>

                <tr>

                  <th>ATIVIDADE</th>

                  <th>CLIENTE</th>

                  <th>PRIORIDADE</th>

                  <th>VENCIMENTO</th>

                  <th>STATUS</th>

                  <th>AÇÕES</th>

                </tr>

              </thead>

              <tbody>

                {filteredTasks.map((task) => (

                  <tr key={task.id}>

                    <td>

                      <div className="task-name-cell">

                        <div className="task-name-icon">

                          {task.status === "COMPLETED" ? (

                            <CheckCircle2 size={17} />

                          ) : (

                            <Circle size={17} />

                          )}

                        </div>

                        <div>

                          <strong>{task.title}</strong>

                          {task.description && (

                            <small>{task.description}</small>

                          )}

                        </div>

                      </div>

                    </td>

                    <td>

                      <span className="task-client">

                        <UserRound size={14} />

                        {task.client?.name ?? "Sem cliente"}

                      </span>

                    </td>

                    <td>

                      <span

                        className={`task-priority ${task.priority.toLowerCase()}`}

                      >

                        <Flag size={13} />

                        {priorityLabels[task.priority]}

                      </span>

                    </td>

                    <td>

                      <span

                        className={`task-due ${

                          isOverdue(task) ? "overdue" : ""

                        }`}

                      >

                        <CalendarDays size={14} />

                        {formatDate(task.dueDate)}

                      </span>

                    </td>

                    <td>

                      <select

                        className={`task-status-select ${task.status.toLowerCase()}`}

                        value={task.status}

                        onChange={(event) =>

                          handleStatusChange(

                            task,

                            event.target.value as TaskStatus

                          )

                        }

                        aria-label={`Status de ${task.title}`}

                      >

                        <option value="PENDING">Pendente</option>

                        <option value="IN_PROGRESS">Em andamento</option>

                        <option value="COMPLETED">Concluída</option>

                      </select>

                    </td>

                    <td>

                      <div className="task-actions">

                        <button

                          onClick={() => openEditModal(task)}

                          title="Editar tarefa"

                          aria-label="Editar tarefa"

                        >

                          <Pencil size={15} />

                        </button>

                        <button

                          onClick={() => handleDelete(task)}

                          title="Excluir tarefa"

                          aria-label="Excluir tarefa"

                        >

                          <Trash2 size={15} />

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

      {/* MODAL */}

      {modalOpen && (

        <div

          className="task-modal-overlay"

          onMouseDown={(event) => {

            if (

              event.target === event.currentTarget &&

              !saving

            ) {

              setModalOpen(false);

            }

          }}

        >

          <div className="task-modal">

            <div className="task-modal-header">

              <div>

                <span className="tasks-eyebrow">

                  GESTÃO DE PRODUTIVIDADE

                </span>

                <h2>

                  {editingId ? "Editar tarefa" : "Nova tarefa"}

                </h2>

                <p>

                  Organize uma nova atividade da sua operação.

                </p>

              </div>

              <button

                type="button"

                onClick={() => setModalOpen(false)}

                disabled={saving}

                aria-label="Fechar"

              >

                <X size={20} />

              </button>

            </div>

            <form onSubmit={handleSubmit}>

              <label>

                Título da tarefa *

                <input

                  value={form.title}

                  onChange={(event) =>

                    updateField("title", event.target.value)

                  }

                  placeholder="Ex.: Entrar em contato com cliente"

                  maxLength={150}

                  required

                />

              </label>

              <label>

                Descrição

                <textarea

                  value={form.description}

                  onChange={(event) =>

                    updateField("description", event.target.value)

                  }

                  placeholder="Descreva os detalhes da atividade..."

                  rows={3}

                />

              </label>

              <label>

                Cliente relacionado

                <select

                  value={form.clientId}

                  onChange={(event) =>

                    updateField("clientId", event.target.value)

                  }

                >

                  <option value="">Nenhum cliente</option>

                  {clients.map((client) => (

                    <option key={client.id} value={client.id}>

                      {client.name}

                    </option>

                  ))}

                </select>

              </label>

              <div className="task-form-grid">

                <label>

                  Prioridade

                  <select

                    value={form.priority}

                    onChange={(event) =>

                      updateField(

                        "priority",

                        event.target.value as TaskPriority

                      )

                    }

                  >

                    <option value="LOW">Baixa</option>

                    <option value="MEDIUM">Média</option>

                    <option value="HIGH">Alta</option>

                  </select>

                </label>

                <label>

                  Data de vencimento

                  <input

                    type="date"

                    value={form.dueDate}

                    onChange={(event) =>

                      updateField("dueDate", event.target.value)

                    }

                  />

                </label>

              </div>

              {editingId && (

                <label>

                  Status da tarefa

                  <select

                    value={form.status}

                    onChange={(event) =>

                      updateField(

                        "status",

                        event.target.value as TaskStatus

                      )

                    }

                  >

                    <option value="PENDING">Pendente</option>

                    <option value="IN_PROGRESS">Em andamento</option>

                    <option value="COMPLETED">Concluída</option>

                  </select>

                </label>

              )}

              {error && (

                <div className="task-feedback error">

                  <XCircle size={16} />

                  {error}

                </div>

              )}

              <div className="task-modal-footer">

                <button

                  type="button"

                  className="task-secondary-button"

                  onClick={() => setModalOpen(false)}

                  disabled={saving}

                >

                  Cancelar

                </button>

                <button

                  type="submit"

                  className="task-primary-button"

                  disabled={saving}

                >

                  {saving ? (

                    <>

                      <LoaderCircle className="task-spin" size={17} />

                      Salvando...

                    </>

                  ) : (

                    <>

                      <Check size={17} />

                      {editingId

                        ? "Salvar alterações"

                        : "Cadastrar tarefa"}

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
