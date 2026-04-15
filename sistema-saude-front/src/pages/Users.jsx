import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome Completo' },
  { id: 'email', label: 'E-mail / Login' },
  { id: 'permissao', label: 'Permissao' },
  { id: 'actions', label: 'Acoes', numeric: true },
];

const Users = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url = searchTerm
          ? `/auth/usuarios?nome=${encodeURIComponent(searchTerm)}`
          : '/auth/usuarios';
        const response = await api.get(url);
        setUsers(response.data);
      } catch (error) {
        console.error('Erro ao buscar usuarios:', error);
      }
    };
    fetchUsers();
  }, [refreshKey, searchTerm]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/auth/perfis');
        setRoles(response.data);
      } catch (error) {
        console.error('Erro ao buscar permissoes:', error);
      }
    };
    fetchRoles();
  }, []);

  const selectedRoleId = useMemo(() => {
    if (!selectedUser?.perfil || roles.length === 0) return '';
    const perfilNormalizado = String(selectedUser.perfil).trim().toLowerCase();
    const role = roles.find(
      (r) => String(r.descricao || '').trim().toLowerCase() === perfilNormalizado
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
    if (!window.confirm('Deseja realmente excluir este usuario?')) return;
    try {
      await api.delete(`/auth/usuarios/${id}`);
      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      console.error('Erro ao deletar:', error.response?.data || error);
      alert(error.response?.data?.message || 'Erro ao deletar usuario.');
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const perfilId = Number(data.perfil);
    if (!Number.isInteger(perfilId) || perfilId <= 0) {
      alert('Selecione uma permissao valida.');
      return;
    }

    const payload = {
      nome: data.nome,
      email: data.email,
      dataNascimento: data.dataNascimento,
      perfil: perfilId,
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
    console.error("status:", error.response?.status);
    console.error("data:", error.response?.data);
    console.error("url:", error.config?.url);
    alert(error.response?.data?.message || error.message || "Erro ao salvar usuario.");
  }

  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Usuarios
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Novo Usuario
        </Button>
      </Stack>

      <TextField
        size="small"
        label="Buscar por nome"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 2, minWidth: 280 }}
      />

      <GenericTable
        headCells={headCells}
        rows={users}
        renderRow={(row) => (
          <>
            <TableCell>{row.nome}</TableCell>
            <TableCell>{row.email}</TableCell>
            <TableCell>{row.perfil}</TableCell>
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
        <DialogTitle>{selectedUser ? 'Editar Usuario' : 'Novo Usuario'}</DialogTitle>
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
              label="Permissao"
              fullWidth
              defaultValue={selectedUser ? selectedRoleId : ''}
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
