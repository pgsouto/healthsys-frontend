import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton, Chip, Autocomplete
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'paciente', label: 'Paciente' },
  { id: 'risco', label: 'Classificação' },
  { id: 'status', label: 'Status' },
  { id: 'actions', label: 'Ações', numeric: true },
];

const getRiscoColor = (idRisco) => {
  switch (idRisco) {
    case 5: return 'error';   // Vermelho
    case 4: return 'warning'; // Laranja
    case 3: return 'warning'; // Amarelo
    case 2: return 'success'; // Verde
    case 1: return 'info';    // Azul
    default: return 'default';
  }
};

const Screening = () => {
  const [triagens, setTriagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [riscos, setRiscos] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  
  const [open, setOpen] = useState(false);
  const [selectedTriagem, setSelectedTriagem] = useState(null);
  const [patientValue, setPatientValue] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 1. Carrega a lista de Triagens (Usando o prefixo /tri definido no Gateway)
  useEffect(() => {
    const fetchTriagens = async () => {
      try {
        const response = await api.get('/tri/triagens');
        setTriagens(response.data);
      } catch (error) {
        console.error('Erro ao buscar triagens:', error);
      }
    };
    fetchTriagens();
  }, [refreshKey]);

  // 2. Carrega opções iniciais conforme os caminhos do Gateway
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [resRisco, resStatus, resPacientes] = await Promise.all([
          api.get('/tri/riscos'),
          api.get('/tri/status'),
          api.get('/api/pacientes'), // Pacientes usam o prefixo /api no gateway
        ]);
        setRiscos(resRisco.data);
        setStatusOptions(resStatus.data);
        setPacientes(resPacientes.data);
      } catch (err) {
        console.error('Erro ao carregar opções:', err);
      }
    };
    fetchOptions();
  }, []);

  const handleOpen = (triagem = null) => {
    setSelectedTriagem(triagem);
    if (triagem) {
      const p = pacientes.find(opt => opt.id === triagem.paciente);
      setPatientValue(p || null);
    } else {
      setPatientValue(null);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTriagem(null);
    setPatientValue(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!patientValue) return alert("Selecione um paciente");

    const formData = new FormData(event.currentTarget);
    
    const payload = {
      paciente: patientValue.id,
      risco: Number(formData.get('riscoId')),
      status: Number(formData.get('statusId'))
    };

    try {
      if (selectedTriagem?.id) {
        await api.put(`/tri/triagens/${selectedTriagem.id}`, payload);
      } else {
        await api.post('/tri/triagens', payload);
      }
      setRefreshKey(old => old + 1);
      handleClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Erro ao processar triagem";
      alert(msg);
    }
  };

  const getPatientName = (uuid) => pacientes.find(p => p.id === uuid)?.nome || 'Buscando...';
  const getRiscoObj = (id) => riscos.find(r => r.id === id);
  const getStatusDesc = (id) => statusOptions.find(s => s.id === id)?.descricao || 'N/A';

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Triagens</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
          Nova Triagem
        </Button>
      </Stack>

      <GenericTable
        title="Fila de Atendimento"
        headCells={headCells}
        rows={triagens}
        renderRow={(row) => (
          <>
            <TableCell>{getPatientName(row.paciente)}</TableCell>
            <TableCell>
              <Chip 
                label={getRiscoObj(row.risco)?.descricao || 'Não definido'} 
                color={getRiscoColor(row.risco)} 
                variant="outlined"
              />
            </TableCell>
            <TableCell>{getStatusDesc(row.status)}</TableCell>
            <TableCell align="right">
              <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave}>
        <DialogTitle>{selectedTriagem ? 'Editar' : 'Nova'} Triagem</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1, minWidth: 450 }}>
            
            <Autocomplete
              options={pacientes}
              getOptionLabel={(opt) => `${opt.nome} (CPF: ${opt.cpf})`}
              value={patientValue}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, val) => setPatientValue(val)}
              renderInput={(params) => <TextField {...params} label="Paciente" required />}
            />

            <TextField
              select
              name="riscoId"
              label="Classificação de Risco"
              defaultValue={selectedTriagem?.risco || ''}
              key={selectedTriagem ? `edit-${selectedTriagem.id}` : 'new'} // Força o re-render do campo ao abrir
              required
            >
              {riscos.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>{opt.descricao}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              name="statusId"
              label="Status"
              defaultValue={selectedTriagem?.status || ''}
              key={selectedTriagem ? `status-${selectedTriagem.id}` : 'status-new'}
              required
            >
              {statusOptions.map((opt) => (
                <MenuItem key={opt.id} value={opt.id}>{opt.descricao}</MenuItem>
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

export default Screening;