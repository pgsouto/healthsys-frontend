import * as React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Toolbar from '@mui/material/Toolbar'; // Importante para o espaçamento
import InboxIcon from '@mui/icons-material/MoveToInbox';
import PersonIcon from '@mui/icons-material/Person';
import TodayIcon from '@mui/icons-material/Today';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import MedicationIcon from '@mui/icons-material/Medication';
import MailIcon from '@mui/icons-material/Mail';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard';
import LockPersonIcon from '@mui/icons-material/LockPerson';
import NewspaperIcon from '@mui/icons-material/Newspaper';
import { Link } from 'react-router-dom'; // Para a navegação funcionar

const drawerWidth = 240; // Definimos a largura padrão

export default function PermanentDrawer() {
  return (
    <Drawer
      variant="permanent" // Muda de temporary para permanent
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box' 
        },
      }}
    >
      {/* Esse Toolbar vazio evita que o menu fique "atrás" da AppBar */}
      <Toolbar /> 
      
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {/* Exemplo de como você deve usar com o Router futuramente */}
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/appointments">
              <ListItemIcon><TodayIcon /></ListItemIcon>
              <ListItemText primary="Agendamentos" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/patients">
              <ListItemIcon><PersonIcon /></ListItemIcon>
              <ListItemText primary="Pacientes" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/users">
              <ListItemIcon><AssignmentIndIcon /></ListItemIcon>
              <ListItemText primary="Usuários" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/pharmacy">
              <ListItemIcon><MedicationIcon /></ListItemIcon>
              <ListItemText primary="Farmácia" />
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/dashboard">
              <ListItemIcon><SpaceDashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/inventory">
              <ListItemIcon><InventoryIcon /></ListItemIcon>
              <ListItemText primary="Estoque" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/billing">
              <ListItemIcon><AttachMoneyIcon /></ListItemIcon>
              <ListItemText primary="Financeiro" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/permissions">
              <ListItemIcon><LockPersonIcon /></ListItemIcon>
              <ListItemText primary="Permissões" />
            </ListItemButton>
          </ListItem>
          <Divider />
          <ListItem disablePadding>
            <ListItemButton component={Link} to="/news">
              <ListItemIcon><NewspaperIcon /></ListItemIcon>
              <ListItemText primary="Mural de notícias" />
            </ListItemButton>
          </ListItem>

          
          {['Starred', 'Send email', 'Drafts'].map((text, index) => (
            <ListItem key={text} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  {index % 2 === 0 ? <InboxIcon /> : <MailIcon />}
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}