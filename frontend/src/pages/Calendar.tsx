import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Plus,
  Search,
  Users,
  BriefcaseBusiness,
  X,
  Pencil,
  Trash2,
  CheckCircle2,
  CalendarCheck,
  CalendarClock,
  Ban,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import "./Calendar.css";
type AppointmentStatus = "SCHEDULED" | "COMPLETED" | "CANCELED";
type ViewMode = "month" | "week" | "day";
interface Client {
  id: string;
  name: string;
}
interface Deal {
  id: string;
  title: string;
  clientId: string;
}
interface Appointment {
  id: string;
  title: string;
  description?: string | null;
  startAt: string;
  endAt?: string | null;
  status: AppointmentStatus;
  location?: string | null;
  reminderAt?: string | null;
  clientId?: string | null;
  dealId?: string | null;
  client?: Client | null;
  deal?: Deal | null;
}
interface AppointmentForm {
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  reminderMinutes: string;
  clientId: string;
  dealId: string;
}
const emptyForm: AppointmentForm = {
  title: "",
  description: "",
  date: "",
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  reminderMinutes: "15",
  clientId: "",
  dealId: "",
};
const statusLabels: Record<AppointmentStatus, string> = {
  SCHEDULED: "Agendado",
  COMPLETED: "Realizado",
  CANCELED: "Cancelado",
};
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril",
  "Maio", "Junho", "Julho", "Agosto",
  "Setembro", "Outubro", "Novembro", "Dezembro",
];
const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
function pad(value: number) {
  return String(value).padStart(2, "0");
}
function dateKey(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
function getMonday(date: Date) {
  const result = new Date(date);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  result.setHours(0, 0, 0, 0);
  return result;
}
function getWeekDates(date: Date) {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return day;
  });
}
function getMonthDates(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = getMonday(first);
  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}
