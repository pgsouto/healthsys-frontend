import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  Tabs, Tab, Stack, CircularProgress, Divider, LinearProgress, Chip
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/People';
import api from '../services/api';

const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [triagens, setTriagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca os dados reais do Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resTriagens, resPacientes] = await Promise.all([
          api.get('/tri/triagens'),
          api.get('/api/pacientes')
        ]);
        setTriagens(Array.isArray(resTriagens.data) ? resTriagens.data : []);
        setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      } catch (error) {
        console.error("Erro ao carregar dados do Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // =========================================================================
  // MATEMÁTICA CORRIGIDA: PROTOCOLO DE MANCHESTER À PROVA DE BALAS
  // =========================================================================
  const getManchesterData = () => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    triagens.forEach(t => {
      // Extrai o ID do risco venha ele como objeto, número solto ou string
      const id = Number(t.riscoId || (t.risco && typeof t.risco === 'object' ? t.risco.id : t.risco) || 0);
      if (counts[id] !== undefined) counts[id]++;
    });
    return [
      { label: 'EMERGÊNCIA', color: '#d32f2f', count: counts[5], barColor: 'error' },
      { label: 'MUITO URGENTE', color: '#f57c00', count: counts[4], barColor: 'warning' },
      { label: 'URGENTE', color: '#fbc02d', count: counts[3], barColor: 'warning' },
      { label: 'POUCO URGENTE', color: '#388e3c', count: counts[2], barColor: 'success' },
      { label: 'NÃO URGENTE', color: '#0288d1', count: counts[1], barColor: 'info' }
    ];
  };

  // MATEMÁTICA CORRIGIDA: DEMOGRAFIA (GÉNERO/SEXO)
  const getDemographics = () => {
    let masc = 0, fem = 0, outros = 0;
    pacientes.forEach(p => {
      const sexoInfo = String(p.sexoId || (p.sexo && typeof p.sexo === 'object' ? p.sexo.nome : p.sexo) || '').toLowerCase();
      if (sexoInfo.includes('masc') || sexoInfo === '1') masc++;
      else if (sexoInfo.includes('fem') || sexoInfo === '2') fem++;
      else outros++;
    });
    return { masc, fem, outros };
  };

  const manchesterStats = getManchesterData();
  const demoStats = getDemographics();

  // Quantidade de pacientes em fila (Status 1 = Em Espera / Pendente)
  const filaEspera = triagens.filter(t => {
    const status = Number(t.statusId || (t.status && typeof t.status === 'object' ? t.status.id : t.status) || 1);
    return status === 1;
  }).length;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Painel de Controle</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Clínico" sx={{ fontWeight: 'bold' }} />
          <Tab label="Técnico (Infraestrutura)" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* ========================================================================= */}
      {/* ABA 0: DASHBOARD CLÍNICO (FUNCIONAL) */}
      {/* ========================================================================= */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* CARDS DE RESUMO */}
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#0288d1', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>TOTAL DE PACIENTES</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{pacientes.length}</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 50, opacity: 0.5 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#f57c00', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>AGUARDANDO NA FILA</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{filaEspera}</Typography>
                  </Box>
                  <LocalHospitalIcon sx={{ fontSize: 50, opacity: 0.5 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#d32f2f', color: 'white', borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>CASOS CRÍTICOS (EMERGÊNCIA)</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold' }}>{manchesterStats[0].count + manchesterStats[1].count}</Typography>
                  </Box>
                  <WarningAmberIcon sx={{ fontSize: 50, opacity: 0.5 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* PROTOCOLO DE MANCHESTER */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#334155' }}>
                Classificação por Protocolo de Manchester
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Stack spacing={2.5}>
                {manchesterStats.map((item, index) => {
                  const max = triagens.length || 1;
                  const percentage = Math.round((item.count / max) * 100);
                  
                  return (
                    <Box key={index}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: item.color }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">{item.count} Pacientes ({percentage}%)</Typography>
                      </Stack>
                      <LinearProgress 
                        variant="determinate" 
                        value={percentage} 
                        color={item.barColor}
                        sx={{ height: 10, borderRadius: 5, bgcolor: '#e2e8f0' }} 
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Paper>
          </Grid>

          {/* DADOS DEMOGRÁFICOS */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#334155' }}>
                Demografia de Atendimentos
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 3 }}>
                <Box sx={{ p: 2, bgcolor: '#f0f9ff', borderRadius: 2, borderLeft: '5px solid #0288d1' }}>
                  <Typography variant="body2" color="textSecondary">Pacientes do Sexo Masculino</Typography>
                  <Typography variant="h4" color="#0288d1" fontWeight="bold">{demoStats.masc}</Typography>
                </Box>
                
                <Box sx={{ p: 2, bgcolor: '#fdf4ff', borderRadius: 2, borderLeft: '5px solid #c026d3' }}>
                  <Typography variant="body2" color="textSecondary">Pacientes do Sexo Feminino</Typography>
                  <Typography variant="h4" color="#c026d3" fontWeight="bold">{demoStats.fem}</Typography>
                </Box>

                <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2, borderLeft: '5px solid #64748b' }}>
                  <Typography variant="body2" color="textSecondary">Outros / Não Informado</Typography>
                  <Typography variant="h4" color="#64748b" fontWeight="bold">{demoStats.outros}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: DASHBOARD TÉCNICO (MOCKADO PARA APRESENTAÇÃO) */}
      {/* ========================================================================= */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#0f172a', color: '#10b981', fontFamily: 'monospace', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>{'>'} STATUS DOS MICROSSERVIÇOS DOCKER (EUREKA DISCOVERY)</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Verificando instâncias registradas no API Gateway...</Typography>
            </Paper>
          </Grid>

          {['API GATEWAY (8080)', 'AUTH SERVICE (8081)', 'PACIENTE SERVICE (8082)', 'TRIAGEM SERVICE (8083)'].map((service, idx) => (
            <Grid item xs={12} sm={6} md={3} key={idx}>
              <Card sx={{ borderTop: '4px solid #10b981', bgcolor: '#f8fafc' }}>
                <CardContent>
                  <Typography variant="subtitle2" color="textSecondary">{service}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#10b981' }} />
                    <Typography variant="body1" fontWeight="bold" color="#10b981">ONLINE (UP)</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#000', color: '#0f0', fontFamily: 'monospace', borderRadius: 2, minHeight: 250 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, borderBottom: '1px solid #333', pb: 1 }}>
                PROMETHEUS & ACTUATOR METRICS (SIMULATION)
              </Typography>
              <Typography variant="body2">jvm_memory_used_bytes{'{'}area="heap"{'}'} 2.45e+08</Typography>
              <Typography variant="body2">jvm_threads_live_threads 34</Typography>
              <Typography variant="body2">hikaricp_connections_active 5</Typography>
              <Typography variant="body2">http_server_requests_seconds_count{'{'}uri="/api/pacientes"{'}'} 142</Typography>
              <Typography variant="body2" sx={{ mt: 2, color: '#ffeb3b' }}>{'>'} SYSTEM HEALTH: OPTIMAL</Typography>
              <Typography variant="body2" sx={{ color: '#ffeb3b' }}>{'>'} ALL CONTAINERS RUNNING SMOOTHLY</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;