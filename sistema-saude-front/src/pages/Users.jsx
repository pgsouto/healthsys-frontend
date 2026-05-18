import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome Completo' },
  { id: 'email', label: 'E-mail / Login' },
  { id: 'permissao', label: 'Permissão' },
  { id: 'actions', label: 'Ações', numeric: true },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Busca de Usuários (Com suporte a Token Bearer injetado pelo interceptor)
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url = searchTerm
          ? `/auth/usuarios?nome=${encodeURIComponent(searchTerm)}`
          : '/auth/usuarios';
        const response = await api.get(url);
        setUsers(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        if (error.response?.status === 403) {
          alert("Acesso Negado: Seu perfil não possui autorização para listar usuários.");
        }
      }
    };
    fetchUsers();
  }, [refreshKey, searchTerm]);

  // 2. Busca de Perfis/Roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/auth/perfis');
        setRoles(response.data);
      } catch (error) {
        console.error('Erro ao buscar permissões:', error);
      }
    };
    fetchRoles();
  }, []);

  // CORREÇÃO CRÍTICA: Varre o objeto ou string do perfil retornado pelo back
  const selectedRoleId = useMemo(() => {
    if (!selectedUser?.perfil || roles.length === 0) return '';
    
    // Trata se o backend retornar o objeto cheio ou apenas o ID/String
    const perfilAlvo = typeof selectedUser.perfil === 'object' 
      ? selectedUser.perfil.descricao 
      : selectedUser.perfil;

    const perfilNormalizado = String(perfilAlvo).trim().toLowerCase();
    
    const role = roles.find(
      (r) => String(r.descricao || '').trim().toLowerCase() === perfilNormalizado || String(r.id) === perfilAlvo
    );
    return role?.id ?? '';
  }, [selectedUser, roles]);

  const handleOpen = (user = null) => {
    setSelectedUser(user);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedUser(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deseja realmente excluir este usuário?')) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao deletar:', error.response?.data || error);
      alert(error.response?.data?.message || 'Erro ao deletar usuário.');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const perfilId = Number(data.perfil);
    if (!perfilId || perfilId <= 0) {
      alert('Selecione uma permissão válida.');
      return;
    }

    const payload = {
      nome: data.nome,
      email: data.email,
      dataNascimento: data.dataNascimento,
      perfilId: perfilId, // CORREÇÃO: Alinhado com o DTO do Java que espera o ID explícito
    };

    if (!selectedUser?.id || (data.password && data.password.trim() !== '')) {
      payload.senha = data.password;
    }

    try {
      if (selectedUser?.id) {
        await api.put(`/auth/usuarios/${selectedUser.id}`, payload);
      } else {
        await api.post('/auth/usuarios', payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleClose();
    } catch (error) {
      console.error("Erro no salvamento:", error.response);
      alert(error.response?.data?.message || "Erro ao salvar usuário.");
    }
  };

  // Helper para renderizar a tabela tratando perfis aninhados
  const renderPerfilText = (perfilData) => {
    if (!perfilData) return 'N/A';
    return typeof perfilData === 'object' ? perfilData.descricao : perfilData;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Gerenciamento de Usuários
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Novo Usuário
        </Button>
      </Stack>

      {/* CORREÇÃO VISUAL: Input de busca que estava ausente no JSX original */}
      <Box sx={{ mb: 3, maxWidth: 400 }}>
        <TextField
          fullWidth
          size="small"
          label="Buscar por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon size="small" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <GenericTable
        headCells={headCells}
        rows={users}
        renderRow={(row) => (
          <>
            <TableCell>{row.nome}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{renderPerfilText(row.perfil)}</TableCell>
            <TableCell align="right">
              <IconButton color="primary" onClick={() => handleOpen(row)}>
                <EditIcon />
              </IconButton>
              <IconButton color="error" onClick={() => handleDelete(row.id)}>
                <DeleteIcon />
              </IconButton>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave}>
        <DialogTitle>{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 420 }}>
            <TextField name="nome" label="Nome" fullWidth defaultValue={selectedUser?.nome || ''} required />
            <TextField name="email" label="E-mail" type="email" fullWidth defaultValue={selectedUser?.email || ''} required />
            <TextField
              name="dataNascimento"
              label="Data de Nascimento"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              defaultValue={selectedUser?.dataNascimento || ''}
              required
            />
            <TextField
              name="password"
              label={selectedUser ? 'Nova Senha (opcional)' : 'Senha'}
              type="password"
              fullWidth
              required={!selectedUser}
            />
            <TextField
              select
              name="perfil"
              label="Permissão"
              fullWidth
              defaultValue={selectedRoleId}
              key={selectedRoleId} // Força re-render para atualizar o select na edição
              required
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.descricao}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Salvar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;