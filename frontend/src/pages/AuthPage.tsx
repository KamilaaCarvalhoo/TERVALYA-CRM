import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  LockKeyhole,
  Mail,
  UserRound,
  Hexagon,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  ChartNoAxesCombined,
  BriefcaseBusiness,
  Target,
  Sparkles,
  Check,
  ChevronRight,
} from "lucide-react";

import { useAuth } from "../contexts/AuthContext";
import "./AuthPage.css";

interface AuthPageProps {
  mode: "login" | "register";
}

const features = [
  {
    icon: Users,
    title: "Relacionamento com clientes",
    description: "Informações organizadas em um só lugar.",
  },
  {
    icon: Target,
    title: "Gestão comercial",
    description: "Acompanhe leads e oportunidades.",
  },
  {
    icon: ChartNoAxesCombined,
    title: "Visão estratégica",
    description: "Indicadores para apoiar decisões.",
  },
];

export default function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === "register";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(name.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password, rememberMe);
      }

      navigate("/", { replace: true });
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "response" in err) {
        const response = (
          err as {
            response?: {
              data?: {
                message?: string;
              };
            };
          }
        ).response;

        setError(
          response?.data?.message ||
            "Não foi possível concluir sua solicitação. Tente novamente."
        );
      } else {
        setError(
          "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente."
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-noise" aria-hidden="true" />
      <div className="auth-background-glow auth-glow-left" />
      <div className="auth-background-glow auth-glow-right" />

      <section className="auth-layout">
        <aside className="auth-presentation">
          <header className="presentation-header">
            <Link to="/login" className="auth-brand" aria-label="Tervalya CRM">
              <div className="brand-mark">
                <Hexagon size={27} strokeWidth={1.6} />
                <span />
              </div>

              <div className="brand-copy">
                <strong>
                  TERVALYA<span>.</span>
                </strong>
                <small>CRM · BUSINESS MANAGEMENT</small>
              </div>
            </Link>

            <span className="brand-edition">BUSINESS EDITION</span>
          </header>

          <div className="presentation-content">
            <div className="presentation-overline">
              <span className="overline-line" />
              GESTÃO COM VISÃO ESTRATÉGICA
            </div>

            <h1>
              O próximo nível
              <br />
              da gestão do
              <br />
              seu negócio<span>.</span>
            </h1>

            <p className="presentation-description">
              Mais clareza nas relações. Mais organização nos processos.
              Mais inteligência para conduzir cada oportunidade.
            </p>

            <div className="presentation-divider" />

            <div className="presentation-features">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div className="presentation-feature" key={feature.title}>
                    <div className="feature-icon">
                      <Icon size={19} strokeWidth={1.7} />
                    </div>

                    <div className="feature-copy">
                      <strong>{feature.title}</strong>
                      <span>{feature.description}</span>
                    </div>

                    <ChevronRight className="feature-arrow" size={16} />
                  </div>
                );
              })}
            </div>

            <div className="presentation-quote">
              <div className="quote-symbol">“</div>
              <div>
                <p>Organização para hoje. Visão para o futuro.</p>
                <span>TERVALYA CRM</span>
              </div>
            </div>
          </div>

          <footer className="presentation-footer">
            <span>© 2026 TERVALYA CRM</span>
            <span>GESTÃO INTELIGENTE DE NEGÓCIOS</span>
          </footer>

          <div
            className="presentation-decoration"
            aria-hidden="true"
          >
            <div className="decoration-ring ring-one" />
            <div className="decoration-ring ring-two" />
            <div className="decoration-ring ring-three" />

            <div className="decoration-core">
              <BriefcaseBusiness size={32} strokeWidth={1.2} />
            </div>
          </div>
        </aside>

        <section className="auth-panel">
          <header className="auth-panel-header">
            <div className="secure-label">
              <ShieldCheck size={15} />
              <span>AMBIENTE DE ACESSO SEGURO</span>
            </div>

            <span className="auth-locale">PORTUGUÊS · BR</span>
          </header>

          <div className="auth-form-area">
            <div className="auth-heading">
              <div className="auth-heading-symbol">
                {isRegister ? (
                  <UserRound size={21} />
                ) : (
                  <LockKeyhole size={21} />
                )}
              </div>

              <span className="auth-eyebrow">
                {isRegister ? "NOVO ACESSO" : "ÁREA DO CLIENTE"}
              </span>

              <h2>
                {isRegister ? (
                  <>
                    Faça parte da <em>Tervalya.</em>
                  </>
                ) : (
                  <>
                    Bem-vindo de volta<em>.</em>
                  </>
                )}
              </h2>

              <p>
                {isRegister
                  ? "Crie seu acesso para começar a organizar a gestão do seu negócio."
                  : "Acesse sua conta e continue de onde sua gestão parou."}
              </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              {isRegister && (
                <label className="auth-field">
                  <span>Nome completo</span>

                  <div className="auth-input">
                    <UserRound size={18} />
                    <input
                      type="text"
                      placeholder="Digite seu nome"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      required
                    />
                  </div>
                </label>
              )}

              <label className="auth-field">
                <span>E-mail</span>

                <div className="auth-input">
                  <Mail size={18} />
                  <input
                    type="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </label>

              <label className="auth-field">
                <span>Senha</span>

                <div className="auth-input">
                  <LockKeyhole size={18} />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      isRegister
                        ? "Mínimo de 8 caracteres"
                        : "Digite sua senha"
                    }
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={isRegister ? 8 : 1}
                    maxLength={72}
                    autoComplete={
                      isRegister ? "new-password" : "current-password"
                    }
                    required
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={
                      showPassword ? "Ocultar senha" : "Mostrar senha"
                    }
                  >
                    {showPassword ? (
                      <EyeOff size={17} />
                    ) : (
                      <Eye size={17} />
                    )}
                  </button>
                </div>
              </label>

              {!isRegister && (
                <div className="auth-options">
                  <label className="remember-option">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                    />
                    <span>Lembrar de mim</span>
                  </label>

                  <Link className="forgot-password-link" to="/forgot-password">
                    Esqueceu sua senha?
                  </Link>
                </div>
              )}

              {error && (
                <div className="auth-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="auth-submit"
                disabled={submitting}
              >
                <span>
                  {submitting
                    ? "Aguarde..."
                    : isRegister
                      ? "Criar minha conta"
                      : "Acessar minha conta"}
                </span>

                {!submitting && <ArrowRight size={18} />}
              </button>
            </form>

            <div className="auth-switch">
              {isRegister ? (
                <>
                  Já possui acesso?
                  <Link to="/login">Entrar na plataforma</Link>
                </>
              ) : (
                <>
                  Ainda não possui uma conta?
                  <Link to="/register">Criar meu acesso</Link>
                </>
              )}
            </div>

            <div className="auth-benefit">
              <div className="benefit-check">
                <Check size={13} />
              </div>

              <span>
                Uma visão mais organizada da sua operação.
              </span>
            </div>
          </div>

          <footer className="auth-panel-footer">
            <span>TERVALYA CRM</span>
            <span>TECNOLOGIA PARA GESTÃO</span>
          </footer>
        </section>
      </section>

      <div className="auth-bottom-note">
        <Sparkles size={13} />
        <span>GESTÃO COM PROPÓSITO. RESULTADOS COM DIREÇÃO.</span>
      </div>
    </main>
  );
}
