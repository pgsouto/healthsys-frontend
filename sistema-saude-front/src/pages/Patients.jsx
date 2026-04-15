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
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome do Paciente' },
  { id: 'cpf', label: 'CPF' },
  { id: 'dataNascimento', label: 'Data Nasc.' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'actions', label: 'Acoes', numeric: true },
];

// Formata "YYYY-MM-DD" (ou "YYYY-MM-DDTHH:mm:ss...") para "DD/MM/YYYY"
// sem usar new Date(), evitando bug de fuso horario.
const formatDateBR = (isoDate) => {
  if (!isoDate) return '-';
  const datePart = String(isoDate).slice(0, 10);
  const [y, m, d] = datePart.split('-');
  if (!y || !m || !d) return '-';
  return `${d}/${m}/${y}`;
};

// Garante valor compativel com input type="date"
const normalizeDateInput = (value) => {
  if (!value) return '';
  return String(value).slice(0, 10);
};

const Patients = () => {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [sexos, setSexos] = useState([]);
  const [generos, setGeneros] = useState([]);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const url = searchTerm
          ? `/api/pacientes?nome=${encodeURIComponent(searchTerm)}`
          : '/api/pacientes';
        const response = await api.get(url);
        setPatients(response.data);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      }
    };

    fetchPatients();
  }, [refreshKey, searchTerm]);

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
        console.error('Erro ao carregar opcoes:', err);
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
        console.error('Erro ao deletar:', error);
      }
    }
  };

  // PacienteResponseDTO traz sexo/genero como texto.
  // Aqui mapeamos esse texto para o id da opcao no select.
  const selectedSexoId = useMemo(() => {
    if (!selectedPatient?.sexo) return '';
    const opt = sexos.find(
      (s) => (s.descricao || s.nome) === selectedPatient.sexo
    );
    return opt?.id ?? '';
  }, [selectedPatient, sexos]);

  const selectedGeneroId = useMemo(() => {
    if (!selectedPatient?.genero) return '';
    const opt = generos.find(
      (g) => (g.descricao || g.nome) === selectedPatient.genero
    );
    return opt?.id ?? '';
  }, [selectedPatient, generos]);

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      nome: data.nome,
      nomeSocial: data.nomeSocial || null,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento, // YYYY-MM-DD do input date
      sexo: Number(data.sexoId),
      genero: Number(data.generoId),
      telefones: [data.tel1, data.tel2].filter(Boolean),
      alergias: [],
      enderecos: [],
    };

    try {
      if (selectedPatient) {
        await api.put(`/api/pacientes/${selectedPatient.id}`, payload);
      } else {
        await api.post('/api/pacientes', payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar paciente.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Pacientes
        </Typography>

        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="Consultar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: { xs: '100%', md: 300 }, bgcolor: 'white' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
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
        onDeleteSelected={(ids) => console.log('Excluir em massa:', ids)}
        renderRow={(row) => (
          <>
            <TableCell>{row.nome}</TableCell>
            <TableCell>{row.cpf}</TableCell>
            <TableCell>{formatDateBR(row.dataNascimento)}</TableCell>
            <TableCell>{row.telefones?.[0] || 'N/A'}</TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Prontuario">
                  <IconButton color="success" onClick={() => navigate(`/patients/${row.id}`)}>
                    <HistoryIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Editar">
                  <IconButton color="primary" onClick={() => handleOpen(row)}>
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Excluir">
                  <IconButton color="error" onClick={() => handleDelete(row.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
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
          <Stack spacing={2} sx={{ mt: 1, minWidth: { md: 500 } }}>
            <TextField
              name="nome"
              label="Nome Completo"
              fullWidth
              defaultValue={selectedPatient?.nome || ''}
              required
            />
            <TextField
              name="nomeSocial"
              label="Nome Social"
              fullWidth
              defaultValue={selectedPatient?.nomeSocial || ''}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                name="cpf"
                label="CPF"
                fullWidth
                defaultValue={selectedPatient?.cpf || ''}
                required
              />
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
              <TextField
                select
                name="sexoId"
                label="Sexo"
                fullWidth
                defaultValue={selectedSexoId}
                required
              >
                {sexos.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.descricao || opt.nome}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                name="generoId"
                label="Genero"
                fullWidth
                defaultValue={selectedGeneroId}
                required
              >
                {generos.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>
                    {opt.descricao || opt.nome}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Typography variant="subtitle2" color="textSecondary">
              Contatos
            </Typography>
            <Stack direction="row" spacing={2}>
              <TextField
                name="tel1"
                label="Telefone Principal"
                fullWidth
                defaultValue={selectedPatient?.telefones?.[0] || ''}
                required
              />
              <TextField
                name="tel2"
                label="Telefone Secundario"
                fullWidth
                defaultValue={selectedPatient?.telefones?.[1] || ''}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancelar
          </Button>
          <Button type="submit" variant="contained">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;
