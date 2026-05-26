import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import { useNavigate } from 'react-router-dom'; // IMPORTAÇÃO ADICIONADA

const settings = [ 'Minha Conta', 'Sair'];

function ResponsiveAppBar() {
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const navigate = useNavigate(); // HOOK DE NAVEGAÇÃO ADICIONADO

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  // NOVA FUNÇÃO: Trata os cliques do menu
  const handleMenuClick = (setting) => {
    handleCloseUserMenu(); // Fecha o menu primeiro
    
    if (setting === 'Sair') {
      localStorage.removeItem('token');
      sessionStorage.clear(); 
      navigate('/login');
    } else if (setting === 'Minha Conta' || setting === 'Perfil') {
      navigate('/profile'); // <-- ADICIONADO: Redireciona para o perfil!
    }
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1 
      }}
    >
      <Toolbar sx={{ px: 2 }}>
        
        {/* Ícone e Título para Desktop */}
        <LocalHospitalIcon sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }} />
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            mr: 2,
            display: { xs: 'none', md: 'flex' },
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '.1rem',
            color: 'inherit',
            textDecoration: 'none',
            flexGrow: 1 
          }}
        >
          HealthSys
        </Typography>

        {/* Ícone e Título para Mobile */}
        <LocalHospitalIcon sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }} />
        <Typography
          variant="h5"
          noWrap
          component="div"
          sx={{
            mr: 2,
            display: { xs: 'flex', md: 'none' },
            flexGrow: 1,
            fontFamily: 'monospace',
            fontWeight: 700,
            letterSpacing: '.1rem',
            color: 'inherit',
            textDecoration: 'none',
          }}
        >
          SAÚDE
        </Typography>

        {/* Menu do Usuário (Avatar) na Direita */}
        <Box sx={{ flexGrow: 0 }}>
          <Tooltip title="Abrir configurações">
            <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
              <Avatar alt="Médico" src="/static/images/avatar/2.jpg" />
            </IconButton>
          </Tooltip>
          <Menu
            sx={{ mt: '45px' }}
            id="menu-appbar"
            anchorEl={anchorElUser}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElUser)}
            onClose={handleCloseUserMenu}
          >
            {settings.map((setting) => (
              // ALTERAÇÃO AQUI: Chama a função handleMenuClick em vez de apenas fechar
              <MenuItem key={setting} onClick={() => handleMenuClick(setting)}>
                <Typography sx={{ textAlign: 'center' }}>{setting}</Typography>
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default ResponsiveAppBar;