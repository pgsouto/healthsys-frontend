import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Stack, 
  Alert, 
  CssBaseline,
  InputAdornment, // Importação adicionada
  IconButton      // Importação adicionada
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';     // Ícone de olho aberto
import VisibilityOff from '@mui/icons-material/VisibilityOff'; // Ícone de olho fechado
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  
  // Estado para controlar a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();

  // Funções para alternar o olhinho da senha
  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (event) => {
    event.preventDefault(); // Evita que o input perca o foco ao clicar no ícone
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await api.post('/auth/login', { 
        email: username, 
        senha: password 
      }); 
      
      const { token } = response.data;

      if (token) {
        localStorage.setItem('token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
        navigate('/patients'); 
      }
    } catch (error) {
      setError("Falha na autenticação. Verifique seu usuário e senha.");
    }
  };
  
  return (
    <>
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: '100dvh', 
        width: '100vw',
        overflowX: 'hidden' 
      }}>
        
        {/* LADO ESQUERDO */}
        <Box sx={{ 
          flex: 1, 
          display: { xs: 'none', md: 'flex' }, 
          background: 'linear-gradient(135deg, #1976d2 10%, #003366 100%, #0d214f 60%)',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          p: 4
        }}>
          <Stack spacing={2} sx={{ textAlign: 'center', maxWidth: 500 }}>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Bem-vindo
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Gestão hospitalar de forma simples e eficiente.
            </Typography>
          </Stack>
        </Box>

        {/* LADO DIREITO */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          bgcolor: '#f5f5f5',
          p: { xs: 2, sm: 4 } 
        }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, md: 5 }, 
              width: '100%', 
              maxWidth: 450, 
              borderRadius: 2 
            }}
          >
            <Typography 
              variant="h4" 
              sx={{ 
                mb: 4, 
                fontWeight: 'bold', 
                textAlign: 'center', 
                color: '#1976d2' 
              }}
            >
              HealthSys
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleLogin}>
              <Stack spacing={3}>
                <TextField 
                  label="E-mail" 
                  variant="outlined"
                  fullWidth 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required 
                />
                
                {/* Campo de Senha Atualizado com o Olhinho */}
                <TextField 
                  label="Senha" 
                  type={showPassword ? 'text' : 'password'} // Alterna entre text e password
                  variant="outlined"
                  fullWidth 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button 
                  type="submit" 
                  variant="contained" 
                  size="large" 
                  fullWidth 
                  sx={{ 
                    py: 1.8, 
                    fontWeight: 'bold', 
                    fontSize: '1rem',
                    textTransform: 'none' 
                  }}
                >
                  Entrar
                </Button>
              </Stack>
            </form>
          </Paper>
        </Box>
      </Box>
    </>
  );
};

export default Login;