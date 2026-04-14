import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080',
});

// INTERCEPTOR DE REQUISIÇÃO (Envia o Token)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Usando a sintaxe mais segura para o Axios moderno
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// INTERCEPTOR DE RESPOSTA (Trata expiração do Token)
api.interceptors.response.use(
  (response) => response, // Se a resposta for OK, apenas retorna
  (error) => {
    if (error.response && error.response.status === 401) {
      // Se o back retornar 401, o token é inválido ou expirou
      localStorage.removeItem('token'); // Limpa o token "sujo"
      window.location.href = '/login'; // Redireciona para o login
    }
    return Promise.reject(error);
  }
);

export default api;