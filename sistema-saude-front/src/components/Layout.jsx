import React, { useEffect } from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import PermanentDrawer from './Drawer';
import PrimarySearchAppBar from './Appbar';

export default function Layout() {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Decodifica o perfil para assinar o canal correto (Ex: cardiologia, clinico, geral)
    const base64Url = token.split('.')[1];
    const decoded = JSON.parse(window.atob(base64Url.replace(/-/g, '+').replace(/_/g, '/')));
    const especialidade = decoded?.especialidade || 'geral';

    // Abre a conexão contínua SSE com o notification-service através do gateway
    const eventSource = new EventSource(`http://localhost:8080/not/notifications/stream/${especialidade.toLowerCase()}?token=${token}`);
    eventSource.onmessage = (event) => {
      // Quando o RabbitMQ despacha uma mensagem, ela cai aqui instantaneamente!
      alert(`🚨 ALERTA HOSPITALAR EM TEMPO REAL: ${event.data}`);
    };

    eventSource.onerror = () => {
      console.log("A aguardar reconexão com o canal de notificações...");
    };

    return () => {
      eventSource.close(); // Fecha a ligação ao sair do sistema
    };
  }, []);

  return (
    <Box sx={{ display: 'flex' }}>
      <PrimarySearchAppBar />
      <PermanentDrawer />
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - 240px)` } }}>
        <Toolbar />
        <Outlet /> {/* Aqui são renderizadas as páginas */}
      </Box>
    </Box>
  );
}
