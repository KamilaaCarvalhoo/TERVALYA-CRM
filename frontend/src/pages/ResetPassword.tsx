
import { useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
  Hexagon,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";

import api from "../services/api";
import "./AuthPage.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Link de recuperação inválido. Solicite um novo link.");
      return;
    }

    if (password.length < 8 || password.length > 72) {
      setError("A senha deve ter entre 8 e 72 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não são iguais.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/reset-password", {
        token,
        password,
      });

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
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
            "Não foi possível redefinir sua senha. Solicite um novo link."
        );
      } else {
        setError("Não foi possível conectar ao servidor.");
      }
    } finally {
      setLoading(false);
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
            <Link to="/login" className="auth-brand">
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
              SEGURANÇA E PROTEÇÃO
            </div>

            <h1>
              Um novo
              <br />
              começo para
              <br />
              sua gestão<span>.</span>
            </h1>

            <p className="presentation-description">
              Crie uma nova senha e retome seu acesso à plataforma com
              segurança e tranquilidade.
            </p>

            <div className="presentation-divider" />

            <div className="presentation-quote">
              <div className="quote-symbol">“</div>
              <div>
                <p>Seu negócio em boas mãos.</p>
                <span>TERVALYA CRM</span>
              </div>
            </div>
          </div>

          <footer className="presentation-footer">
            <span>© 2026 TERVALYA CRM</span>
            <span>GESTÃO INTELIGENTE DE NEGÓCIOS</span>
          </footer>
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
                <LockKeyhole size={21} />
              </div>

              <span className="auth-eyebrow">NOVA SENHA</span>

              <h2>
                Redefina sua <em>senha.</em>
              </h2>

              <p>
                Escolha uma nova senha para proteger sua conta na
                TERVALYA CRM.
              </p>
            </div>

            {success ? (
              <div className="recovery-success" role="status">
                <CheckCircle2 size={38} />

                <h3>Senha alterada!</h3>

                <p>
                  Sua senha foi redefinida com sucesso. Agora você já pode
                  acessar sua conta com a nova senha.
                </p>

                <button
                  type="button"
                  className="auth-submit"
                  onClick={() => navigate("/login", { replace: true })}
                >
                  <span>Ir para o login</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : !token ? (
              <div className="auth-error" role="alert">
                Link de recuperação inválido ou ausente.
                <Link to="/forgot-password">
                  Solicitar novo link
                </Link>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>Nova senha</span>

                  <div className="auth-input">
                    <LockKeyhole size={18} />

                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo de 8 caracteres"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
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

                <label className="auth-field">
                  <span>Confirmar nova senha</span>

                  <div className="auth-input">
                    <LockKeyhole size={18} />

                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(event.target.value)
                      }
                      minLength={8}
                      maxLength={72}
                      autoComplete="new-password"
                      required
                    />

                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() =>
                        setShowConfirmPassword((value) => !value)
                      }
                      aria-label={
                        showConfirmPassword
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </label>

                {error && (
                  <div className="auth-error" role="alert">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="auth-submit"
                  disabled={loading}
                >
                  <span>
                    {loading ? "Salvando..." : "Salvar nova senha"}
                  </span>

                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            )}

            <div className="auth-switch">
              <Link to="/login">
                <ArrowLeft size={15} />
                Voltar para o login
              </Link>
            </div>
          </div>

          <footer className="auth-panel-footer">
            <span>TERVALYA CRM</span>
            <span>TECNOLOGIA PARA GESTÃO</span>
          </footer>
        </section>
      </section>

      <div className="auth-bottom-note">
        <ShieldCheck size={13} />
        <span>SEGURANÇA E CONFIANÇA EM CADA ACESSO.</span>
      </div>
    </main>
  );
}
