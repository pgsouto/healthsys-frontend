import { Navigate } from 'react-router-dom';

// Função utilitária nativa para decifrar e ler o payload do JWT
const decodeJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map((c) => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  
  // 1. Se não houver token, manda imediatamente para o login
  if (!token) {
    return <Navigate to="/login" />;
  }

  // 2. Decodifica o token para ler as informações em memória
  const decoded = decodeJwt(token);
  const userRole = decoded?.role; // Captura a claim "role" injetada pelo auth-service

  // 3. Se a rota exigir perfis específicos e o usuário não tiver permissão, redireciona para a home
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    alert(`Acesso Negado: O seu perfil (${userRole || 'Visitante'}) não tem permissão para esta área.`);
    return <Navigate to="/" />;
  }
  
  return children;
};

export default PrivateRoute;