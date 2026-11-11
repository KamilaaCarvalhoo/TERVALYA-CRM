
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Hexagon,
} from "lucide-react";
import api from "../services/api";
import "./AuthPage.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email: email.trim(),
      });

      setSuccess(true);
      setEmail("");
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
            "Não foi possível solicitar a recuperação. Tente novamente."
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
              ACESSO E SEGURANÇA
            </div>

            <h1>
              Sua gestão
              <br />
              merece estar
              <br />
              sempre segura<span>.</span>
            </h1>

            <p className="presentation-description">
              Recupere seu acesso com segurança e continue conduzindo seu
              negócio com clareza e organização.
            </p>

            <div className="presentation-divider" />

            <div className="presentation-quote">
              <div className="quote-symbol">“</div>
              <div>
                <p>Segurança para seguir em frente.</p>
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
                <Mail size={21} />
              </div>

              <span className="auth-eyebrow">RECUPERAÇÃO DE ACESSO</span>

              <h2>
                Esqueceu sua <em>senha?</em>
              </h2>

              <p>
                Informe seu e-mail cadastrado. Se ele estiver associado a uma
                conta, enviaremos as instruções para redefinir sua senha.
              </p>
            </div>

            {!success ? (
              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>E-mail cadastrado</span>

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
                    {loading ? "Enviando..." : "Enviar instruções"}
                  </span>
                  {!loading && <ArrowRight size={18} />}
                </button>
              </form>
            ) : (
              <div className="recovery-success" role="status">
                <CheckCircle2 size={38} />
                <h3>Solicitação recebida</h3>
                <p>
                  Se o e-mail estiver cadastrado, você receberá as instruções
                  para recuperar seu acesso. Verifique também a caixa de spam.
                </p>
              </div>
            )}

            <div className="auth-switch">
              <Link to="/login">
                <ArrowLeft size={15} />
                Voltar para o login
              </Link>
            </div>

            <div className="auth-benefit">
              <div className="benefit-check">
                <ShieldCheck size={13} />
              </div>
              <span>Seu acesso protegido pela TERVALYA CRM.</span>
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
