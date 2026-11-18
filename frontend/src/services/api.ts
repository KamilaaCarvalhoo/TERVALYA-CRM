
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3333/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Recupera o token de autenticação
function getStoredToken() {
  return (
    localStorage.getItem("vertice_token") ||
    sessionStorage.getItem("vertice_token")
  );
}

// Adiciona o token automaticamente nas requisições
api.interceptors.request.use(
  (config) => {
    const token = getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (
      typeof FormData !== "undefined" &&
      config.data instanceof FormData
    ) {
      delete config.headers["Content-Type"];
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Trata erros das respostas
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("vertice_token");
      sessionStorage.removeItem("vertice_token");
    }

    return Promise.reject(error);
  }
);

export default api;
