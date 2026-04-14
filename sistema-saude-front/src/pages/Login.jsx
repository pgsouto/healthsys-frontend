import React, { useState } from 'react';
import { Box, Paper, TextField, Button, Typography, Stack, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Para mostrar erro visualmente
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // AJUSTE AQUI: O endpoint costuma ser '/auth/login' em microserviços
      // E as chaves devem bater com o seu LoginDTO no Java
      const response = await api.post('/auth/login', { 
        email: username, 
        senha: password // Se o seu DTO Java usa 'senha', mande 'senha'
      }); 
      
      const { token } = response.data;

      if (token) {
        console.log("Login bem-sucedido! Token recebido:", token);
        localStorage.setItem('token', token);
        
        // Garante que o axios use o token imediatamente
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`; 
        
        navigate('/patients'); 
      }
    } catch (error) {
      console.error("Erro no login:", error.response?.data);
      setError("Falha na autenticação. Verifique seu usuário e senha.");
    }
  };
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
      <Paper sx={{ p: 4, width: 350 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', textAlign: 'center' }}>
          Sistema Médico
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <Stack spacing={2}>
            <TextField 
              label="E-mail" 
              fullWidth 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
            />
            <TextField 
              label="Senha" 
              type="password" 
              fullWidth 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            <Button type="submit" variant="contained" size="large" fullWidth>
              Entrar
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default Login;