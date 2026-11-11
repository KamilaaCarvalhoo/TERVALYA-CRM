

import { useEffect, useRef, useState } from "react";

import {

  UserRound,

  Building2,

  SlidersHorizontal,

  Bell,

  ShieldCheck,

  Save,

  Camera,

  LockKeyhole,

  Check,

  AlertCircle,

  LoaderCircle,

  ImagePlus,

  Upload,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Globe2,
  Clock3,
  LogOut,
  RefreshCw,
} from "lucide-react";

import api from "../services/api";

import "./Settings.css";

type SettingsSection =

  | "profile"

  | "company"

  | "preferences"

  | "notifications"

  | "security";

type ProfileData = {

  id: string;

  name: string;

  email: string;

  role: string;

  phone: string;

  avatarUrl: string;

};

type CompanyData = {

  id: string;

  name: string;

  slug: string;

  tradeName: string;

  cnpj: string;

  email: string;

  phone: string;

  website: string;

  logoUrl: string;

  zipCode: string;

  address: string;

  addressNumber: string;

  complement: string;

  neighborhood: string;

  city: string;

  state: string;

  country: string;

} | null;

type PreferencesData = {

  language: string;

  dateFormat: string;

  timezone: string;

  theme: string;

};

type NotificationsData = {

  tasks: boolean;

  leads: boolean;

  appointments: boolean;

  deals: boolean;

  emailEnabled: boolean;

  inAppEnabled: boolean;

};

type SettingsResponse = {

  profile: ProfileData;

  company: CompanyData;

  preferences: PreferencesData | null;

  notifications: NotificationsData | null;

};

type SessionData = {
  id: string;
  device: string;
  ipAddress: string | null;
  createdAt: string;
  lastActiveAt: string;
  expiresAt: string;
  isCurrent: boolean;
};

const roleLabels: Record<string, string> = {

  ADMIN: "Administrador",

  MANAGER: "Gerente",

  SALES: "Comercial",

};

const defaultPreferences: PreferencesData = {

  language: "pt-BR",

  dateFormat: "dd/MM/yyyy",

  timezone: "America/Sao_Paulo",

  theme: "dark",

};

const defaultNotifications: NotificationsData = {

  tasks: true,

  leads: true,

  appointments: true,

  deals: false,

  emailEnabled: true,

  inAppEnabled: true,

};

const emptyCompany = {

  name: "",

  tradeName: "",

  cnpj: "",

  email: "",

  phone: "",

  website: "",

  logoUrl: "",

  zipCode: "",

  address: "",

  addressNumber: "",

  complement: "",

  neighborhood: "",

  city: "",

  state: "",

  country: "Brasil",

};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [

  "image/jpeg",

  "image/png",

  "image/webp",

];

