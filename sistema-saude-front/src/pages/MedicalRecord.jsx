import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, Divider, 
  Chip, Avatar, Stack, CircularProgress, Alert, List, ListItem, ListItemText, ListItemIcon
} from '@mui/material';
import { 
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot, TimelineOppositeContent 
} from '@mui/lab';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BugReportIcon from '@mui/icons-material/BugReport';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import PhoneIcon from '@mui/icons-material/Phone';
import EventIcon from '@mui/icons-material/Event';
import api from '../services/api';
import { useParams } from 'react-router-dom';

const getRiscoBadge = (idRisco) => {
  const id = Number(idRisco);
  switch (id) {
    case 5: return { label: 'EMERGÊNCIA', color: 'error' };
    case 4: return { label: 'MUITO URGENTE', color: 'warning' };
    case 3: return { label: 'URGENTE', color: 'warning' };
    case 2: return { label: 'POUCO URGENTE', color: 'success' };
    case 1: return { label: 'NÃO URGENTE', color: 'info' };
    default: return { label: 'N/A', color: 'default' };
  }
};

const formatDateBR = (isoDate) => {
  if (!isoDate) return '-';
  const datePart = String(isoDate).slice(0, 10);
  const [y, m, d] = datePart.split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : datePart;
};

const MedicalRecord = () => {
  const [paciente, setPaciente] = useState(null);
  const [historicoTriagens, setHistoricoTriagens] = useState([]);
  const [vacinasAplicadas, setVacinasAplicadas] = useState([]); // NOVO ESTADO
  const [statusOptions, setStatusOptions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const pacienteId = id || sessionStorage.getItem('selectedPacienteId');

  useEffect(() => {
    const carregarProntuarioCompleto = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // NOVO: Adicionado endpoint de vacinas do paciente no fluxo paralelo
        const [resPaciente, resTriagens, resStatus, resVacinas] = await Promise.all([
          api.get(`/api/pacientes/${pacienteId}`),
          api.get(`/tri/triagens/paciente/${pacienteId}`),
          api.get('/tri/status'),
          api.get(`/api/paciente-vacinas/paciente/${pacienteId}`).catch(() => ({ data: [] })) // Seguro contra falhas
        ]);

        setPaciente(resPaciente.data);
        setStatusOptions(Array.isArray(resStatus.data) ? resStatus.data : []);
        setVacinasAplicadas(Array.isArray(resVacinas.data) ? resVacinas.data : []);

        if (Array.isArray(resTriagens.data)) {
          const ordenadas = resTriagens.data.sort((a, b) => new Date(b.dataCriacao || b.data) - new Date(a.dataCriacao || a.data));
          setHistoricoTriagens(ordenadas);
        }

      } catch (err) {
        console.error("Erro ao carregar prontuário integrado:", err);
        setError("Não foi possível consolidar o prontuário eletrónico. Verifique as conexões de rede.");
      } finally {
        setLoading(false);
      }
    };

    if (pacienteId) carregarProntuarioCompleto();
  }, [pacienteId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
        <CircularProgress size={60} />
        <Typography color="textSecondary">A consolidar prontuário e histórico vacinal...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* SEÇÃO 1: CABEÇALHO BIOGRÁFICO */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3, bgcolor: '#f8fafc', borderTop: '6px solid #0288d1' }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <Avatar sx={{ width: 70, height: 70, bgcolor: '#0288d1' }}>
              <MedicalInformationIcon fontSize="large" />
            </Avatar>
          </Grid>
          <Grid item xs={12} sm>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
              {paciente?.nome}
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: 'wrap', gap: 1 }} divider={<Divider orientation="vertical" flexItem />}>
              <Typography variant="body2" color="textSecondary"><strong>CPF:</strong> {paciente?.cpf ? paciente.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : '-'}</Typography>
              <Typography variant="body2" color="textSecondary"><strong>Nascimento:</strong> {formatDateBR(paciente?.dataNascimento)}</Typography>
              <Typography variant="body2" color="textSecondary"><strong>Sexo/Gênero:</strong> {paciente?.genero || paciente?.sexo || 'Geral'}</Typography>
              <Typography variant="body2" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <PhoneIcon fontSize="inherit" /> {paciente?.telefones?.[0] || 'Sem telefone'}
              </Typography>
            </Stack>
          </Grid>
          <Grid item>
            <Chip label="PRONTUÁRIO INTEGRADO" color="info" sx={{ fontWeight: 'bold' }} />
          </Grid>
        </Grid>
      </Paper>

      {/* SEÇÃO 2: CARD CLÍNICO (N ALERGIAS E N COMORBIDADES) */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, borderLeft: '5px solid #d32f2f' }}>
            <CardContent>
              <Typography variant="subtitle1" color="error" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BugReportIcon /> Alergias Diagnosticadas
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1}>
                {!paciente?.alergias || paciente.alergias.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">Nenhuma alergia alimentar ou medicamentosa relatada.</Typography>
                ) : (
                  paciente.alergias.map((alergia, idx) => (
                    <Chip key={idx} label={typeof alergia === 'object' ? alergia.descricao : alergia} color="error" variant="outlined" sx={{ fontWeight: 'bold' }} />
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', boxShadow: 2, borderLeft: '5px solid #7b1fa2' }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ color: '#7b1fa2', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CoronavirusIcon /> Comorbidades e DCNT
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap gap={1}>
                {!paciente?.comorbidades || paciente.comorbidades.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">Nenhuma comorbidade crônica mapeada no cadastro.</Typography>
                ) : (
                  paciente.comorbidades.map((comorb, idx) => (
                    <Chip key={idx} label={typeof comorb === 'object' ? comorb.descricao : comorb} color="secondary" variant="outlined" sx={{ fontWeight: 'bold' }} />
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SEÇÃO 3: CARTEIRA DE VACINAÇÃO DO PACIENTE */}
      <Card sx={{ mb: 4, boxShadow: 2, borderLeft: '5px solid #2e7d32' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <VaccinesIcon /> Carteira de Imunização e Histórico Vacinal
          </Typography>
          <Divider sx={{ mb: 1 }} />
          {vacinasAplicadas.length === 0 ? (
            <Typography variant="body2" color="textSecondary" sx={{ p: 1 }}>Nenhum registro de vacina aplicada associado a este prontuário.</Typography>
          ) : (
            <List dense>
              <Grid container spacing={1}>
                {vacinasAplicadas.map((v) => (
                  <Grid item xs={12} sm={6} md={4} key={v.id}>
                    <ListItem sx={{ bgcolor: '#f8fafc', mb: 1, borderRadius: 1.5, border: '1px solid #e2e8f0' }}>
                      <ListItemIcon sx={{ minWidth: 35 }}>
                        <VaccinesIcon color="success" size="small" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={v.vacinaNome || v.vacina?.nome || "Imunizante"} 
                        secondary={
                          <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                            <EventIcon fontSize="inherit" /> Aplicada em: {formatDateBR(v.dataAplicacao)}
                          </Box>
                        } 
                        primaryTypographyProps={{ fontWeight: 'bold', variant: 'body2' }}
                        secondaryTypographyProps={{ variant: 'caption' }}
                      />
                    </ListItem>
                  </Grid>
                ))}
              </Grid>
            </List>
          )}
        </CardContent>
      </Card>

      {/* SEÇÃO 4: HISTÓRICO DE TRIARENS (LINHA DO TEMPO) */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#334155', mt: 4 }}>
        Histórico de Evolução e Passagens Hospitalares
      </Typography>

      {historicoTriagens.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
          <AssignmentIcon sx={{ fontSize: 50, color: '#94a3b8', mb: 1 }} />
          <Typography variant="body1" color="textSecondary">
            Este paciente não registra triagens ou passagens abertas no pronto-socorro.
          </Typography>
        </Paper>
      ) : (
        <Timeline position="right" sx={{ p: 0 }}>
          {historicoTriagens.map((triagem, index) => {
            const idRiscoReal = triagem.riscoId || (triagem.risco && typeof triagem.risco === 'object' ? triagem.risco.id : triagem.risco);
            const badgeRisco = getRiscoBadge(idRiscoReal);
            const dataHora = triagem.dataCriacao || triagem.data;

            const idStatusReal = triagem.statusId || triagem.status;
            const statusTexto = statusOptions.find(s => s.id === idStatusReal)?.descricao || 'Fila de Espera';

            return (
              <TimelineItem key={triagem.id || index}>
                <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} align="right" variant="body2" color="textSecondary">
                  {dataHora ? new Date(dataHora).toLocaleString() : `Registo #${historicoTriagens.length - index}`}
                </TimelineOppositeContent>

                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot color={badgeRisco.color}>
                    <FavoriteIcon fontSize="small" />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>

                <TimelineContent sx={{ py: '12px', px: 2 }}>
                  <Card sx={{ 
                    boxShadow: 2, 
                    borderRadius: 2, 
                    borderLeft: `6px solid ${
                      badgeRisco.color === 'error' ? '#d32f2f' : 
                      badgeRisco.color === 'warning' ? '#ef6c00' : 
                      badgeRisco.color === 'success' ? '#2e7d32' : '#0288d1'
                    }` 
                  }}>
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                          Classificação Protocolo de Manchester
                        </Typography>
                        <Chip label={badgeRisco.label} color={badgeRisco.color} size="small" sx={{ fontWeight: 'bold' }} />
                      </Stack>
                      
                      <Grid container spacing={2} sx={{ mb: 2, bgcolor: '#f1f5f9', p: 1.5, borderRadius: 1.5 }}>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="textSecondary" display="block">TEMP.</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{triagem.temperatura || '--'} °C</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="textSecondary" display="block">GLICEMIA</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{triagem.glicemia || '--'} mg/dL</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="textSecondary" display="block">FC</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{triagem.frequenciaCardiaca || '--'} bpm</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="textSecondary" display="block">SPO2</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{triagem.saturacaoOxigenio || '--'}%</Typography>
                        </Grid>
                        <Grid item xs={6} sm={2.4}>
                          <Typography variant="caption" color="textSecondary" display="block">FR</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{triagem.frequenciaRespiratoria || '--'} irpm</Typography>
                        </Grid>
                      </Grid>

                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" color="textSecondary" display="block">STATUS DO ENCAMINHAMENTO</Typography>
                        <Chip label={statusTexto.toUpperCase()} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 'bold', color: '#475569' }} />
                      </Box>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      )}
    </Box>
  );
};

export default MedicalRecord;