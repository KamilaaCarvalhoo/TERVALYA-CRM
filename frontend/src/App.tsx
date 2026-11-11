
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Leads from "./pages/Leads";
import Deals from "./pages/Deals";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Support from "./pages/Support";

import AuthPage from "./pages/AuthPage";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* AUTENTICAÇÃO */}

          <Route
            path="/login"
            element={<AuthPage mode="login" />}
          />

          <Route
            path="/register"
            element={<AuthPage mode="register" />}
          />

          {/* RECUPERAÇÃO DE SENHA */}

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* ÁREA PROTEGIDA */}

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />

            <Route path="/clients" element={<Clients />} />

            <Route path="/leads" element={<Leads />} />

            <Route path="/deals" element={<Deals />} />

            <Route path="/tasks" element={<Tasks />} />

            <Route path="/calendar" element={<Calendar />} />

            <Route path="/reports" element={<Reports />} />

            <Route path="/settings" element={<Settings />} />

            <Route path="/support" element={<Support />} />
          </Route>

          {/* REDIRECIONAMENTO */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
