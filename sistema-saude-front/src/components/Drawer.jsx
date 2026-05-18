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
import TodayIcon from '@mui/icons-material/Today';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import PersonalInjuryIcon from '@mui/icons-material/PersonalInjury';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation'; // Ícone lindo para o Prontuário
import { Link } from 'react-router-dom'; 

const drawerWidth = 240; 

export default function PermanentDrawer() {
  // Verifica em tempo real se existe algum paciente selecionado na sessão
  const temPacienteSelecionado = !!sessionStorage.getItem('selectedPacienteId');

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
          {/*<ListItem disablePadding>
            <ListItemButton component={Link} to="/appointments">
              <ListItemIcon><TodayIcon /></ListItemIcon>
              <ListItemText primary="Agendamentos" />
            </ListItemButton>
          </ListItem>*/}
          
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/patients">
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Pacientes" />
            </ListItemButton>
          </ListItem>

          {/* NOVO LINK: Prontuário Eletrônico Condicional */}
          <ListItem disablePadding>
            <ListItemButton 
              component={Link} 
              to="/medical-records"
              disabled={!temPacienteSelecionado} // Se não clicou em ninguém antes, o botão fica cinza/bloqueado
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

          <ListItem disablePadding>
            <ListItemButton component={Link} to="/users">
              <ListItemIcon><AssignmentIndIcon /></ListItemIcon>
              <ListItemText primary="Usuários" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/screening">
              <ListItemIcon><PersonalInjuryIcon /></ListItemIcon>
              <ListItemText primary="Triagem" />
            </ListItemButton>
          </ListItem>
          
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/vaccines">
              <ListItemIcon><VaccinesIcon /></ListItemIcon>
              <ListItemText primary="Vacinas" />
            </ListItemButton>
          </ListItem>
          
          <Divider />
          
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/dashboard">
              <ListItemIcon><SpaceDashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          
          {/*<ListItem disablePadding>
            <ListItemButton component={Link} to="/permissions">
              <ListItemIcon><LockPersonIcon /></ListItemIcon>
              <ListItemText primary="Permissões" />
            </ListItemButton>
          </ListItem>*/}
          
          <Divider />
          
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/news">
              <ListItemIcon><NewspaperIcon /></ListItemIcon>
              <ListItemText primary="Mural de notícias" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
}