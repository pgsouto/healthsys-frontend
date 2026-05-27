import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Patients from "./pages/Patients";
import MedicalRecord from "./pages/MedicalRecord";
import Appointments from "./pages/Appointments";
import Users from "./pages/Users";
import Login from "./pages/Login";
import Screening from "./pages/screening";
import Dashboard from "./pages/Dashboard"; 
import Beds from "./pages/Beds";
import MyProfile from "./pages/MyProfile";
import Vaccines from "./pages/Vaccines";
import PrivateRoute from "./routes/PrivateRoute"; // Importação unificada

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota de Login Pública */}
        <Route path="/login" element={<Login />} />

        {/* Layout Geral Protegido (Garante autenticação básica) */}
        <Route 
          path="/" 
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          {/* Rota Inicial Genérica */}
          <Route index element={<div style={{ padding: 20 }}><h3>Bem-vindo ao HealthSys</h3><p>Selecione um módulo no menu lateral para iniciar as operações clínicas.</p></div>} />
          
          {/* Módulos com Controle Fino por Perfis do Backend */}
          <Route 
            path="patients" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Administração", "Recepcionista", "Médico(a)", "Enfermeiro(a)"]}>
                <Patients />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="patients/:id" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Médico(a)", "Enfermeiro(a)"]}>
                <MedicalRecord />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="medical-records" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Médico(a)", "Enfermeiro(a)"]}>
                <MedicalRecord />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="users" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Administração"]}>
                <Users />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="screening" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Equipe de Triagem", "Enfermeiro(a)", "Médico(a)"]}>
                <Screening />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="beds" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Médico(a)", "Enfermeiro(a)", "Administração"]}>
                <Beds />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="clinical_data" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Médico(a)", "Enfermeiro(a)"]}>
                <Vaccines />
              </PrivateRoute>
            } 
          />
          
          <Route 
            path="dashboard" 
            element={
              <PrivateRoute allowedRoles={["ADMIN", "Administração", "Médico(a)"]}>
                <Dashboard />
              </PrivateRoute>
            } 
          /> 

          {/* Perfil Próprio: Todo usuário logado pode acessar */}
          <Route path="profile" element={<MyProfile />} />
          <Route path="appointments" element={<Appointments />} />
        </Route>

        {/* Rota Fallback para 404 */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;