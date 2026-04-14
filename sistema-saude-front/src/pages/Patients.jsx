import React, { useState, useEffect } from 'react';
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

// Importação do seu novo componente genérico
import GenericTable from '../components/GenericTable';

// Configuração das colunas para a tabela de pacientes
const headCells = [
  { id: 'nome', label: 'Nome do Paciente' },
  { id: 'cpf', label: 'CPF' },
  { id: 'dataNascimento', label: 'Data Nasc.' },
  { id: 'telefone', label: 'Telefone' },
  { id: 'actions', label: 'Ações', numeric: true },
];

const Patients = () => {
  const navigate = useNavigate();
  
  // Estados
  const [patients, setPatients] = useState([]); // Estado para os dados da tabela
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [searchTerm, setSearchTerm] = useState('');
  const [sexos, setSexos] = useState([]);
  const [generos, setGeneros] = useState([]);

  // 1. Carregar Pacientes (e filtrar por busca)
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const url = searchTerm ? `/patients?nome=${searchTerm}` : '/patients';
        const response = await api.get(url);
        setPatients(response.data);
      } catch (error) {
        console.error("Erro ao buscar pacientes:", error);
      }
    };
    fetchPatients();
  }, [refreshKey, searchTerm]);

  // 2. Carregar Opções dos Selects (Sexo/Gênero)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [resSexo, resGenero] = await Promise.all([
          api.get('/sexos'),
          api.get('/generos')
        ]);
        setSexos(resSexo.data);
        setGeneros(resGenero.data);
      } catch (err) {
        console.error("Erro ao carregar opções:", err);
      }
    };
    fetchOptions();
  }, []);

  // Funções de Ação
  const handleOpen = (patient = null) => {
    setSelectedPatient(patient);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPatient(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Deseja realmente excluir este paciente?")) {
      try {
        await api.delete(`/patients/${id}`);
        setRefreshKey(prev => prev + 1); 
      } catch (error) {
        console.error("Erro ao deletar:", error);
      }
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const payload = {
      nome: data.nome,
      nomeSocial: data.nomeSocial,
      cpf: data.cpf,
      dataNascimento: data.dataNascimento,
      sexo: { id: data.sexoId },
      genero: data.generoId ? { id: data.generoId } : null,
      telefones: [
        { numero: data.tel1 },
        { numero: data.tel2 }
      ].filter(t => t.numero !== "")
    };

    try {
      if (selectedPatient) {
        await api.put(`/patients/${selectedPatient.id}`, payload);
      } else {
        await api.post('/patients', payload);
      }
      setRefreshKey(prev => prev + 1);
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar paciente.");
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Cabeçalho */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', md: 'center' }} 
        spacing={2} 
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Pacientes</Typography>

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
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpen()}
          >
            Novo Paciente
          </Button>
        </Stack>
      </Stack>

      {/* A TABELA GENÉRICA */}
      <GenericTable
        title="Listagem de Pacientes"
        headCells={headCells}
        rows={patients}
        onDeleteSelected={(ids) => console.log("Excluir em massa:", ids)}
        renderRow={(row) => (
          <>
            <TableCell>{row.nome}</TableCell>
            <TableCell>{row.cpf}</TableCell>
            <TableCell>
              {row.dataNascimento ? new Date(row.dataNascimento).toLocaleDateString('pt-BR') : '-'}
            </TableCell>
            <TableCell>
              {row.telefones?.[0]?.numero || 'N/A'}
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Prontuário">
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

      {/* Modal de Cadastro/Edição */}
      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedPatient ? 'Editar' : 'Novo'} Paciente
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1, minWidth: { md: 500 } }}>
            <TextField name="nome" label="Nome Completo" fullWidth defaultValue={selectedPatient?.nome} required />
            <TextField name="nomeSocial" label="Nome Social" fullWidth defaultValue={selectedPatient?.nomeSocial} />
            <Stack direction="row" spacing={2}>
              <TextField name="cpf" label="CPF" fullWidth defaultValue={selectedPatient?.cpf} required />
              <TextField name="dataNascimento" label="Data Nasc." type="date" fullWidth InputLabelProps={{ shrink: true }} defaultValue={selectedPatient?.dataNascimento} required />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField select name="sexoId" label="Sexo" fullWidth defaultValue={selectedPatient?.sexo?.id || ""} required>
                {sexos.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt.descricao || opt.nome}</MenuItem>)}
              </TextField>
              <TextField select name="generoId" label="Gênero" fullWidth defaultValue={selectedPatient?.genero?.id || ""}>
                <MenuItem value="">Não informar</MenuItem>
                {generos.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt.descricao || opt.nome}</MenuItem>)}
              </TextField>
            </Stack>
            <Typography variant="subtitle2" color="textSecondary">Contatos</Typography>
            <Stack direction="row" spacing={2}>
              <TextField name="tel1" label="Telefone Principal" fullWidth defaultValue={selectedPatient?.telefones?.[0]?.numero} required />
              <TextField name="tel2" label="Telefone Secundário" fullWidth defaultValue={selectedPatient?.telefones?.[1]?.numero} />
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