import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, Divider, 
  Chip, Avatar, Stack, CircularProgress, Alert 
} from '@mui/material';
import { 
  Timeline, TimelineItem, TimelineSeparator, TimelineConnector, 
  TimelineContent, TimelineDot, TimelineOppositeContent 
} from '@mui/lab';
import MedicalInformationIcon from '@mui/icons-material/MedicalInformation';
import FavoriteIcon from '@mui/icons-material/Favorite';
import AssignmentIcon from '@mui/icons-material/Assignment';
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

const MedicalRecord = () => {
  const [paciente, setPaciente] = useState(null);
  const [historicoTriagens, setHistoricoTriagens] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const pacienteId = id || sessionStorage.getItem('selectedPacienteId');

  useEffect(() => {
    const carregarProntuario = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Chamadas otimizadas à API
        const [resPaciente, resTriagens, resStatus] = await Promise.all([
          api.get(`/api/pacientes/${pacienteId}`),
          api.get(`/tri/triagens/paciente/${pacienteId}`), // Nova rota do Backend!
          api.get('/tri/status')
        ]);

        setPaciente(resPaciente.data);
        setStatusOptions(Array.isArray(resStatus.data) ? resStatus.data : []);

        if (Array.isArray(resTriagens.data)) {
          // O backend já filtrou, apenas ordenamos da mais recente para a mais antiga
          const ordenadas = resTriagens.data.sort((a, b) => new Date(b.dataCriacao || b.data) - new Date(a.dataCriacao || a.data));
          setHistoricoTriagens(ordenadas);
        }

      } catch (err) {
        console.error("Erro ao carregar prontuário:", err);
        setError("Não foi possível carregar o prontuário deste doente. Verifica a ligação aos microsserviços.");
      } finally {
        setLoading(false);
      }
    };

    if (pacienteId) carregarProntuario();
  }, [pacienteId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 10, gap: 2 }}>
        <CircularProgress size={60} />
        <Typography color="textSecondary">A consolidar dados do processo clínico...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

  // Extrair alergias do backend (que podem vir como objetos ou strings)
  const renderAlergias = () => {
    if (!paciente?.alergias || paciente.alergias.length === 0) {
      return <Typography variant="body2" color="textSecondary">Nenhuma alergia grave registada.</Typography>;
    }
    
    return paciente.alergias.map((alergia, idx) => {
      const label = typeof alergia === 'object' ? alergia.descricao : alergia;
      return <Chip key={idx} label={label} color="error" size="small" variant="filled" />;
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* CABEÇALHO DO PRONTUÁRIO */}
      <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: 3, bgcolor: '#f8fafc' }}>
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
            <Stack direction="row" spacing={2} sx={{ mt: 1 }} divider={<Divider orientation="vertical" flexItem />}>
              <Typography variant="body2" color="textSecondary"><strong>CPF:</strong> {paciente?.cpf}</Typography>
              <Typography variant="body2" color="textSecondary"><strong>Data Nasc:</strong> {paciente?.dataNascimento}</Typography>
              <Typography variant="body2" color="textSecondary"><strong>Género/Sexo:</strong> {paciente?.genero || paciente?.sexo || 'Não Informado'}</Typography>
            </Stack>
          </Grid>
          <Grid item>
            <Chip label="PROCESSO ATIVO" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>
          ALERGIAS REGISTADAS:
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {renderAlergias()}
        </Stack>
      </Paper>

      {/* HISTÓRICO DE PASSAGENS (LINHA DO TEMPO) */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#334155' }}>
        Histórico de Admissões e Triagens Clínicas
      </Typography>

      {historicoTriagens.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <AssignmentIcon sx={{ fontSize: 50, color: '#94a3b8', mb: 1 }} />
          <Typography variant="body1" color="textSecondary">
            Este doente ainda não possui nenhum registo de triagem ou passagem hospitalar.
          </Typography>
        </Paper>
      ) : (
        <Timeline position="right">
          {historicoTriagens.map((triagem, index) => {
            const idRiscoReal = triagem.riscoId || (triagem.risco && typeof triagem.risco === 'object' ? triagem.risco.id : triagem.risco);
            const badgeRisco = getRiscoBadge(idRiscoReal);
            const dataHora = triagem.dataCriacao || triagem.data;

            const idStatusReal = triagem.statusId || triagem.status;
            const statusTexto = statusOptions.find(s => s.id === idStatusReal)?.descricao || 'Em Espera';

            return (
              <TimelineItem key={triagem.id || index}>
                {/* Lado Esquerdo: Identificador da Passagem */}
                <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} align="right" variant="body2" color="textSecondary">
                  {dataHora ? new Date(dataHora).toLocaleString() : `Registo #${historicoTriagens.length - index}`}
                </TimelineOppositeContent>

                {/* Linha e Ponto Central */}
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot color={badgeRisco.color}>
                    <FavoriteIcon fontSize="small" />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>

                {/* Lado Direito: Card Detalhado */}
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
                          Admissão e Classificação de Risco
                        </Typography>
                        <Chip label={badgeRisco.label} color={badgeRisco.color} size="small" sx={{ fontWeight: 'bold' }} />
                      </Stack>
                      
                      {/* SINAIS VITAIS ALINHADOS COM O BACKEND */}
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

                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #e2e8f0' }}>
                        <Typography variant="caption" color="textSecondary" display="block">ESTADO ATUAL DO ENCAMINHAMENTO</Typography>
                        <Chip label={statusTexto.toUpperCase()} size="small" variant="outlined" sx={{ mt: 0.5, fontWeight: 'bold' }} />
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