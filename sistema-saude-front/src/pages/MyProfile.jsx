import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Avatar, TextField, Button, 
  Stack, Divider, Card, CardContent, Alert, CircularProgress
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LockIcon from '@mui/icons-material/Lock';
import api from '../services/api';

// Função utilitária nativa para decifrar a carga (payload) do JWT
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

const MyProfile = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        const decoded = decodeJwt(token);
        // O assunto do token (sub) geralmente guarda o e-mail do utilizador autenticado
        const loggedEmail = decoded?.sub || decoded?.email;

        // Procura o utilizador correspondente na lista do auth-service
        const resUsers = await api.get('/auth/usuarios');
        const userFound = resUsers.data.find(u => u.email === loggedEmail);

        if (userFound) {
          setCurrentUser(userFound);
        }
      } catch (err) {
        console.error("Erro ao carregar perfil do utilizador:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    const formData = new FormData(e.currentTarget);
    const novaSenha = formData.get('novaSenha');
    const confirmarSenha = formData.get('confirmarSenha');

    if (novaSenha.length < 8) {
      setErrorMsg("A nova senha precisa de ter pelo menos 8 caracteres.");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      setErrorMsg("As senhas digitadas não coincidem.");
      return;
    }

    // Payload de atualização alinhado ao UsuarioRequestDTO
    const payload = {
      nome: currentUser.nome,
      email: currentUser.email,
      dataNascimento: currentUser.dataNascimento,
      perfil: currentUser.perfil?.id || currentUser.perfil,
      especialidade: currentUser.especialidade?.id || currentUser.especialidade || null,
      senha: novaSenha
    };

    try {
      await api.put(`/auth/usuarios/${currentUser.id}`, payload);
      setSuccessMsg("Senha atualizada com sucesso!");
      e.target.reset();
    } catch (err) {
      setErrorMsg("Erro ao atualizar a senha. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Minha Conta</Typography>

      <Grid container spacing={4}>
        {/* COLUNA DA ESQUERDA: DADOS PESSOAIS */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 2 }}>
            <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#1976d2' }}>
                <AccountCircleIcon sx={{ fontSize: 60 }} />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{currentUser?.nome}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Nível de Acesso: <strong>{currentUser?.perfil?.descricao || 'Utilizador'}</strong>
                </Typography>
              </Box>
            </Stack>

            <Divider sx={{ my: 3 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField label="Nome Completo" value={currentUser?.nome || ''} fullWidth disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="E-mail de Acesso" value={currentUser?.email || ''} fullWidth disabled />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Data de Nascimento" value={currentUser?.dataNascimento || ''} fullWidth disabled />
              </Grid>
              {currentUser?.especialidade && (
                <Grid item xs={12}>
                  <TextField label="Especialidade Médica" value={currentUser?.especialidade?.descricao || currentUser?.especialidade} fullWidth disabled />
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>

        {/* COLUNA DA DIREITA: SEGURANÇA / ALTERAR SENHA */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 2, boxShadow: 2 }}>
            <CardContent sx={{ p: 4 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <LockIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Segurança da Conta</Typography>
              </Stack>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Deseja alterar a sua credencial de acesso? Preencha os campos abaixo para definir uma nova senha.
              </Typography>

              {successMsg && <Alert severity="success" sx={{ mb: 3 }}>{successMsg}</Alert>}
              {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

              <Box component="form" onSubmit={handleUpdatePassword}>
                <Stack spacing={3}>
                  <TextField name="novaSenha" type="password" label="Nova Senha" fullWidth required helperText="Mínimo de 8 caracteres" />
                  <TextField name="confirmarSenha" type="password" label="Confirmar Nova Senha" fullWidth required />
                  <Button type="submit" variant="contained" color="primary" fullWidth sx={{ py: 1.5, fontWeight: 'bold' }}>
                    Atualizar Senha
                  </Button>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MyProfile;