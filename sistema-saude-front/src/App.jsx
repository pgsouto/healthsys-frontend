import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Patients from "./pages/Patients";
import MedicalRecord from "./pages/MedicalRecord";
import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import Login from "./pages/Login";

// Componente para proteger as rotas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  // Se não tem token, manda para o login
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login: FORA do Layout (sem sidebar/header) */}
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas: DENTRO do Layout */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Rota Inicial */}
          <Route index element={<div>Página Inicial do Hospital</div>} />
          
          <Route path="patients" element={<Patients />} />
          <Route path="patients/:id" element={<MedicalRecord />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="users" element={<Users />} />
        </Route>

        {/* Rota para 404 ou redirecionar se digitar lixo na URL */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;