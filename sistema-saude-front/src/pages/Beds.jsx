import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, Grid, Card, CardContent,
  Chip, Autocomplete, IconButton, Divider, CircularProgress, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BedIcon from '@mui/icons-material/Bed';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BuildIcon from '@mui/icons-material/Build';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import api from '../services/api';

const getStatusConfig = (status) => {
  const s = String(status || 'LIVRE').toUpperCase();
  if (s.includes('LIVRE')) return { color: 'success', icon: <BedIcon />, label: 'LIVRE' };
  if (s.includes('OCUPADO')) return { color: 'error', icon: <LocalHospitalIcon />, label: 'OCUPADO' };
  if (s.includes('MANUTENCAO') || s.includes('MANUTENÇÃO')) return { color: 'warning', icon: <BuildIcon />, label: 'EM MANUTENÇÃO' };
  return { color: 'default', icon: <BedIcon />, label: s };
};

const Beds = () => {
  const [leitos, setLeitos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [openLeitoModal, setOpenLeitoModal] = useState(false);
  const [openInternacaoModal, setOpenInternacaoModal] = useState(false);
  
  const [selectedLeito, setSelectedLeito] = useState(null);
  const [patientValue, setPatientValue] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resLeitos, resPacientes] = await Promise.all([
          api.get('/api/leitos'),
          api.get('/api/pacientes')
        ]);
        setLeitos(Array.isArray(resLeitos.data) ? resLeitos.data : []);
        setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      } catch (error) {
        console.error("Erro ao carregar ecrã de leitos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [refreshKey]);

  const handleOpenLeitoModal = (leito = null) => {
    setSelectedLeito(leito);
    setOpenLeitoModal(true);
  };

  const handleCloseLeitoModal = () => {
    setSelectedLeito(null);
    setOpenLeitoModal(false);
  };

  const handleSaveLeito = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    // CAMPOS ALINHADOS EXATAMENTE COM LEITO.JAVA (codigo e ala)
    const payload = {
      codigo: formData.get('codigo'),
      ala: formData.get('ala').toUpperCase(),
      status: formData.get('status')
    };

    try {
      if (selectedLeito?.id) {
        await api.put(`/api/leitos/${selectedLeito.id}`, payload);
      } else {
        await api.post('/api/leitos', payload);
      }
      setRefreshKey(old => old + 1);
      handleCloseLeitoModal();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao salvar especificações do leito.");
    }
  };

  const handleDeleteLeito = async (id) => {
    if (window.confirm('Deseja realmente remover este leito do sistema hospitalar?')) {
      try {
        await api.delete(`/api/leitos/${id}`);
        setRefreshKey(old => old + 1);
      } catch (error) {
        alert("Erro ao excluir leito.");
      }
    }
  };

  const handleOpenInternacao = (leito) => {
    setSelectedLeito(leito);
    setPatientValue(null);
    setOpenInternacaoModal(true);
  };

  const handleCloseInternacao = () => {
    setSelectedLeito(null);
    setPatientValue(null);
    setOpenInternacaoModal(false);
  };

  const handleInternar = async (e) => {
    e.preventDefault();
    if (!patientValue) {
      alert("Por favor, selecione um paciente.");
      return;
    }

    const formData = new FormData(e.currentTarget);
    const diagnostico = formData.get('diagnostico') || 'Admissão Hospitalar';

    try {
      // CORREÇÃO CRÍTICA: Envia os dados como Query Params para o Prontuário
      const url = `/api/prontuarios/internar?pacienteId=${patientValue.id}&leitoId=${selectedLeito.id}&diagnostico=${encodeURIComponent(diagnostico)}`;
      await api.post(url);
      
      alert("Internamento efetuado e registado no Prontuário!");
      setRefreshKey(old => old + 1);
      handleCloseInternacao();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao efetuar internamento.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Gestão de Leitos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenLeitoModal()}>
          Adicionar Leito
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {leitos.map((leito) => {
          const config = getStatusConfig(leito.status);
          const isLivre = leito.status === 'LIVRE';

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={leito.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                borderTop: `5px solid ${isLivre ? '#2e7d32' : leito.status === 'OCUPADO' ? '#d32f2f' : '#ed6c02'}`,
                boxShadow: 3
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${config.color}.light`, color: `${config.color}.dark` }}>
                      {config.icon}
                    </Avatar>
                    <Chip label={config.label} color={config.color} size="small" sx={{ fontWeight: 'bold' }} />
                  </Stack>
                  
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {leito.codigo || `Leito #${leito.id}`}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Ala: <strong>{leito.ala || 'Geral'}</strong>
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                    <Box>
                      <IconButton size="small" onClick={() => handleOpenLeitoModal(leito)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteLeito(leito.id)} color="error">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                    
                    {isLivre && (
                      <Button size="small" variant="contained" color="success" onClick={() => handleOpenInternacao(leito)}>
                        Internar
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Modal de Criar/Editar Leito */}
      <Dialog open={openLeitoModal} onClose={handleCloseLeitoModal} component="form" onSubmit={handleSaveLeito} maxWidth="xs" fullWidth>
        <DialogTitle>{selectedLeito ? 'Editar Configurações' : 'Novo Leito'}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField name="codigo" label="Código do Leito (Ex: UTI-01, ENF-102)" defaultValue={selectedLeito?.codigo || ''} fullWidth required />
            <TextField name="ala" label="Ala Hospitalar (Ex: UTI, ENFERMARIA, PEDIATRIA)" defaultValue={selectedLeito?.ala || ''} fullWidth required />
            <TextField select name="status" label="Status Inicial" defaultValue={selectedLeito?.status || 'LIVRE'} fullWidth required>
              <MenuItem value="LIVRE">Livre</MenuItem>
              <MenuItem value="OCUPADO">Ocupado</MenuItem>
              <MenuItem value="MANUTENCAO">Em Manutenção</MenuItem>
              <MenuItem value="HIGIENIZACAO">Em Higienização</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseLeitoModal}>Cancelar</Button>
          <Button type="submit" variant="contained">Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Internamento */}
      <Dialog open={openInternacaoModal} onClose={handleCloseInternacao} component="form" onSubmit={handleInternar} maxWidth="sm" fullWidth>
        <DialogTitle>Internar Paciente no {selectedLeito?.codigo}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Autocomplete
              options={pacientes}
              getOptionLabel={(opt) => opt ? `${opt.nome} (CPF: ${opt.cpf})` : ''}
              value={patientValue}
              onChange={(_, val) => setPatientValue(val)}
              renderInput={(params) => <TextField {...params} label="Selecionar Paciente Cadastrado" required />}
            />
            <TextField name="diagnostico" label="Motivo do Internamento / Diagnóstico Prévio" multiline rows={3} fullWidth required />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseInternacao}>Cancelar</Button>
          <Button type="submit" variant="contained" color="success">Efetuar Admissão</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Beds;