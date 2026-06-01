import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, Grid, Card, CardContent,
  Chip, Autocomplete, Divider, CircularProgress, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BedIcon from '@mui/icons-material/Bed';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import BuildIcon from '@mui/icons-material/Build';
import NoCrashIcon from '@mui/icons-material/NoCrash';
import PersonIcon from '@mui/icons-material/Person';
import api from '../services/api';

const getStatusConfig = (status) => {
  const s = String(status || 'LIVRE').toUpperCase();
  if (s.includes('LIVRE')) return { color: 'success', icon: <BedIcon />, label: 'LIVRE' };
  if (s.includes('OCUPADO')) return { color: 'error', icon: <LocalHospitalIcon />, label: 'OCUPADO' };
  if (s.includes('MANUTENCAO') || s.includes('MANUTENÇÃO')) return { color: 'warning', icon: <BuildIcon />, label: 'EM MANUTENÇÃO' };
  if (s.includes('HIGIENIZACAO') || s.includes('HIGIENIZAÇÃO')) return { color: 'info', icon: <NoCrashIcon />, label: 'HIGIENIZAÇÃO' };
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
          api.get('/bed/leitos'),
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

  const handleOpenLeitoModal = () => setOpenLeitoModal(true);
  const handleCloseLeitoModal = () => setOpenLeitoModal(false);

  const handleSaveLeito = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const payload = {
      codigo: formData.get('codigo'),
      ala: formData.get('ala').toUpperCase(),
      status: formData.get('status')
    };
    try {
      await api.post('/bed/leitos', payload);
      setRefreshKey(old => old + 1);
      handleCloseLeitoModal();
    } catch (error) {
      alert(error.response?.data?.message || "Erro ao cadastrar leito hospitalar.");
    }
  };

  const handleLiberarLeito = async (idLeito) => {
    if (window.confirm("Confirmar desocupação do leito e emissão de alta lógica?")) {
      try {
        await api.post(`/bed/leitos/${idLeito}/liberar`);
        alert("Leito desocupado e higienizado com sucesso!");
        setRefreshKey(old => old + 1);
      } catch (error) {
        alert("Erro ao tentar liberar leito.");
      }
    }
  };

  // ✅ NOVO: Marcar leito higienizado como livre
  const handleHigienizarLeito = async (idLeito) => {
    if (window.confirm("Confirmar que o leito foi higienizado e está pronto para uso?")) {
      try {
        await api.post(`/bed/leitos/${idLeito}/higienizar`);
        alert("Leito marcado como livre!");
        setRefreshKey(old => old + 1);
      } catch (error) {
        alert("Erro ao marcar leito como livre.");
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
      alert("Por favor, selecione um paciente cadastrado.");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const diagnostico = formData.get('diagnostico') || 'Admissão Hospitalar';
    try {
      const url = `/med/api/prontuarios/internar?pacienteId=${patientValue.id}&leitoId=${selectedLeito.id}&diagnostico=${encodeURIComponent(diagnostico)}`;
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
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Camas e Leitos</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenLeitoModal}>
          Cadastrar Novo Leito
        </Button>
      </Stack>

      <Grid container spacing={3}>
        {leitos.map((leito) => {
          const config = getStatusConfig(leito.status);
          const isLivre = leito.status === 'LIVRE';
          const isOcupado = leito.status === 'OCUPADO';
          const isHigienizacao = leito.status === 'HIGIENIZACAO';

          const pacienteNome = isOcupado 
            ? (pacientes.find(p => p.id === leito.pacienteId)?.nome || "Paciente Identificado") 
            : null;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={leito.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                borderTop: `5px solid ${isLivre ? '#2e7d32' : isOcupado ? '#d32f2f' : isHigienizacao ? '#0288d1' : '#ed6c02'}`,
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
                    Ala Hospitalar: <strong>{leito.ala || 'Geral'}</strong>
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  {isOcupado && (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, bgcolor: '#fff5f5', p: 1, borderRadius: 1 }}>
                      <PersonIcon color="error" fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                        Ocupante: {pacienteNome}
                      </Typography>
                    </Stack>
                  )}

                  {/* ✅ NOVO: Mensagem informativa para leitos em higienização */}
                  {isHigienizacao && (
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, bgcolor: '#e3f2fd', p: 1, borderRadius: 1 }}>
                      <NoCrashIcon color="info" fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#0277bd' }}>
                        Aguardando higienização
                      </Typography>
                    </Stack>
                  )}

                  <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                    {isLivre && (
                      <Button size="small" variant="contained" color="success" onClick={() => handleOpenInternacao(leito)}>
                        Internar Paciente
                      </Button>
                    )}
                    {isOcupado && (
                      <Button size="small" variant="contained" color="warning" onClick={() => handleLiberarLeito(leito.id)}>
                        Liberar Leito
                      </Button>
                    )}
                    {/* ✅ NOVO: Botão para marcar leito higienizado como livre */}
                    {isHigienizacao && (
                      <Button size="small" variant="contained" color="info" onClick={() => handleHigienizarLeito(leito.id)}>
                        Marcar como Livre
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Modal de Cadastrar Leito */}
      <Dialog open={openLeitoModal} onClose={handleCloseLeitoModal} component="form" onSubmit={handleSaveLeito} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Inserir Novo Leito no Sistema</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField name="codigo" label="Código Identificador (Ex: UTI-10, ENF-02)" fullWidth placeholder="Digite o código..." required />
            <TextField name="ala" label="Ala Hospitalar (Ex: UTI, PEDIATRIA, ISOLAMENTO)" fullWidth placeholder="Digite a ala..." required />
            <TextField select name="status" label="Estado Inicial" defaultValue="LIVRE" fullWidth required>
              <MenuItem value="LIVRE">LIVRE</MenuItem>
              <MenuItem value="MANUTENCAO">EM MANUTENÇÃO</MenuItem>
              <MenuItem value="HIGIENIZACAO">EM HIGIENIZAÇÃO</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseLeitoModal} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">Cadastrar</Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Internamento */}
      <Dialog open={openInternacaoModal} onClose={handleCloseInternacao} component="form" onSubmit={handleInternar} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Internar Paciente no {selectedLeito?.codigo}</DialogTitle>
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
          <Button onClick={handleCloseInternacao} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" color="success">Confirmar Admissão</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Beds;