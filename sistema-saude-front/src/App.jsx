import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Patients from "./pages/Patients";
import MedicalRecord from "./pages/MedicalRecord";
import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Screening from "./pages/screening";
import Dashboard from "./pages/Dashboard"; // Importe a página de dashboard que criamos!

// Componente para proteger as rotas
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login: FORA do Layout */}
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
          
          {/* OPÇÃO 1: Acessar prontuário com o ID na URL (Ex: /patients/123-uuid) */}
          <Route path="patients/:id" element={<MedicalRecord />} />
          
          {/* OPÇÃO 2: Acessar prontuário direto pelo menu lateral sidebar (Ex: /medical-records) */}
          <Route path="medical-records" element={<MedicalRecord />} />
          
          <Route path="appointments" element={<Appointments />} />
          <Route path="users" element={<Users />} />
          <Route path="screening" element={<Screening />} />
          
          {/* Rota do seu novo Dashboard de Double Tab */}
          <Route path="dashboard" element={<Dashboard />} /> 
        </Route>

        {/* Rota para 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;