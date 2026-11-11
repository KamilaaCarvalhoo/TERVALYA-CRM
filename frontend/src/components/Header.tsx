
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  ChevronDown,
  UserRound,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <span className="breadcrumb-separator">/</span>
        <strong>Visão geral</strong>
      </div>

      <div className="topbar-actions">
        <div className="search-box">
          <Search size={17} />
          <input placeholder="Pesquisar..." />
          <kbd>⌘ K</kbd>
        </div>

        <button
          className="icon-button"
          aria-label="Notificações"
        >
          <Bell size={19} />
          <span className="notification-dot" />
        </button>

        <div className="profile-menu-container">
          <button
            type="button"
            className="profile"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-expanded={menuOpen}
          >
            <div className="avatar">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>

            <div className="profile-info">
              <strong>{user?.name || "Usuário"}</strong>
              <span>{user?.email || "Conta TERVALYA"}</span>
            </div>

            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                className="profile-menu-overlay"
                aria-label="Fechar menu"
                onClick={() => setMenuOpen(false)}
              />

              <div className="profile-dropdown">
                <div className="profile-dropdown-header">
                  <strong>{user?.name || "Usuário"}</strong>
                  <span>{user?.email}</span>
                </div>

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  <Settings size={17} />
                  <span>Configurações</span>
                </button>

                <button
                  type="button"
                  className="profile-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/settings");
                  }}
                >
                  <UserRound size={17} />
                  <span>Minha conta</span>
                </button>

                <div className="profile-dropdown-divider" />

                <button
                  type="button"
                  className="profile-dropdown-item logout-item"
                  onClick={handleLogout}
                  disabled={loggingOut}
                >
                  <LogOut size={17} />
                  <span>
                    {loggingOut ? "Saindo..." : "Sair da conta"}
                  </span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