export default function Settings() {

  const [activeSection, setActiveSection] =

    useState<SettingsSection>("profile");

  const [profile, setProfile] = useState({

    name: "",

    email: "",

    role: "",

    phone: "",

    avatarUrl: "",

  });

  const [company, setCompany] = useState(emptyCompany);

  const [companyLinked, setCompanyLinked] = useState(false);

  const [preferences, setPreferences] =

    useState<PreferencesData>(defaultPreferences);

  const [notifications, setNotifications] =

    useState<NotificationsData>(defaultNotifications);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [changingPassword, setChangingPassword] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSessionId, setRevokingSessionId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const profileInputRef = useRef<HTMLInputElement>(null);

  const companyLogoInputRef = useRef<HTMLInputElement>(null);

  const sections = [

    { id: "profile", label: "Meu perfil", icon: UserRound },

    { id: "company", label: "Empresa", icon: Building2 },

    { id: "preferences", label: "Preferências", icon: SlidersHorizontal },

    { id: "notifications", label: "Notificações", icon: Bell },

    { id: "security", label: "Segurança", icon: ShieldCheck },

  ] as const;

  // ======================================


  // ======================================

  useEffect(() => {

    async function loadSettings() {

      try {

        setLoading(true);

        setError("");

        const response = await api.get<SettingsResponse>("/settings");

        const data = response.data;

        setProfile({

          name: data.profile?.name ?? "",

          email: data.profile?.email ?? "",

          role: data.profile?.role ?? "",

          phone: data.profile?.phone ?? "",

          avatarUrl: data.profile?.avatarUrl ?? "",

        });

        if (data.company) {

          setCompanyLinked(true);

          setCompany({

            name: data.company.name ?? "",

            tradeName: data.company.tradeName ?? "",

            cnpj: data.company.cnpj ?? "",

            email: data.company.email ?? "",

            phone: data.company.phone ?? "",

            website: data.company.website ?? "",

            logoUrl: data.company.logoUrl ?? "",

            zipCode: data.company.zipCode ?? "",

            address: data.company.address ?? "",

            addressNumber: data.company.addressNumber ?? "",

            complement: data.company.complement ?? "",

            neighborhood: data.company.neighborhood ?? "",

            city: data.company.city ?? "",

            state: data.company.state ?? "",

            country: data.company.country ?? "Brasil",

          });

        } else {

          setCompanyLinked(false);

        }

        setPreferences({

          ...defaultPreferences,

          ...(data.preferences ?? {}),

        });

        setNotifications({

          ...defaultNotifications,

          ...(data.notifications ?? {}),

        });

      } catch (err) {

        console.error("Erro ao carregar configurações:", err);

        setError(

          "Não foi possível carregar suas configurações. Verifique sua conexão e tente novamente."

        );

      } finally {

        setLoading(false);

      }

    }

    loadSettings();

  }, []);


  // ATUALIZAR ESTADOS


  const updateProfileField = (

    field: keyof typeof profile,

    value: string

  ) => {

    setProfile((current) => ({

      ...current,

      [field]: value,

    }));

  };

  const updateCompanyField = (

    field: keyof typeof company,

    value: string

  ) => {

    setCompany((current) => ({

      ...current,

      [field]: value,

    }));

  };

  const updatePreference = (

    field: keyof PreferencesData,

    value: string

  ) => {

    setPreferences((current) => ({

      ...current,

      [field]: value,

    }));

  };

  const toggleNotification = (

    key: keyof NotificationsData

  ) => {

    setNotifications((current) => ({

      ...current,

      [key]: !current[key],

    }));

  };

  // ======================================


  // ======================================

  const validateImage = (file: File): boolean => {

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {

      setError("Formato inválido. Escolha uma imagem JPG, PNG ou WEBP.");

      return false;

    }

    if (file.size > MAX_IMAGE_SIZE) {

      setError("A imagem deve ter no máximo 5 MB.");

      return false;

    }

    return true;

  };


  // ENVIAR FOTO DE PERFIL


  const handleProfilePhotoUpload = async (

    event: React.ChangeEvent<HTMLInputElement>

  ) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    setSuccess("");

    if (!validateImage(file)) {

      event.target.value = "";

      return;

    }

    const formData = new FormData();

    formData.append("image", file);

    try {

      setUploadingPhoto(true);

      const response = await api.post(

        "/settings/profile/photo",

        formData

      );

      setProfile((current) => ({

        ...current,

        avatarUrl: response.data.profile.avatarUrl,

      }));

      setSuccess("Foto de perfil atualizada com sucesso.");

    } catch (err: any) {

      console.error("Erro ao enviar foto:", err);

      setError(

        err.response?.data?.message ||

          "Não foi possível enviar sua foto. Tente novamente."

      );

    } finally {

      setUploadingPhoto(false);

      event.target.value = "";

    }

  };

  // ======================================


  // ======================================

  const handleCompanyLogoUpload = async (

    event: React.ChangeEvent<HTMLInputElement>

  ) => {

    const file = event.target.files?.[0];

    if (!file) return;

    setError("");

    setSuccess("");

    if (!validateImage(file)) {

      event.target.value = "";

      return;

    }

    const formData = new FormData();

    formData.append("image", file);

    try {

      setUploadingLogo(true);

      const response = await api.post(

        "/settings/company/logo",

        formData

      );

      setCompany((current) => ({

        ...current,

        logoUrl: response.data.company.logoUrl,

      }));

      setSuccess("Logotipo da empresa atualizado com sucesso.");

    } catch (err: any) {

      console.error("Erro ao enviar logotipo:", err);

      setError(

        err.response?.data?.message ||

          "Não foi possível enviar o logotipo. Tente novamente."

      );

    } finally {

      setUploadingLogo(false);

      event.target.value = "";

    }

  };


  // SALVAR CONFIGURAÇÕES


  const saveSettings = async () => {

    try {

      setSaving(true);

      setError("");

      setSuccess("");

      if (activeSection === "profile") {

        if (!profile.name.trim() || !profile.email.trim()) {

          setError("Nome e e-mail são obrigatórios.");

          return;

        }

        const response = await api.patch("/settings/profile", {

          name: profile.name.trim(),

          email: profile.email.trim(),

          phone: profile.phone,

        });

        setProfile((current) => ({

          ...current,

          name: response.data.profile.name,

          email: response.data.profile.email,

          phone: response.data.profile.phone ?? "",

        }));

        setSuccess("Seu perfil foi atualizado com sucesso.");

      }

      if (activeSection === "company") {

        if (!companyLinked) {

          setError("Esta conta não possui uma empresa vinculada.");

          return;

        }

        if (!company.name.trim()) {

          setError("Informe o nome da empresa.");

          return;

        }

        const response = await api.patch("/settings/company", {

          ...company,

          name: company.name.trim(),

        });

        const savedCompany = response.data.company;

        setCompany({

          name: savedCompany.name ?? "",

          tradeName: savedCompany.tradeName ?? "",

          cnpj: savedCompany.cnpj ?? "",

          email: savedCompany.email ?? "",

          phone: savedCompany.phone ?? "",

          website: savedCompany.website ?? "",

          logoUrl: savedCompany.logoUrl ?? "",

          zipCode: savedCompany.zipCode ?? "",

          address: savedCompany.address ?? "",

          addressNumber: savedCompany.addressNumber ?? "",

          complement: savedCompany.complement ?? "",

          neighborhood: savedCompany.neighborhood ?? "",

          city: savedCompany.city ?? "",

          state: savedCompany.state ?? "",

          country: savedCompany.country ?? "Brasil",

        });

        setSuccess("Os dados da empresa foram atualizados.");

      }

      if (activeSection === "preferences") {

        const response = await api.patch(

          "/settings/preferences",

          preferences

        );

        setPreferences({

          ...defaultPreferences,

          ...response.data.preferences,

        });

        setSuccess("Suas preferências foram salvas com sucesso.");

      }

      if (activeSection === "notifications") {

        const response = await api.patch(

          "/settings/notifications",

          notifications

        );

        setNotifications({

          ...defaultNotifications,

          ...response.data.notifications,

        });

        setSuccess("Suas notificações foram atualizadas.");

      }

    } catch (err: any) {

      console.error("Erro ao salvar configurações:", err);

      setError(

        err.response?.data?.message ??

          "Não foi possível salvar as alterações. Tente novamente."

      );

    } finally {

      setSaving(false);

    }

  };

  // ======================================


  // ======================================

  // ======================================
  // ALTERAR SENHA
  // ======================================

  const handleChangePassword = async () => {
    setError("");
    setSuccess("");

    const { currentPassword, newPassword, confirmPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Preencha todos os campos de senha.");
      return;
    }

    if (newPassword.length < 8 || newPassword.length > 72) {
      setError("A nova senha deve ter entre 8 e 72 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("A confirmação da nova senha não corresponde.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("A nova senha deve ser diferente da senha atual.");
      return;
    }

    try {
      setChangingPassword(true);

      const response = await api.patch("/auth/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowPasswords({ current: false, new: false, confirm: false });
      setSuccess(response.data.message || "Senha alterada com sucesso.");
    } catch (err: any) {
      console.error("Erro ao alterar senha:", err);
      setError(
        err.response?.data?.message ||
          "Não foi possível alterar sua senha. Tente novamente."
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const loadSessions = async () => {
    try {
      setLoadingSessions(true);
      const response = await api.get("/sessions");
      setSessions(response.data.sessions ?? []);
    } catch (err: any) {
      console.error("Erro ao carregar sessões:", err);
      setError(
        err.response?.data?.message ||
          "Não foi possível carregar os dispositivos conectados."
      );
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeSection === "security") {
      loadSessions();
    }
  }, [activeSection]);

  const revokeSession = async (session: SessionData) => {
    if (session.isCurrent) return;

    const confirmed = window.confirm(
      `Deseja encerrar a sessão de ${session.device}?`
    );
    if (!confirmed) return;

    try {
      setRevokingSessionId(session.id);
      setError("");
      await api.delete(`/sessions/${session.id}`);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      setSuccess("Sessão encerrada com sucesso.");
    } catch (err: any) {
      console.error("Erro ao encerrar sessão:", err);
      setError(
        err.response?.data?.message || "Não foi possível encerrar esta sessão."
      );
    } finally {
      setRevokingSessionId(null);
    }
  };

  const revokeOtherSessions = async () => {
    const otherSessions = sessions.filter((session) => !session.isCurrent);
    if (otherSessions.length === 0) return;

    const confirmed = window.confirm(
      `Deseja encerrar as ${otherSessions.length} outras sessões conectadas?`
    );
    if (!confirmed) return;

    try {
      setRevokingOthers(true);
      setError("");
      await api.post("/sessions/revoke-others");
      setSessions((current) => current.filter((session) => session.isCurrent));
      setSuccess("Todas as outras sessões foram encerradas.");
    } catch (err: any) {
      console.error("Erro ao encerrar outras sessões:", err);
      setError(
        err.response?.data?.message ||
          "Não foi possível encerrar as outras sessões."
      );
    } finally {
      setRevokingOthers(false);
    }
  };

  const formatSessionDate = (value: string) => {
    if (!value) return "Não disponível";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Não disponível";
    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const renderInput = (

    label: string,

    value: string,

    onChange: (value: string) => void,

    options?: {

      type?: string;

      placeholder?: string;

      disabled?: boolean;

      full?: boolean;

    }

  ) => (

    <label

      className={

        options?.full ? "settings-full-field" : undefined

      }

    >

      {label}

      <input

        type={options?.type ?? "text"}

        value={value}

        onChange={(event) => onChange(event.target.value)}

        placeholder={options?.placeholder ?? ""}

        disabled={options?.disabled}

      />

    </label>

  );


  // CONTEÚDO DAS SEÇÕES


  const renderContent = () => {

    switch (activeSection) {

      case "profile":

        return (

          <>

            <div className="settings-panel-heading">

              <div>

                <span>INFORMAÇÕES PESSOAIS</span>

                <h2>Meu perfil</h2>

                <p>

                  Gerencie suas informações de acesso ao TERVALYA CRM.

                </p>

              </div>

              <UserRound size={22} />

            </div>

            <div className="settings-avatar-area">

              <div className="settings-avatar">

                {profile.avatarUrl ? (

                  <img

                    src={profile.avatarUrl}

                    alt="Foto do perfil"

                  />

                ) : (

                  <UserRound size={34} />

                )}

              </div>

              <div className="settings-avatar-info">

                <strong>Foto do perfil</strong>

                <p>

                  Escolha uma imagem para personalizar sua conta.

                  Formatos JPG, PNG ou WEBP, até 5 MB.

                </p>

                <input

                  ref={profileInputRef}

                  type="file"

                  accept="image/jpeg,image/png,image/webp"

                  hidden

                  onChange={handleProfilePhotoUpload}

                />

                <button

                  type="button"

                  className="settings-secondary-button"

                  onClick={() => profileInputRef.current?.click()}

                  disabled={uploadingPhoto}

                >

                  {uploadingPhoto ? (

                    <LoaderCircle

                      size={15}

                      className="settings-spinner"

                    />

                  ) : (

                    <Camera size={15} />

                  )}

                  {uploadingPhoto ? "Enviando foto..." : "Alterar foto"}

                </button>

              </div>

            </div>

            <div className="settings-form-grid">

              {renderInput(

                "Nome completo",

                profile.name,

                (value) => updateProfileField("name", value),

                { placeholder: "Seu nome completo" }

              )}

              {renderInput(

                "E-mail",

                profile.email,

                (value) => updateProfileField("email", value),

                {

                  type: "email",

                  placeholder: "seu@email.com",

                }

              )}

              {renderInput(

                "Cargo",

                roleLabels[profile.role] ?? profile.role,

                () => {},

                { disabled: true }

              )}

              {renderInput(

                "Telefone",

                profile.phone,

                (value) => updateProfileField("phone", value),

                {

                  type: "tel",

                  placeholder: "(00) 00000-0000",

                }

              )}

            </div>

          </>

        );

      case "company":

        return (

          <>

            <div className="settings-panel-heading">

              <div>

                <span>DADOS CORPORATIVOS</span>

                <h2>Empresa</h2>

                <p>

                  Configure as informações da sua organização.

                </p>

              </div>

              <Building2 size={22} />

            </div>

            {companyLinked ? (

              <>

                <div className="settings-company-logo-area">

                  <div className="settings-company-logo">

                    {company.logoUrl ? (

                      <img

                        src={company.logoUrl}

                        alt="Logotipo da empresa"

                      />

                    ) : (

                      <ImagePlus size={30} />

                    )}

                  </div>

                  <div className="settings-company-logo-info">

                    <strong>Logotipo da empresa</strong>

                    <p>

                      Adicione a identidade visual da sua organização.

                      Formatos JPG, PNG ou WEBP, até 5 MB.

                    </p>

                    <input

                      ref={companyLogoInputRef}

                      type="file"

                      accept="image/jpeg,image/png,image/webp"

                      hidden

                      onChange={handleCompanyLogoUpload}

                    />

                    <button

                      type="button"

                      className="settings-secondary-button"

                      onClick={() =>

                        companyLogoInputRef.current?.click()

                      }

                      disabled={uploadingLogo}

                    >

                      {uploadingLogo ? (

                        <LoaderCircle

                          size={15}

                          className="settings-spinner"

                        />

                      ) : (

                        <Upload size={15} />

                      )}

                      {uploadingLogo

                        ? "Enviando logotipo..."

                        : "Alterar logotipo"}

                    </button>

                  </div>

                </div>

                <div className="settings-form-grid">

                  {renderInput(

                    "Razão social / Nome da empresa",

                    company.name,

                    (value) => updateCompanyField("name", value),

                    { full: true, placeholder: "Nome da empresa" }

                  )}

                  {renderInput(

                    "Nome fantasia",

                    company.tradeName,

                    (value) => updateCompanyField("tradeName", value),

                    { placeholder: "Nome fantasia" }

                  )}

                  {renderInput(

                    "CNPJ",

                    company.cnpj,

                    (value) => updateCompanyField("cnpj", value),

                    { placeholder: "00.000.000/0000-00" }

                  )}

                  {renderInput(

                    "E-mail corporativo",

                    company.email,

                    (value) => updateCompanyField("email", value),

                    {

                      type: "email",

                      placeholder: "empresa@email.com",

                    }

                  )}

                  {renderInput(

                    "Telefone comercial",

                    company.phone,

                    (value) => updateCompanyField("phone", value),

                    {

                      type: "tel",

                      placeholder: "(00) 0000-0000",

                    }

                  )}

                  {renderInput(

                    "Website",

                    company.website,

                    (value) => updateCompanyField("website", value),

                    {

                      type: "url",

                      placeholder: "https://www.empresa.com.br",

                    }

                  )}

                  {renderInput(

                    "CEP",

                    company.zipCode,

                    (value) => updateCompanyField("zipCode", value),

                    { placeholder: "00000-000" }

                  )}

                  {renderInput(

                    "Endereço",

                    company.address,

                    (value) => updateCompanyField("address", value),

                    { placeholder: "Rua, avenida..." }

                  )}

                  {renderInput(

                    "Número",

                    company.addressNumber,

                    (value) => updateCompanyField("addressNumber", value),

                    { placeholder: "Número" }

                  )}

                  {renderInput(

                    "Complemento",

                    company.complement,

                    (value) => updateCompanyField("complement", value),

                    { placeholder: "Sala, bloco..." }

                  )}

                  {renderInput(

                    "Bairro",

                    company.neighborhood,

                    (value) => updateCompanyField("neighborhood", value),

                    { placeholder: "Bairro" }

                  )}

                  {renderInput(

                    "Cidade",

                    company.city,

                    (value) => updateCompanyField("city", value),

                    { placeholder: "Cidade" }

                  )}

                  {renderInput(

                    "Estado",

                    company.state,

                    (value) => updateCompanyField("state", value),

                    { placeholder: "UF" }

                  )}

                  {renderInput(

                    "País",

                    company.country,

                    (value) => updateCompanyField("country", value),

                    { placeholder: "Brasil" }

                  )}

                  {renderInput(

                    "Identificador da empresa",

                    "Configurado no sistema",

                    () => {},

                    { disabled: true }

                  )}

                </div>

              </>

            ) : (

              <div className="settings-empty-company">

                <Building2 size={30} />

                <strong>Empresa não vinculada</strong>

                <p>

                  Esta conta ainda não possui uma empresa vinculada.

                </p>

              </div>

            )}

          </>

        );

      case "preferences":

        return (

          <>

            <div className="settings-panel-heading">

              <div>

                <span>PERSONALIZAÇÃO</span>

                <h2>Preferências</h2>

                <p>

                  Defina como deseja utilizar o sistema.

                </p>

              </div>

              <SlidersHorizontal size={22} />

            </div>

            <div className="settings-preference-list">

              <label>

                <span>

                  <strong>Idioma do sistema</strong>

                  <small>

                    Idioma utilizado nas telas do CRM.

                  </small>

                </span>

                <select

                  value={preferences.language}

                  onChange={(event) =>

                    updatePreference("language", event.target.value)

                  }

                >

                  <option value="pt-BR">Português (Brasil)</option>

                  <option value="en-US">English</option>

                  <option value="es-ES">Español</option>

                </select>

              </label>

              <label>

                <span>

                  <strong>Formato de data</strong>

                  <small>

                    Como as datas serão apresentadas.

                  </small>

                </span>

                <select

                  value={preferences.dateFormat}

                  onChange={(event) =>

                    updatePreference("dateFormat", event.target.value)

                  }

                >

                  <option value="dd/MM/yyyy">DD/MM/AAAA</option>

                  <option value="MM/dd/yyyy">MM/DD/AAAA</option>

                  <option value="yyyy-MM-dd">AAAA-MM-DD</option>

                </select>

              </label>

              <label>

                <span>

                  <strong>Fuso horário</strong>

                  <small>

                    Horário utilizado em agendas e atividades.

                  </small>

                </span>

                <select

                  value={preferences.timezone}

                  onChange={(event) =>

                    updatePreference("timezone", event.target.value)

                  }

                >

                  <option value="America/Sao_Paulo">

                    Brasília (GMT-3)

                  </option>

                  <option value="America/Manaus">

                    Manaus (GMT-4)

                  </option>

                  <option value="America/Rio_Branco">

                    Rio Branco (GMT-5)

                  </option>

                </select>

              </label>

              <label>

                <span>

                  <strong>Tema do sistema</strong>

                  <small>

                    Escolha a aparência do ambiente.

                  </small>

                </span>

                <select

                  value={preferences.theme}

                  onChange={(event) =>

                    updatePreference("theme", event.target.value)

                  }

                >

                  <option value="dark">Escuro</option>

                  <option value="light">Claro</option>

                  <option value="system">Seguir dispositivo</option>

                </select>

              </label>

            </div>

          </>

        );

      case "notifications":

        return (

          <>

            <div className="settings-panel-heading">

              <div>

                <span>ALERTAS DO SISTEMA</span>

                <h2>Notificações</h2>

                <p>

                  Escolha quais acontecimentos deseja acompanhar.

                </p>

              </div>

              <Bell size={22} />

            </div>

            <div className="settings-notification-list">

              {(

                [

                  [

                    "tasks",

                    "Tarefas",

                    "Avisos sobre tarefas pendentes e atrasadas.",

                  ],

                  [

                    "leads",

                    "Novos leads",

                    "Notificações sobre novos contatos cadastrados.",

                  ],

                  [

                    "appointments",

                    "Compromissos",

                    "Lembretes sobre reuniões e compromissos.",

                  ],

                  [

                    "deals",

                    "Negociações",

                    "Atualizações sobre oportunidades comerciais.",

                  ],

                ] as const

              ).map(([key, title, description]) => (

                <div

                  className="settings-notification-item"

                  key={key}

                >

                  <div>

                    <strong>{title}</strong>

                    <p>{description}</p>

                  </div>

                  <button

                    type="button"

                    className={`settings-switch ${

                      notifications[key] ? "active" : ""

                    }`}

                    onClick={() => toggleNotification(key)}

                    aria-label={`Alternar notificações de ${title}`}

                    aria-pressed={notifications[key]}

                  >

                    <span />

                  </button>

                </div>

              ))}

            </div>

            <div className="settings-notification-list">

              <div className="settings-notification-item">

                <div>

                  <strong>Notificações por e-mail</strong>

                  <p>

                    Permitir o recebimento de alertas por e-mail.

                  </p>

                </div>

                <button

                  type="button"

                  className={`settings-switch ${

                    notifications.emailEnabled ? "active" : ""

                  }`}

                  onClick={() => toggleNotification("emailEnabled")}

                  aria-label="Alternar notificações por e-mail"

                  aria-pressed={notifications.emailEnabled}

                >

                  <span />

                </button>

              </div>

              <div className="settings-notification-item">

                <div>

                  <strong>Notificações no sistema</strong>

                  <p>

                    Exibir alertas dentro do TERVALYA CRM.

                  </p>

                </div>

                <button

                  type="button"

                  className={`settings-switch ${

                    notifications.inAppEnabled ? "active" : ""

                  }`}

                  onClick={() => toggleNotification("inAppEnabled")}

                  aria-label="Alternar notificações no sistema"

                  aria-pressed={notifications.inAppEnabled}

                >

                  <span />

                </button>

              </div>

            </div>

          </>

        );

      case "security":
        return (
          <>
            <div className="settings-panel-heading">
              <div>
                <span>PROTEÇÃO DA CONTA</span>
                <h2>Segurança</h2>
                <p>Gerencie sua senha e mantenha sua conta protegida.</p>
              </div>
              <ShieldCheck size={22} />
            </div>

            <section className="settings-sessions-section">
              <div className="settings-sessions-heading">
                <div>
                  <span className="settings-section-kicker">CONTROLE DE ACESSO</span>
                  <h3>Dispositivos conectados</h3>
                  <p>Confira onde sua conta está conectada e encerre acessos que não reconhece.</p>
                </div>
                <button
                  type="button"
                  className="settings-secondary-button"
                  onClick={loadSessions}
                  disabled={loadingSessions}
                >
                  <RefreshCw size={15} className={loadingSessions ? "settings-spinner" : ""} />
                  Atualizar
                </button>
              </div>

              <div className="settings-sessions-summary">
                <div className="settings-sessions-summary-icon"><Monitor size={19} /></div>
                <div>
                  <strong>{sessions.length} {sessions.length === 1 ? "sessão ativa" : "sessões ativas"}</strong>
                  <span>Dispositivos com acesso à sua conta TERVALYA.</span>
                </div>
              </div>

              {loadingSessions ? (
                <div className="settings-sessions-loading">
                  <LoaderCircle size={20} className="settings-spinner" />
                  <span>Buscando dispositivos conectados...</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="settings-sessions-empty">
                  <ShieldCheck size={25} />
                  <strong>Nenhuma sessão encontrada</strong>
                  <span>Atualize a lista para consultar seus dispositivos.</span>
                </div>
              ) : (
                <div className="settings-sessions-list">
                  {sessions.map((session) => (
                    <article className="settings-session-item" key={session.id}>
                      <div className="settings-session-device-icon">
                        {session.device.toLowerCase().includes("android") ||
                        session.device.toLowerCase().includes("ios") ? (
                          <Smartphone size={21} />
                        ) : (
                          <Monitor size={21} />
                        )}
                      </div>
                      <div className="settings-session-details">
                        <div className="settings-session-title">
                          <strong>{session.device || "Dispositivo desconhecido"}</strong>
                          {session.isCurrent && (
                            <span className="settings-current-session">Este dispositivo</span>
                          )}
                        </div>
                        <span><Globe2 size={13} /> IP: {session.ipAddress || "Não identificado"}</span>
                        <span><Clock3 size={13} /> Último acesso: {formatSessionDate(session.lastActiveAt)}</span>
                        <small>Conectado em {formatSessionDate(session.createdAt)}</small>
                      </div>
                      {!session.isCurrent && (
                        <button
                          type="button"
                          className="settings-session-revoke"
                          onClick={() => revokeSession(session)}
                          disabled={revokingSessionId === session.id || revokingOthers}
                        >
                          {revokingSessionId === session.id ? (
                            <LoaderCircle size={15} className="settings-spinner" />
                          ) : (
                            <LogOut size={15} />
                          )}
                          Encerrar
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              )}

              <div className="settings-sessions-footer">
                <span>Se você não reconhecer algum dispositivo, encerre a sessão correspondente.</span>
                <button
                  type="button"
                  className="settings-revoke-others"
                  onClick={revokeOtherSessions}
                  disabled={
                    revokingOthers ||
                    loadingSessions ||
                    sessions.filter((session) => !session.isCurrent).length === 0
                  }
                >
                  {revokingOthers ? (
                    <LoaderCircle size={15} className="settings-spinner" />
                  ) : (
                    <LogOut size={15} />
                  )}
                  Encerrar outras sessões
                </button>
              </div>
            </section>

            <div className="settings-security-form">
              <div className="settings-security-intro">
                <div className="settings-security-icon">
                  <LockKeyhole size={22} />
                </div>
                <div>
                  <strong>Alteração de senha</strong>
                  <p>Atualize sua senha para proteger o acesso à sua conta.</p>
                </div>
              </div>

              <div className="settings-password-fields">
                <label>
                  Senha atual
                  <div className="settings-password-input">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(event) =>
                        setPasswordData((current) => ({ ...current, currentPassword: event.target.value }))
                      }
                      placeholder="Digite sua senha atual"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((current) => ({ ...current, current: !current.current }))}
                      aria-label={showPasswords.current ? "Ocultar senha atual" : "Mostrar senha atual"}
                    >
                      {showPasswords.current ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>

                <label>
                  Nova senha
                  <div className="settings-password-input">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(event) =>
                        setPasswordData((current) => ({ ...current, newPassword: event.target.value }))
                      }
                      placeholder="Crie uma nova senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((current) => ({ ...current, new: !current.new }))}
                      aria-label={showPasswords.new ? "Ocultar nova senha" : "Mostrar nova senha"}
                    >
                      {showPasswords.new ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                  <small className="settings-password-hint">Use entre 8 e 72 caracteres.</small>
                </label>

                <label>
                  Confirmar nova senha
                  <div className="settings-password-input">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(event) =>
                        setPasswordData((current) => ({ ...current, confirmPassword: event.target.value }))
                      }
                      placeholder="Digite novamente a nova senha"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords((current) => ({ ...current, confirm: !current.confirm }))}
                      aria-label={showPasswords.confirm ? "Ocultar confirmação" : "Mostrar confirmação"}
                    >
                      {showPasswords.confirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </label>
              </div>

              <div className="settings-password-requirements">
                <ShieldCheck size={16} />
                <span>A senha deve ter entre 8 e 72 caracteres.</span>
              </div>

              <button
                type="button"
                className="settings-save-button settings-password-save"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? (
                  <LoaderCircle size={16} className="settings-spinner" />
                ) : (
                  <LockKeyhole size={16} />
                )}
                {changingPassword ? "Atualizando senha..." : "Atualizar senha"}
              </button>
            </div>

            <div className="settings-security-card">
              <div className="settings-security-icon"><ShieldCheck size={22} /></div>
              <div>
                <strong>Proteção de acesso</strong>
                <p>Sua conta utiliza autenticação e senha protegida por hash.</p>
              </div>
              <span className="settings-coming-label">Ativa</span>
            </div>
          </>
        );
      default:
        return null;
    }
  };

  // ======================================
  // CARREGAMENTO
  // ======================================

  if (loading) {

    return (

      <div className="settings-loading">

        <LoaderCircle size={32} className="settings-spinner" />

        <span>Carregando configurações...</span>

      </div>

    );

  }


  // TELA PRINCIPAL


  return (

    <div className="settings-page">

      <header className="settings-header">

        <div>

          <span className="settings-eyebrow">

            TERVALYA CRM / CENTRAL DE CONTROLE

          </span>

          <h1>Configurações</h1>

          <p>

            Personalize sua experiência e gerencie seu ambiente de trabalho.

          </p>

        </div>

      </header>

      {error && (

        <div className="settings-feedback error">

          <AlertCircle size={17} />

          <span>{error}</span>

        </div>

      )}

      {success && (

        <div className="settings-feedback success">

          <Check size={17} />

          <span>{success}</span>

        </div>

      )}

      <div className="settings-layout">

        <aside className="settings-sidebar">

          <span className="settings-sidebar-title">

            GERENCIAMENTO

          </span>

          {sections.map((section) => {

            const Icon = section.icon;

            return (

              <button

                type="button"

                key={section.id}

                className={`settings-nav-item ${

                  activeSection === section.id ? "active" : ""

                }`}

                onClick={() => {

                  setActiveSection(section.id);

                  setError("");

                  setSuccess("");

                }}

              >

                <Icon size={18} />

                <span>{section.label}</span>

              </button>

            );

          })}

        </aside>

        <main className="settings-content">

          {renderContent()}

          {activeSection !== "security" && (

            <div className="settings-footer">

              <span>

                <Check size={15} />

                {activeSection === "profile" ||

                activeSection === "company"

                  ? "Seus dados serão atualizados no servidor."

                  : "Suas configurações serão salvas no servidor."}

              </span>

              <button

                type="button"

                className="settings-save-button"

                onClick={saveSettings}

                disabled={

                  saving ||

                  uploadingPhoto ||

                  uploadingLogo ||

                  (activeSection === "company" &&

                    (!companyLinked || !company.name.trim()))

                }

              >

                {saving ? (

                  <LoaderCircle

                    size={16}

                    className="settings-spinner"

                  />

                ) : (

                  <Save size={16} />

                )}

                {saving ? "Salvando..." : "Salvar alterações"}

              </button>

            </div>

          )}

        </main>

      </div>

    </div>

  );

}
