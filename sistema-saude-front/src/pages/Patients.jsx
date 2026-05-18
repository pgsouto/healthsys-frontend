import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, InputAdornment, MenuItem,
  TableCell, IconButton, Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HistoryIcon from '@mui/icons-material/History';
import AssignmentIcon from '@mui/icons-material/Assignment'; // Ícone excelente para o prontuário
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome do Paciente' },
  { id: 'cpf', label: 'CPF' },
  { id: 'dataNascimento', label: 'Data Nasc.' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'actions', label: 'Ações', numeric: true },
];

const formatDateBR = (isoDate) => {
  if (!isoDate) return '-';
  const datePart = String(isoDate).slice(0, 10);
  const [y, m, d] = datePart.split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : '-';
};

const normalizeDateInput = (value) => value ? String(value).slice(0, 10) : '';

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexos, setSexos] = useState([]);
  const [generos, setGeneros] = useState([]);

  // 1. Busca Pacientes (Gateway /api/pacientes)
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const url = searchTerm
          ? `/api/pacientes?cpf=${encodeURIComponent(searchTerm)}`
          : '/api/pacientes';
        const response = await api.get(url);
        setPatients(response.data);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      }
    };
    fetchPatients();
  }, [refreshKey, searchTerm]);

  // 2. Busca Opções (Gateway /api/...)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [resSexo, resGenero] = await Promise.all([
          api.get('/api/sexos'),
          api.get('/api/generos'),
        ]);
        setSexos(resSexo.data);
        setGeneros(resGenero.data);
      } catch (err) {
        console.error('Erro ao carregar opções:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleOpen = (patient = null) => {
    setSelectedPatient(patient);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPatient(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este paciente?')) {
      try {
        await api.delete(`/api/pacientes/${id}`);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert('Erro ao deletar: Verifique se o paciente possui triagens vinculadas.');
      }
    }
  };

  // FUNÇÃO NOVA: Trata o clique no prontuário guardando o estado global da sessão
  const handleVerProntuario = (patient) => {
    if (!patient || !patient.id) return;
    
    // Alimenta o sessionStorage para destravar o botão inteligente do menu lateral
    sessionStorage.setItem('selectedPacienteId', patient.id);
    
    // Redireciona usando a rota dinâmica por ID (/patients/:id) do seu App.jsx
    navigate(`/patients/${patient.id}`);
  };

  // Mapeia texto para ID para o Select funcionar na Edição
  const selectedSexoId = useMemo(() => {
    if (!selectedPatient?.sexo) return '';
    return sexos.find(s => (s.descricao || s.nome) === selectedPatient.sexo)?.id || '';
  }, [selectedPatient, sexos]);

  const selectedGeneroId = useMemo(() => {
    if (!selectedPatient?.genero) return '';
    return generos.find(g => (g.descricao || g.nome) === selectedPatient.genero)?.id || '';
  }, [selectedPatient, generos]);

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      nome: data.nome,
      nomeSocial: data.nomeSocial || null,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento,
      sexo: Number(data.sexoId),
      genero: Number(data.generoId),
      telefones: [data.tel1, data.tel2].filter(Boolean),
      alergias: [],
      enderecos: [],
    };

    try {
      if (selectedPatient?.id) {
        await api.put(`/api/pacientes/${selectedPatient.id}`, payload);
      } else {
        await api.post('/api/pacientes', payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao salvar paciente.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Pacientes</Typography>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Consultar por CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Novo Paciente
          </Button>
        </Stack>
      </Stack>

      <GenericTable
        title="Listagem de Pacientes"
        headCells={headCells}
        rows={patients}
        renderRow={(row) => (
          <>
            <TableCell>{row.nome}</TableCell>
            <TableCell>{row.cpf}</TableCell>
            <TableCell>{formatDateBR(row.dataNascimento)}</TableCell>
            <TableCell>{row.telefones?.[0] || 'N/A'}</TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                
                {/* NOVO BOTÃO: Prontuário Eletrônico integrado por Paciente */}
                <Tooltip title="Ver Prontuário">
                  <IconButton color="info" onClick={() => handleVerProntuario(row)}>
                    <AssignmentIcon />
                  </IconButton>
                </Tooltip>

                <Tooltip title="Histórico de Triagens">
                  <IconButton color="success" onClick={() => navigate(`/screening/patient/${row.id}`)}>
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>

                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
              </Stack>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedPatient ? 'Editar' : 'Novo'} Paciente
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1, minWidth: { md: 500 } }} key={selectedPatient?.id || 'new'}>
            <TextField name="nome" label="Nome Completo" fullWidth defaultValue={selectedPatient?.nome || ''} required />
            <TextField name="nomeSocial" label="Nome Social" fullWidth defaultValue={selectedPatient?.nomeSocial || ''} />
            
            <Stack direction="row" spacing={2}>
              <TextField name="cpf" label="CPF" fullWidth defaultValue={selectedPatient?.cpf || ''} required />
              <TextField 
                name="dataNascimento" 
                label="Data Nasc." 
                type="date" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                defaultValue={normalizeDateInput(selectedPatient?.dataNascimento)} 
                required 
              />
            </Stack>

            <Stack direction="row" spacing={2}>
              <TextField select name="sexoId" label="Sexo" fullWidth defaultValue={selectedSexoId} required>
                {sexos.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt.descricao || opt.nome}</MenuItem>)}
              </TextField>
              <TextField select name="generoId" label="Gênero" fullWidth defaultValue={selectedGeneroId} required>
                {generos.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt.descricao || opt.nome}</MenuItem>)}
              </TextField>
            </Stack>

            <Typography variant="subtitle2" color="textSecondary">Contatos</Typography>
            <Stack direction="row" spacing={2}>
              <TextField name="tel1" label="Telefone Principal" fullWidth defaultValue={selectedPatient?.telefones?.[0] || ''} required />
              <TextField name="tel2" label="Telefone Secundário" fullWidth defaultValue={selectedPatient?.telefones?.[1] || ''} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;