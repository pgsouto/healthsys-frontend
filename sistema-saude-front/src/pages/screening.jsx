import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton, Chip, Autocomplete, Grid, Divider
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
  const id = Number(idRisco);
  switch (id) {
    case 5: return 'error';   // Vermelho (Emergência)
    case 4: return 'warning'; // Laranja (Muito Urgente)
    case 3: return 'warning'; // Amarelo (Urgente)
    case 2: return 'success'; // Verde (Pouco Urgente)
    case 1: return 'info';    // Azul (Não Urgente)
    default: return 'default';
  }
};

const Screening = () => {
  const [triagens, setTriagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [sintomas, setSintomas] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  
  const [open, setOpen] = useState(false);
  const [selectedTriagem, setSelectedTriagem] = useState(null);
  const [patientValue, setPatientValue] = useState(null);
  const [selectedSintomas, setSelectedSintomas] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Carrega as triagens existentes
  useEffect(() => {
    api.get('/tri/triagens')
      .then(res => setTriagens(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error('Erro ao buscar triagens:', err));
  }, [refreshKey]);

  // Carrega opções iniciais (Sintomas, Status e Pacientes)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [resSintomas, resStatus, resPacientes] = await Promise.all([
          api.get('/tri/sintomas'),
          api.get('/tri/status'),
          api.get('/api/pacientes'),
        ]);
        setSintomas(Array.isArray(resSintomas.data) ? resSintomas.data : []);
        setStatusOptions(Array.isArray(resStatus.data) ? resStatus.data : []);
        setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      } catch (err) {
        console.error('Erro ao carregar opções:', err);
      }
    };
    fetchOptions();
  }, []);

  // Lógica de cálculo de risco baseada no maior risco mapeado
  const calcularRiscoFinal = (sintomasEscolhidos) => {
    if (!sintomasEscolhidos || sintomasEscolhidos.length === 0) return null;
    
    return sintomasEscolhidos.reduce((prev, curr) => {
      const prevId = prev && typeof prev.risco === 'object' ? Number(prev.risco.id) : Number(prev?.risco || prev?.riscoId || 0);
      const currId = curr && typeof curr.risco === 'object' ? Number(curr.risco.id) : Number(curr?.risco || curr?.riscoId || 0);
      return (prevId > currId) ? prev : curr;
    });
  };

  // Memoriza o risco sugerido para evitar re-cálculos e quebras de renderização
  const riscoSugerido = useMemo(() => calcularRiscoFinal(selectedSintomas), [selectedSintomas]);

  const handleOpen = (triagem = null) => {
    setSelectedTriagem(triagem);
    if (triagem) {
      const idPacienteAlvo = triagem.pacienteId || triagem.paciente;
      setPatientValue(pacientes.find(p => p.id === idPacienteAlvo) || null);
      setSelectedSintomas([]);
    } else {
      setPatientValue(null);
      setSelectedSintomas([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedTriagem(null);
    setPatientValue(null);
    setSelectedSintomas([]);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    
    if (!patientValue || !patientValue.id) {
      alert("Selecione um paciente válido na lista antes de prosseguir.");
      return;
    }
    if (selectedSintomas.length === 0) {
      alert("Selecione pelo menos um sintoma para classificar o risco de Manchester.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const riscoSugeridoId = riscoSugerido && typeof riscoSugerido.risco === 'object' 
      ? riscoSugerido.risco.id 
      : (riscoSugerido?.risco || riscoSugerido?.riscoId);

    // PAYLOAD TOTALMENTE AJUSTADO AO TRIAGEM_REQUEST_DTO DO JAVA
    const payload = {
      paciente: patientValue.id,
      risco: Number(riscoSugeridoId || 1),
      status: Number(formData.get('statusId') || 1),
      dataCriacao: selectedTriagem?.dataCriacao || new Date().toISOString(), // Injeta a data atual (obrigatória no back)
      temperatura: formData.get('temperatura') || null,
      glicemia: formData.get('glicemia') || null,
      frequenciaCardiaca: formData.get('frequenciaCardiaca') || null,
      saturacaoOxigenio: formData.get('saturacaoOxigenio') || null,
      frequenciaRespiratoria: formData.get('frequenciaRespiratoria') || null
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
      console.error("Erro ao salvar triagem:", error.response);
      alert(error.response?.data?.message || "Erro ao processar e salvar triagem clínica.");
    }
  };

  const riscoSugeridoId = riscoSugerido && typeof riscoSugerido.risco === 'object' ? riscoSugerido.risco.id : (riscoSugerido?.risco || riscoSugerido?.riscoId);
  const riscoSugeridoDesc = riscoSugerido && typeof riscoSugerido.risco === 'object' ? riscoSugerido.risco.descricao : (riscoSugerido?.riscoDescricao || 'Triagem');

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Topo Responsivo */}
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', sm: 'center' }} 
        spacing={2} 
        sx={{ mb: 3 }}
      >
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gerenciamento de Triagem</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          fullWidth={{ xs: true, sm: false }}
        >
          Nova Admissão / Triagem
        </Button>
      </Stack>

      <GenericTable
        title="Fila de Espera - Protocolo de Manchester"
        headCells={headCells}
        rows={triagens}
        renderRow={(row) => {
          const idPac = row.pacienteId || row.paciente;
          const idRiscoReal = row.riscoId || (row.risco && typeof row.risco === 'object' ? row.risco.id : row.risco);
          
          const getRiscoTexto = () => {
            if (row.riscoDescricao) return row.riscoDescricao;
            if (row.risco && typeof row.risco === 'object' && row.risco.descricao) return row.risco.descricao;
            
            switch (Number(idRiscoReal)) {
              case 5: return 'EMERGÊNCIA';
              case 4: return 'MUITO URGENTE';
              case 3: return 'URGENTE';
              case 2: return 'POUCO URGENTE';
              case 1: return 'NÃO URGENTE';
              default: return 'PENDENTE';
            }
          };

          return (
            <>
              <TableCell>{pacientes.find(p => p.id === idPac)?.nome || 'Buscando Paciente...'}</TableCell>
              <TableCell>
                <Chip 
                  label={getRiscoTexto().toUpperCase()} 
                  color={getRiscoColor(idRiscoReal)} 
                  sx={{ fontWeight: 'bold' }}
                />
              </TableCell>
              <TableCell>{statusOptions.find(s => s.id === row.statusId || s.id === row.status)?.descricao || 'Pendente'}</TableCell>
              <TableCell align="right">
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
              </TableCell>
            </>
          );
        }}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave} maxWidth="md" fullWidth>
        <DialogTitle>{selectedTriagem ? 'Atualizar' : 'Iniciar'} Classificação de Risco</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            
            {/* SEÇÃO 1: IDENTIFICAÇÃO */}
            <Grid item xs={12}>
              <Autocomplete
                options={pacientes}
                getOptionLabel={(opt) => opt ? `${opt.nome || ''} (CPF: ${opt.cpf || ''})` : ''}
                value={patientValue}
                onChange={(_, val) => setPatientValue(val)}
                renderInput={(params) => <TextField {...params} label="Identificar Paciente" required />}
              />
            </Grid>

            {/* SEÇÃO 2: SINAIS VITAIS */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 1 }}>Sinais Vitais do Paciente</Divider>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="temperatura" label="Temp. (°C)" defaultValue={selectedTriagem?.temperatura || ""} fullWidth placeholder="Ex: 36.5" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="glicemia" label="Glicemia (mg/dL)" defaultValue={selectedTriagem?.glicemia || ""} fullWidth placeholder="Ex: 90" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField name="frequenciaCardiaca" label="Freq. Cardíaca (bpm)" defaultValue={selectedTriagem?.frequenciaCardiaca || ""} fullWidth placeholder="Ex: 80" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="saturacaoOxigenio" label="Saturação (%)" defaultValue={selectedTriagem?.saturacaoOxigenio || ""} fullWidth placeholder="Ex: 98" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="frequenciaRespiratoria" label="Freq. Respiratória (irpm)" defaultValue={selectedTriagem?.frequenciaRespiratoria || ""} fullWidth placeholder="Ex: 16" />
            </Grid>

            {/* SEÇÃO 3: AVALIAÇÃO DE SINTOMAS */}
            <Grid item xs={12}>
              <Divider sx={{ mb: 1 }}>Protocolo de Manchester</Divider>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={sintomas}
                value={selectedSintomas}
                getOptionLabel={(opt) => {
                  if (!opt) return '';
                  const riscoObj = opt.risco;
                  const descRisco = riscoObj && typeof riscoObj === 'object' 
                    ? (riscoObj.descricao || 'Geral') 
                    : (opt.riscoDescricao || 'Geral');
                  return `${opt.descricao || ''} (${String(descRisco).toUpperCase()})`;
                }}
                onChange={(_, val) => setSelectedSintomas(val || [])}
                renderInput={(params) => <TextField {...params} label="Sintomas e Queixas Observadas" placeholder="Selecione..." />}
              />
            </Grid>

            {/* SEÇÃO 4: RESULTADO AUTOMÁTICO */}
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>GRAVIDADE CALCULADA:</Typography>
                {riscoSugerido ? (
                  <Chip 
                    label={String(riscoSugeridoDesc).toUpperCase()} 
                    color={getRiscoColor(riscoSugeridoId)}
                    sx={{ fontSize: '1rem', p: 2, height: 'auto', fontWeight: 'bold' }}
                  />
                ) : (
                  <Typography color="textSecondary" variant="body2">Aguardando queixas...</Typography>
                )}
              </Box>
            </Grid>

            {/* SEÇÃO 5: STATUS */}
            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField 
                select 
                name="statusId" 
                label="Status Inicial do Atendimento" 
                defaultValue={selectedTriagem?.statusId || selectedTriagem?.status || 1} 
                fullWidth 
                required
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.descricao}</MenuItem>
                ))}
              </TextField>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button type="submit" variant="contained">Salvar e Enviar para Fila</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Screening;