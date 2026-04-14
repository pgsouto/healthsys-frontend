import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome Completo' },
  { id: 'email', label: 'E-mail / Login' }, // Ajustado para bater com seu JSON
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

  // 1. Busca de Usuários - Ajustado para usar a URL do Back
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const url = searchTerm ? `/auth/usuarios?nome=${searchTerm}` : '/auth/usuarios';
        const response = await api.get(url);
        setUsers(response.data);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
    };
    fetchUsers();
  }, [refreshKey, searchTerm]);

  // 2. Busca de Permissões
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await api.get('/perfis'); 
        setRoles(response.data);
      } catch (error) {
        console.error("Erro ao buscar permissões:", error);
      }
    };
    fetchRoles();
  }, []);

  const handleOpen = (user = null) => {
    // Se estiver editando, precisamos garantir que o valor do Select seja o ID (Integer)
    // Se o seu 'row' da tabela não traz o ID do perfil, você precisará tratar isso aqui
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
    const data = Object.fromEntries(formData.entries());

    // PAYLOAD EXATO PARA O SPRING
    const payload = {
        nome: data.nome,
        email: data.email, // Nome do campo conforme seu JSON de Response/Request
        dataNascimento: "2000-01-01", 
        senha: data.password || undefined, // Não envia senha se estiver vazio na edição
        perfil: parseInt(data.perfil) // Envia o ID (1, 2, etc)
    };

    try {
        if (selectedUser?.id) {
            await api.put(`/auth/usuarios/${selectedUser.id}`, payload);
        } else {
            await api.post('/auth/usuarios', payload);
        }
        setRefreshKey(prev => prev + 1);
        handleClose();
    } catch (error) {
        console.error("Erro detalhado:", error.response?.data);
        alert(error.response?.data?.message || "Erro ao salvar usuário.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Usuários</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Novo Usuário
        </Button>
      </Stack>

      <GenericTable
        headCells={headCells}
        rows={users}
        renderRow={(row) => (
          <>
            <TableCell>{row.nome}</TableCell>
            <TableCell>{row.email}</TableCell> {/* Ajustado: era username */}
            <TableCell>{row.perfil}</TableCell> {/* Exibe "ADMIN" ou "USER" */}
            <TableCell align="right">
              <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
              <IconButton color="error" onClick={() => console.log("Delete", row.id)}><DeleteIcon /></IconButton>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave}>
        <DialogTitle>{selectedUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 400 }}>
            <TextField name="nome" label="Nome" fullWidth defaultValue={selectedUser?.nome} required />
            <TextField name="email" label="E-mail" fullWidth defaultValue={selectedUser?.email} required />
            
            <TextField 
                name="password" 
                label={selectedUser ? "Nova Senha (opcional)" : "Senha"} 
                type="password" 
                fullWidth 
                required={!selectedUser} 
            />

            <TextField
                select
                name="perfil"
                label="Permissão"
                fullWidth
                // IMPORTANTE: Aqui você seleciona o ID que o back espera no POST
                defaultValue={selectedUser?.perfil === "ADMIN" ? 1 : 2} 
                required
            >
                {roles.map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                        {role.nome}
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