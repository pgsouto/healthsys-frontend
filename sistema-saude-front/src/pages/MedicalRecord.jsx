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
  const [statusOptions, setStatusOptions] = useState([]); // Carrega as opções de texto de status do back
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { id } = useParams();
  const pacienteId = id || sessionStorage.getItem('selectedPacienteId');

  useEffect(() => {
    const carregarProntuario = async () => {
      try {
        setLoading(true);
        
        // Busca os dados do paciente, as triagens e a lista de status mestre para traduzir o ID do status
        const [resPaciente, resTriagens, resStatus] = await Promise.all([
          api.get(`/api/pacientes/${pacienteId}`),
          api.get('/tri/triagens'),
          api.get('/tri/status')
        ]);

        setPaciente(resPaciente.data);
        setStatusOptions(Array.isArray(resStatus.data) ? resStatus.data : []);

        if (Array.isArray(resTriagens.data)) {
          const idBusca = String(pacienteId).trim().toLowerCase();

          const filtradas = resTriagens.data
            .filter(t => {
              const idPacTriagem = String(t.pacienteId || t.paciente || '').trim().toLowerCase();
              return idPacTriagem === idBusca;
            })
            .sort((a, b) => new Date(b.dataCriacao || b.data) - new Date(a.dataCriacao || a.data));
          
          setHistoricoTriagens(filtradas);
        }

      } catch (err) {
        console.error("Erro ao carregar prontuário:", err);
        setError("Não foi possível carregar o prontuário deste paciente. Verifique a integração dos microsserviços.");
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
        <Typography color="textSecondary">Consolidando dados do prontuário eletrônico...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  }

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
              <Typography variant="body2" color="textSecondary"><strong>Gênero/Sexo:</strong> {paciente?.genero || paciente?.sexo || 'Não Informado'}</Typography>
            </Stack>
          </Grid>
          <Grid item>
            <Chip label="PRONTUÁRIO ATIVO" color="success" variant="outlined" sx={{ fontWeight: 'bold' }} />
          </Grid>
        </Grid>
      </Paper>

      {/* HISTÓRICO DE PASSAGENS (LINHA DO TEMPO) */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#334155' }}>
        Histórico de Admissões e Triagens Clínicas
      </Typography>

      {historicoTriagens.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <AssignmentIcon sx={{ fontSize: 50, color: '#94a3b8', mb: 1 }} />
          <Typography variant="body1" color="textSecondary">
            Este paciente ainda não possui nenhum registro de triagem ou passagem hospitalar.
          </Typography>
        </Paper>
      ) : (
        <Timeline position="right">
          {historicoTriagens.map((triagem, index) => {
            const idRiscoReal = triagem.riscoId || (triagem.risco && typeof triagem.risco === 'object' ? triagem.risco.id : triagem.risco);
            const badgeRisco = getRiscoBadge(idRiscoReal);
            const dataHora = triagem.dataCriacao || triagem.data;

            // Traduz o ID do status recebido para a descrição textual correta
            const idStatusReal = triagem.statusId || triagem.status;
            const statusTexto = statusOptions.find(s => s.id === idStatusReal)?.descricao || 'Em Espera';

            return (
              <TimelineItem key={triagem.id || index}>
                {/* Lado Esquerdo: Identificador da Passagem */}
                <TimelineOppositeContent sx={{ m: 'auto 0', flex: 0.2 }} align="right" variant="body2" color="textSecondary">
                  {dataHora ? new Date(dataHora).toLocaleString() : `Registro #${historicoTriagens.length - index}`}
                </TimelineOppositeContent>

                {/* Linha e Ponto Central */}
                <TimelineSeparator>
                  <TimelineConnector />
                  <TimelineDot color={badgeRisco.color}>
                    <FavoriteIcon fontSize="small" />
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>

                {/* Lado Direito: Card Simplificado de Admissão */}
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

                      <Typography variant="body2" color="textSecondary">
                        O paciente deu entrada na unidade distribuída e foi classificado segundo o Protocolo de Manchester.
                      </Typography>
                      
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid #f1f5f9' }}>
                        <Typography variant="caption" color="textSecondary" display="block">STATUS ATUAL DO ENCAMINHAMENTO</Typography>
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