import React, { useState } from 'react';
import { 
  Box, 
  Paper, 
  TextField, 
  Button, 
  Typography, 
  Stack, 
  Alert, 
  CssBaseline 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
      {/* O CssBaseline remove margens padrão e garante que o 100vh funcione perfeitamente */}
      <CssBaseline />
      
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', md: 'row' },
        minHeight: '100dvh', // Altura dinâmica da viewport
        width: '100vw',
        overflowX: 'hidden' // Garante que nada escape para os lados
      }}>
        
        {/* LADO ESQUERDO: Painel Informativo (Oculto em telas pequenas) */}
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

        {/* LADO DIREITO: Área do Formulário */}
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          bgcolor: '#f5f5f5',
          p: { xs: 2, sm: 4 } // Padding responsivo
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
                <TextField 
                  label="Senha" 
                  type="password" 
                  variant="outlined"
                  fullWidth 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
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
                    textTransform: 'none' // Evita o CAPS LOCK automático do Material UI
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