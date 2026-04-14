import { Box, Toolbar } from "@mui/material";
import ResponsiveAppBar from "./Appbar";
import TemporaryDrawer from "./Drawer"; // Seu menu lateral
import { Outlet } from "react-router-dom"; // Onde as páginas vão renderizar

const Layout = () => {
  return (
    <Box sx={{ display: 'flex' }}>
      {/* 1. Barra Superior */}
      <ResponsiveAppBar />

      {/* 2. Menu Lateral */}
      <TemporaryDrawer />

      {/* 3. Área de Conteúdo Principal */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - 240px)` }, // Ajusta conforme a largura do seu Drawer
        }}
      >
        {/* Esse Toolbar serve como um "espaçador" para o conteúdo não ficar embaixo da AppBar */}
        <Toolbar /> 
        
        {/* O Outlet é onde as páginas (Pacientes, Home, etc) aparecerão */}
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;