function getReminderDate(startAt: Date, minutes: number) {
  if (minutes === 0) return null;
  return new Date(
    startAt.getTime() - minutes * 60 * 1000,
  ).toISOString();
}
export default function Calendar() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [appointmentsResponse, clientsResponse, dealsResponse] =
        await Promise.all([
          api.get("/appointments"),
          api.get("/clients"),
          api.get("/deals"),
        ]);
      setAppointments(
        Array.isArray(appointmentsResponse.data)
          ? appointmentsResponse.data
          : [],
      );
      setClients(
        Array.isArray(clientsResponse.data)
          ? clientsResponse.data
          : [],
      );
      setDeals(
        Array.isArray(dealsResponse.data)
          ? dealsResponse.data
          : [],
      );
    } catch (err: any) {
      console.error("Erro ao carregar agenda:", err);
      setError(
        err.response?.data?.message ||
        "Não foi possível carregar os dados da agenda.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    loadData();
  }, [loadData]);
  const filteredAppointments = useMemo(() => {
    const term = search.toLowerCase().trim();
    return appointments.filter((appointment) => {
      if (!term) return true;
      return (
        appointment.title.toLowerCase().includes(term) ||
        appointment.description?.toLowerCase().includes(term) ||
        appointment.client?.name.toLowerCase().includes(term) ||
        appointment.location?.toLowerCase().includes(term)
      );
    });
  }, [appointments, search]);
  const todayAppointments = useMemo(() => {
    const today = dateKey(new Date());
    return filteredAppointments.filter(
      (item) => dateKey(new Date(item.startAt)) === today,
    );
  }, [filteredAppointments]);
  const upcomingAppointments = useMemo(() => {
    const now = Date.now();
    return filteredAppointments
      .filter(
        (item) =>
          item.status === "SCHEDULED" &&
          new Date(item.startAt).getTime() >= now,
      )
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime(),
      )
      .slice(0, 5);
  }, [filteredAppointments]);
  const scheduledCount = appointments.filter(
    (item) => item.status === "SCHEDULED",
  ).length;
  const completedCount = appointments.filter(
    (item) => item.status === "COMPLETED",
  ).length;
  const canceledCount = appointments.filter(
    (item) => item.status === "CANCELED",
  ).length;
  const monthDates = useMemo(
    () => getMonthDates(selectedDate),
    [selectedDate],
  );
  const weekDates = useMemo(
    () => getWeekDates(selectedDate),
    [selectedDate],
  );
  function appointmentsForDay(date: Date) {
    const key = dateKey(date);
    return filteredAppointments
      .filter(
        (item) => dateKey(new Date(item.startAt)) === key,
      )
      .sort(
        (a, b) =>
          new Date(a.startAt).getTime() -
          new Date(b.startAt).getTime(),
      );
  }
  function changePeriod(direction: number) {
    const next = new Date(selectedDate);
    if (view === "month") {
      next.setMonth(next.getMonth() + direction);
    } else if (view === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setDate(next.getDate() + direction);
    }
    setSelectedDate(next);
  }
  function openNewAppointment(date?: Date) {
    const target = date ?? selectedDate;
    setEditingId(null);
    setForm({
      ...emptyForm,
      date: dateKey(target),
    });
    setModalOpen(true);
  }
  function openEditAppointment(item: Appointment) {
    const start = new Date(item.startAt);
    const end = item.endAt ? new Date(item.endAt) : null;
    const reminder = item.reminderAt
      ? new Date(item.reminderAt)
      : null;
    const reminderMinutes = reminder
      ? Math.max(
          0,
          Math.round((start.getTime() - reminder.getTime()) / 60000),
        )
      : 0;
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description ?? "",
      date: dateKey(start),
      startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
      endTime: end
        ? `${pad(end.getHours())}:${pad(end.getMinutes())}`
        : "",
      location: item.location ?? "",
      reminderMinutes: String(reminderMinutes),
      clientId: item.clientId ?? "",
      dealId: item.dealId ?? "",
    });
    setModalOpen(true);
  }
  function updateForm<K extends keyof AppointmentForm>(
    field: K,
    value: AppointmentForm[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.date || !form.startTime) {
      setError("Preencha o título, a data e o horário de início.");
      return;
    }
    const startAt = new Date(
      `${form.date}T${form.startTime}:00`,
    );
    const endAt = form.endTime
      ? new Date(`${form.date}T${form.endTime}:00`)
      : null;
    if (Number.isNaN(startAt.getTime())) {
      setError("Data ou horário inválido.");
      return;
    }
    if (endAt && endAt <= startAt) {
      setError("O horário de término deve ser posterior ao início.");
      return;
    }
    const reminderAt = getReminderDate(
      startAt,
      Number(form.reminderMinutes),
    );
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      startAt: startAt.toISOString(),
      endAt: endAt?.toISOString() ?? null,
      location: form.location.trim() || null,
      reminderAt,
      clientId: form.clientId || null,
      dealId: form.dealId || null,
    };
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.patch(`/appointments/${editingId}`, payload);
      } else {
        await api.post("/appointments", payload);
      }
      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Não foi possível salvar o compromisso.",
      );
    } finally {
      setSaving(false);
    }
  }
  async function changeStatus(
    id: string,
    status: AppointmentStatus,
  ) {
    try {
      await api.patch(`/appointments/${id}`, { status });
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Não foi possível atualizar o compromisso.",
      );
    }
  }
  async function removeAppointment(id: string) {
    const confirmed = window.confirm(
      "Deseja realmente excluir este compromisso?",
    );
    if (!confirmed) return;
    try {
      await api.delete(`/appointments/${id}`);
      await loadData();
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Não foi possível excluir o compromisso.",
      );
    }
  }
  const periodLabel = view === "month"
    ? `${monthNames[selectedDate.getMonth()]} ${selectedDate.getFullYear()}`
    : view === "week"
      ? `${formatDate(weekDates[0])} — ${formatDate(weekDates[6])}`
      : formatDate(selectedDate);
  function renderAppointment(item: Appointment) {
    const start = new Date(item.startAt);
    return (
      <div
        key={item.id}
        className={`calendar-event event-${item.status.toLowerCase()}`}
        onClick={() => openEditAppointment(item)}
        title={item.title}
      >
        <strong>
          {pad(start.getHours())}:{pad(start.getMinutes())}
        </strong>
        <span>{item.title}</span>
      </div>
    );
  }
  return (
    <div className="calendar-page">
      <div className="calendar-heading">
        <div>
          <span className="eyebrow">TERVALYA CRM / ORGANIZAÇÃO</span>
          <h1>Agenda</h1>
          <p>Organize reuniões, compromissos e encontros com seus clientes.</p>
        </div>
        <button
          className="calendar-primary-button"
          onClick={() => openNewAppointment()}
        >
          <Plus size={18} />
          Novo compromisso
        </button>
      </div>
      {error && (
        <div className="calendar-error">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <X size={16} />
          </button>
        </div>
      )}
      <div className="calendar-metrics">
        <div className="calendar-metric">
          <div className="metric-icon purple">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Total de compromissos</span>
            <strong>{appointments.length}</strong>
          </div>
        </div>
        <div className="calendar-metric">
          <div className="metric-icon cyan">
            <CalendarClock size={21} />
          </div>
          <div>
            <span>Agendados</span>
            <strong>{scheduledCount}</strong>
          </div>
        </div>
        <div className="calendar-metric">
          <div className="metric-icon green">
            <CalendarCheck size={21} />
          </div>
          <div>
            <span>Realizados</span>
            <strong>{completedCount}</strong>
          </div>
        </div>
        <div className="calendar-metric">
          <div className="metric-icon gold">
            <Ban size={21} />
          </div>
          <div>
            <span>Cancelados</span>
            <strong>{canceledCount}</strong>
          </div>
        </div>
      </div>
      <div className="calendar-layout">
        <section className="calendar-main panel">
          <div className="calendar-toolbar">
            <div className="calendar-period">
              <button
                className="calendar-icon-button"
                onClick={() => changePeriod(-1)}
                aria-label="Período anterior"
              >
                <ChevronLeft size={19} />
              </button>
              <button
                className="calendar-icon-button"
                onClick={() => changePeriod(1)}
                aria-label="Próximo período"
              >
                <ChevronRight size={19} />
              </button>
              <h2>{periodLabel}</h2>
              <button
                className="calendar-today-button"
                onClick={() => setSelectedDate(new Date())}
              >
                Hoje
              </button>
            </div>
            <div className="calendar-view-switch">
              {(["month", "week", "day"] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  className={view === mode ? "selected" : ""}
                  onClick={() => setView(mode)}
                >
                  {mode === "month"
                    ? "Mês"
                    : mode === "week"
                      ? "Semana"
                      : "Dia"}
                </button>
              ))}
            </div>
          </div>
          <div className="calendar-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar compromisso, cliente ou local..."
            />
          </div>
          {loading ? (
            <div className="calendar-loading">
              <LoaderCircle size={28} className="spin" />
              <span>Carregando agenda...</span>
            </div>
          ) : view === "month" ? (
            <div className="month-calendar">
              <div className="month-weekdays">
                {weekDays.map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="month-grid">
                {monthDates.map((date) => {
                  const dayAppointments = appointmentsForDay(date);
                  const isCurrentMonth =
                    date.getMonth() === selectedDate.getMonth();
                  const isToday =
                    dateKey(date) === dateKey(new Date());
                  return (
                    <div
                      key={dateKey(date)}
                      className={`month-day ${
                        !isCurrentMonth ? "outside-month" : ""
                      } ${isToday ? "today" : ""}`}
                      onDoubleClick={() => openNewAppointment(date)}
                    >
                      <div className="month-day-heading">
                        <span>{date.getDate()}</span>
                        <button
                          onClick={() => openNewAppointment(date)}
                          title="Novo compromisso neste dia"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                      <div className="month-day-events">
                        {dayAppointments.slice(0, 3).map(renderAppointment)}
                        {dayAppointments.length > 3 && (
                          <span className="more-events">
                            +{dayAppointments.length - 3} compromissos
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : view === "week" ? (
            <div className="week-calendar">
              <div className="week-grid">
                {weekDates.map((date) => {
                  const dayAppointments = appointmentsForDay(date);
                  return (
                    <div className="week-column" key={dateKey(date)}>
                      <div className="week-column-heading">
                        <span>{weekDays[(date.getDay() + 6) % 7]}</span>
                        <strong>{date.getDate()}</strong>
                      </div>
                      <div className="week-column-events">
                        {dayAppointments.length === 0 ? (
                          <span className="empty-day">Sem eventos</span>
                        ) : (
                          dayAppointments.map(renderAppointment)
                        )}
                        <button
                          className="week-add-button"
                          onClick={() => openNewAppointment(date)}
                        >
                          <Plus size={15} />
                          Adicionar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="day-calendar">
              <div className="day-calendar-heading">
                <div>
                  <span>COMPROMISSOS DO DIA</span>
                  <h3>{formatDate(selectedDate)}</h3>
                </div>
                <button
                  className="calendar-primary-button"
                  onClick={() => openNewAppointment(selectedDate)}
                >
                  <Plus size={16} />
                  Adicionar
                </button>
              </div>
              {appointmentsForDay(selectedDate).length === 0 ? (
                <div className="calendar-empty">
                  <CalendarDays size={38} />
                  <strong>Nenhum compromisso neste dia</strong>
                  <span>Adicione uma reunião para começar.</span>
                </div>
              ) : (
                <div className="day-event-list">
                  {appointmentsForDay(selectedDate).map((item) => (
                    <AppointmentCard
                      key={item.id}
                      item={item}
                      onEdit={openEditAppointment}
                      onStatus={changeStatus}
                      onDelete={removeAppointment}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
        <aside className="calendar-aside">
          <section className="panel today-panel">
            <div className="aside-heading">
              <div>
                <span className="eyebrow">RESUMO</span>
                <h3>Hoje</h3>
              </div>
              <span className="today-count">
                {todayAppointments.length}
              </span>
            </div>
            {todayAppointments.length === 0 ? (
              <div className="aside-empty">
                <CalendarCheck size={27} />
                <span>Nenhum compromisso para hoje.</span>
              </div>
            ) : (
              <div className="aside-event-list">
                {todayAppointments.map((item) => (
                  <button
                    className="aside-event"
                    key={item.id}
                    onClick={() => openEditAppointment(item)}
                  >
                    <span className="aside-event-time">
                      {new Date(item.startAt).toLocaleTimeString(
                        "pt-BR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                    <strong>{item.title}</strong>
                    <small>{item.client?.name || "Sem cliente vinculado"}</small>
                  </button>
                ))}
              </div>
            )}
          </section>
          <section className="panel upcoming-panel">
            <div className="aside-heading">
              <div>
                <span className="eyebrow">PLANEJAMENTO</span>
                <h3>Próximos compromissos</h3>
              </div>
              <Clock3 size={19} />
            </div>
            {upcomingAppointments.length === 0 ? (
              <div className="aside-empty">
                <Clock3 size={27} />
                <span>Você não possui próximos compromissos.</span>
              </div>
            ) : (
              <div className="upcoming-list">
                {upcomingAppointments.map((item) => (
                  <div className="upcoming-item" key={item.id}>
                    <div className="upcoming-date">
                      <strong>
                        {new Date(item.startAt).getDate()}
                      </strong>
                      <span>
                        {new Date(item.startAt).toLocaleDateString(
                          "pt-BR",
                          { month: "short" },
                        )}
                      </span>
                    </div>
                    <div className="upcoming-info">
                      <strong>{item.title}</strong>
                      <span>
                        {new Date(item.startAt).toLocaleTimeString(
                          "pt-BR",
                          { hour: "2-digit", minute: "2-digit" },
                        )}
                      </span>
                      <small>
                        {item.client?.name || "Sem cliente vinculado"}
                      </small>
                    </div>
                    <button
                      onClick={() => openEditAppointment(item)}
                      aria-label="Editar compromisso"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
      {modalOpen && (
        <div
          className="appointment-modal-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalOpen(false);
            }
          }}
        >
          <form
            className="appointment-modal"
            onSubmit={handleSubmit}
          >
            <div className="appointment-modal-heading">
              <div>
                <span className="eyebrow">TERVALYA CRM / AGENDA</span>
                <h2>
                  {editingId ? "Editar compromisso" : "Novo compromisso"}
                </h2>
                <p>Preencha as informações do compromisso.</p>
              </div>
              <button
                type="button"
                className="calendar-icon-button"
                onClick={() => setModalOpen(false)}
              >
                <X size={19} />
              </button>
            </div>
            <div className="appointment-form-body">
              <label>
                Título do compromisso *
                <input
                  value={form.title}
                  onChange={(event) =>
                    updateForm("title", event.target.value)
                  }
                  placeholder="Ex.: Reunião comercial"
                  maxLength={150}
                  required
                />
              </label>
              <label>
                Descrição
                <textarea
                  value={form.description}
                  onChange={(event) =>
                    updateForm("description", event.target.value)
                  }
                  placeholder="Detalhes sobre o compromisso..."
                  rows={3}
                />
              </label>
              <div className="appointment-form-row">
                <label>
                  Data *
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      updateForm("date", event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Horário inicial *
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateForm("startTime", event.target.value)
                    }
                    required
                  />
                </label>
                <label>
                  Horário final
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateForm("endTime", event.target.value)
                    }
                  />
                </label>
              </div>
              <label>
                Local
                <input
                  value={form.location}
                  onChange={(event) =>
                    updateForm("location", event.target.value)
                  }
                  placeholder="Endereço ou link da reunião"
                />
              </label>
              <div className="appointment-form-row">
                <label>
                  Cliente
                  <select
                    value={form.clientId}
                    onChange={(event) => {
                      updateForm("clientId", event.target.value);
                      updateForm("dealId", "");
                    }}
                  >
                    <option value="">Sem cliente vinculado</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Negociação
                  <select
                    value={form.dealId}
                    onChange={(event) =>
                      updateForm("dealId", event.target.value)
                    }
                  >
                    <option value="">Sem negociação</option>
                    {deals
                      .filter(
                        (deal) =>
                          !form.clientId ||
                          deal.clientId === form.clientId,
                      )
                      .map((deal) => (
                        <option key={deal.id} value={deal.id}>
                          {deal.title}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <label>
                Lembrete
                <select
                  value={form.reminderMinutes}
                  onChange={(event) =>
                    updateForm("reminderMinutes", event.target.value)
                  }
                >
                  <option value="0">Sem lembrete</option>
                  <option value="5">5 minutos antes</option>
                  <option value="15">15 minutos antes</option>
                  <option value="30">30 minutos antes</option>
                  <option value="60">1 hora antes</option>
                  <option value="1440">1 dia antes</option>
                </select>
              </label>
              {editingId && (
                <div className="appointment-status-actions">
                  <span>Status do compromisso</span>
                  <button
                    type="button"
                    onClick={() =>
                      changeStatus(editingId, "SCHEDULED")
                    }
                  >
                    Agendado
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      changeStatus(editingId, "COMPLETED")
                    }
                  >
                    Realizado
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      changeStatus(editingId, "CANCELED")
                    }
                  >
                    Cancelado
                  </button>
                </div>
              )}
            </div>
            <div className="appointment-modal-footer">
              {editingId && (
                <button
                  type="button"
                  className="calendar-delete-button"
                  onClick={() => {
                    removeAppointment(editingId);
                    setModalOpen(false);
                  }}
                >
                  <Trash2 size={16} />
                  Excluir
                </button>
              )}
              <button
                type="button"
                className="calendar-secondary-button"
                onClick={() => setModalOpen(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="calendar-primary-button"
                disabled={saving}
              >
                {saving ? (
                  <LoaderCircle size={17} className="spin" />
                ) : (
                  <CheckCircle2 size={17} />
                )}
                {editingId ? "Salvar alterações" : "Criar compromisso"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
function AppointmentCard({
  item,
  onEdit,
  onStatus,
  onDelete,
}: {
  item: Appointment;
  onEdit: (item: Appointment) => void;
  onStatus: (id: string, status: AppointmentStatus) => void;
  onDelete: (id: string) => void;
}) {
  const start = new Date(item.startAt);
  return (
    <article className="day-appointment-card">
      <div className="day-appointment-time">
        <strong>
          {start.toLocaleTimeString("pt-BR", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </strong>
        <span>{statusLabels[item.status]}</span>
      </div>
      <div className="day-appointment-content">
        <h4>{item.title}</h4>
        {item.description && <p>{item.description}</p>}
        {item.client && (
          <span>
            <Users size={14} />
            {item.client.name}
          </span>
        )}
        {item.deal && (
          <span>
            <BriefcaseBusiness size={14} />
            {item.deal.title}
          </span>
        )}
        {item.location && (
          <span>
            <MapPin size={14} />
            {item.location}
          </span>
        )}
      </div>
      <div className="day-appointment-actions">
        <button
          onClick={() => onEdit(item)}
          title="Editar"
        >
          <Pencil size={16} />
        </button>
        {item.status === "SCHEDULED" && (
          <>
            <button
              onClick={() => onStatus(item.id, "COMPLETED")}
              title="Marcar como realizado"
            >
              <CheckCircle2 size={16} />
            </button>
            <button
              onClick={() => onStatus(item.id, "CANCELED")}
              title="Cancelar"
            >
              <Ban size={16} />
            </button>
          </>
        )}
        <button
          onClick={() => onDelete(item.id)}
          title="Excluir"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </article>
  );
}
