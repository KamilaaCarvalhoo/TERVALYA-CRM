
import { NavLink } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  Target,
  BriefcaseBusiness,
  CheckSquare,
  CalendarDays,
  ChartNoAxesCombined,
  Settings,
  CircleHelp,
  Hexagon,
  Headset,
} from "lucide-react";

const links = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Clientes", path: "/clients", icon: Users },
  { label: "Leads", path: "/leads", icon: Target },
  { label: "Negociações", path: "/deals", icon: BriefcaseBusiness },
  { label: "Tarefas", path: "/tasks", icon: CheckSquare },
  { label: "Agenda", path: "/calendar", icon: CalendarDays },
  { label: "Relatórios", path: "/reports", icon: ChartNoAxesCombined },
  { label: "Suporte", path: "/support", icon: Headset },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Hexagon size={25} />
        </div>

        <div>
          <h2>TERVALYA</h2>
          <span>CRM PLATFORM</span>
        </div>
      </div>

      <div className="sidebar-label">
        MENU PRINCIPAL
      </div>

      <nav className="nav-links">
        {links.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              isActive ? "nav-link active" : "nav-link"
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          <Settings size={19} />
          <span>Configurações</span>
        </NavLink>

        <NavLink
          to="/support"
          className="help-card"
        >
          <CircleHelp size={22} />
          <strong>Precisa de ajuda?</strong>
          <span>Central de suporte Tervalya</span>
        </NavLink>

        <div className="sidebar-version">
          TERVALYA CRM · V1.0
        </div>
      </div>
    </aside>
  );
}
