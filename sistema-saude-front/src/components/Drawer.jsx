import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar'; 
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import PersonalInjuryIcon from '@mui/icons-material/PersonalInjury';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import BedIcon from '@mui/icons-material/Bed';
import { Link } from 'react-router-dom'; 

const drawerWidth = 240; 

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

export default function PermanentDrawer() {
  const temPacienteSelecionado = !!sessionStorage.getItem('selectedPacienteId');
  
  // Extrai o perfil do utilizador atualizado em tempo real do Token do localstorage
  const token = localStorage.getItem('token');
  const decoded = token ? decodeJwt(token) : null;
  const userRole = decoded?.role || '';

  // Auxiliares lógicos para simplificar a renderização condicional por perfil
  const isAdminOuAdminGeral = ["ADMIN", "Administração"].includes(userRole);
  const isAssistencial = ["ADMIN", "Médico(a)", "Enfermeiro(a)"].includes(userRole);
  const podeVerTriagem = ["ADMIN", "Equipe de Triagem", "Enfermeiro(a)", "Médico(a)"].includes(userRole);
  const podeVerPacientes = ["ADMIN", "Administração", "Recepcionista", "Médico(a)", "Enfermeiro(a)"].includes(userRole);
  const podeVerDashboard = ["ADMIN", "Administração", "Médico(a)"].includes(userRole);

  return (
    <Drawer
      variant="permanent" 
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box' 
        },
      }}
    >
      <Toolbar /> 
      
      <Box sx={{ overflow: 'auto' }}>
        <List>
          
          {/* PACIENTES */}
          {podeVerPacientes && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/patients">
                <ListItemIcon><PersonIcon /></ListItemIcon>
                <ListItemText primary="Pacientes" />
              </ListItemButton>
            </ListItem>
          )}

          {/* PRONTUÁRIO ATIVO */}
          {isAssistencial && (
            <ListItem disablePadding>
              <ListItemButton 
                component={Link} 
                to="/medical-records"
                disabled={!temPacienteSelecionado}
                title={!temPacienteSelecionado ? "Selecione um paciente na listagem para liberar o prontuário" : "Visualizar prontuário ativo"}
              >
                <ListItemIcon>
                  <MedicalInformationIcon color={temPacienteSelecionado ? "primary" : "inherit"} />
                </ListItemIcon>
                <ListItemText 
                  primary="Prontuário Ativo" 
                  secondary={!temPacienteSelecionado ? "Nenhum selecionado" : "Liberado"}
                  secondaryTypographyProps={{ style: { fontSize: '0.75rem' } }}
                />
              </ListItemButton>
            </ListItem>
          )}

          {/* GESTÃO DE USUÁRIOS (RH) */}
          {isAdminOuAdminGeral && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/users">
                <ListItemIcon><AssignmentIndIcon /></ListItemIcon>
                <ListItemText primary="Usuários" />
              </ListItemButton>
            </ListItem>
          )}
          
          {/* TRIAGEM MANCHESTER */}
          {podeVerTriagem && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/screening">
                <ListItemIcon><PersonalInjuryIcon /></ListItemIcon>
                <ListItemText primary="Triagem" />
              </ListItemButton>
            </ListItem>
          )}
          
          {/* DADOS CLÍNICOS (CATÁLOGO) */}
          {isAssistencial && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/clinical_data">
                <ListItemIcon><VaccinesIcon /></ListItemIcon>
                <ListItemText primary="Dados Clínicos" />
              </ListItemButton>
            </ListItem>
          )}

          {/* LEITOS E INTERNAÇÃO */}
          {(isAssistencial || userRole === "Administração") && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/beds">
                <ListItemIcon><BedIcon /></ListItemIcon>
                <ListItemText primary="Leitos" />
              </ListItemButton>
            </ListItem>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          {/* DASHBOARD GERENCIAL */}
          {podeVerDashboard && (
            <ListItem disablePadding>
              <ListItemButton component={Link} to="/dashboard">
                <ListItemIcon><SpaceDashboardIcon /></ListItemIcon>
                <ListItemText primary="Dashboard" />
              </ListItemButton>
            </ListItem>
          )}
          
        </List>
      </Box>
    </Drawer>
  );
}