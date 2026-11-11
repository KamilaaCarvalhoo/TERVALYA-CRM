
import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3333/api";

const api = axios.create({
  baseURL: API_URL,
});

function getStoredToken() {
  return (
    localStorage.getItem("vertice_token") ||
    sessionStorage.getItem("vertice_token")
  );
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (
    typeof FormData !== "undefined" &&
    config.data instanceof FormData
  ) {
    config.headers.delete("Content-Type");
  }

  return config;
});

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
