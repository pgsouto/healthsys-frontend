import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome Completo' },
  { id: 'email', label: 'E-mail' },
  { id: 'perfil', label: 'Perfil' },
  { id: 'especialidade', label: 'Especialidade' },
  { id: 'actions', label: 'Ações', numeric: true },
];

const Users = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);

  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Carrega Utilizadores, Perfis e Especialidades da API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resUsers, resPerfis, resEsp] = await Promise.all([
          api.get('/auth/usuarios'),
          api.get('/auth/perfis'),
          api.get('/auth/especialidades')
        ]);
        setUsuarios(Array.isArray(resUsers.data) ? resUsers.data : []);
        setPerfis(Array.isArray(resPerfis.data) ? resPerfis.data : []);
        setEspecialidades(Array.isArray(resEsp.data) ? resEsp.data : []);
      } catch (error) {
        console.error("Erro ao buscar dados de autenticação:", error);
      }
    };
    fetchData();
  }, [refreshKey]);

  const handleOpen = (user = null) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    const senhaForm = formData.get('senha');

    if (!selectedUser && (!senhaForm || senhaForm.length < 8)) {
        alert("A senha é obrigatória na criação e deve ter pelo menos 8 caracteres.");
        return;
    }
    if (selectedUser && senhaForm && senhaForm.length < 8) {
        alert("A nova senha deve ter pelo menos 8 caracteres.");
        return;
    }

    const especialidadeValue = formData.get('especialidade');

    const payload = {
      nome: formData.get('nome'),
      email: formData.get('email'),
      dataNascimento: formData.get('dataNascimento'),
      perfil: Number(formData.get('perfil')), 
      especialidade: especialidadeValue ? Number(especialidadeValue) : null 
    };

    if (senhaForm) {
      payload.senha = senhaForm;
    }

    try {
      if (selectedUser?.id) {
        await api.put(`/auth/usuarios/${selectedUser.id}`, payload);
      } else {
        await api.post('/auth/usuarios', payload);
      }
      setRefreshKey(old => old + 1);
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error.response);
      alert(error.response?.data?.message || "Erro ao processar e salvar usuário.");
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        spacing={2} 
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestão de Usuários</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()} 
          fullWidth={{ xs: true, sm: false }}
        >
          Novo Usuário
        </Button>
      </Stack>

      <GenericTable
        title="Usuários do Sistema"
        headCells={headCells}
        rows={usuarios}
        renderRow={(row) => {
          // LÓGICA À PROVA DE BALA PARA O PERFIL:
          const perfilObj = perfis.find(p => Number(p.id) === Number(row.perfil?.id || row.perfil));
          const perfilTexto = row.perfil?.descricao || row.perfil?.nome || perfilObj?.descricao || perfilObj?.nome || row.perfil || 'N/A';

          // LÓGICA À PROVA DE BALA PARA A ESPECIALIDADE:
          const espObj = especialidades.find(e => Number(e.id) === Number(row.especialidade?.id || row.especialidade));
          const espTexto = row.especialidade?.descricao || row.especialidade?.nome || espObj?.descricao || espObj?.nome || row.especialidade || '-';

          return (
            <>
              <TableCell>{row.nome}</TableCell>
              <TableCell>{row.email}</TableCell>
              <TableCell>{perfilTexto}</TableCell>
              <TableCell>{espTexto}</TableCell>
              <TableCell align="right">
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
              </TableCell>
            </>
          );
        }}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedUser ? 'Editar' : 'Novo'} Usuário</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField name="nome" label="Nome Completo" defaultValue={selectedUser?.nome || ''} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="email" type="email" label="E-mail" defaultValue={selectedUser?.email || ''} fullWidth required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                name="dataNascimento" 
                type="date" 
                label="Data de Nascimento" 
                defaultValue={selectedUser?.dataNascimento || ''} 
                InputLabelProps={{ shrink: true }} 
                fullWidth 
                required 
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField 
                name="senha" 
                type="password" 
                label={selectedUser ? "Nova Senha (opcional)" : "Senha de Acesso"} 
                fullWidth 
                required={!selectedUser} 
                helperText="Mínimo de 8 caracteres"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                select 
                name="perfil" 
                label="Perfil de Acesso" 
                defaultValue={selectedUser?.perfil?.id || selectedUser?.perfil || selectedUser?.perfilId || ''} 
                fullWidth 
                required
              >
                {/* Agora procura por opt.descricao ou opt.nome */}
                {perfis.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.descricao || opt.nome}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField 
                select 
                name="especialidade" 
                label="Especialidade Médica (Apenas se aplicável)" 
                defaultValue={selectedUser?.especialidade?.id || selectedUser?.especialidade || ''} 
                fullWidth
              >
                <MenuItem value=""><em>Nenhuma / Não se aplica</em></MenuItem>
                {/* Agora procura por opt.descricao ou opt.nome */}
                {especialidades.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.descricao || opt.nome}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Salvar Configurações</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;