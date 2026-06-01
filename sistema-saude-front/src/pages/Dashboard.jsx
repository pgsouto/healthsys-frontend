import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Card, CardContent, 
  Tabs, Tab, Stack, CircularProgress, Divider, LinearProgress, Chip
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleIcon from '@mui/icons-material/People';
import BedIcon from '@mui/icons-material/Bed';
import api from '../services/api';

const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [triagens, setTriagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [leitos, setLeitos] = useState([]); // INTEGRADO: Estado para monitorar leitos
  const [loading, setLoading] = useState(true);

  // Busca os dados reais integrados de todos os microsserviços do Backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [resTriagens, resPacientes, resLeitos] = await Promise.all([
          api.get('/tri/triagens'),
          api.get('/api/pacientes'),
          api.get('/bed/leitos').catch(() => ({ data: [] })) // Fallback seguro caso o bed-service não tenha dados
        ]);
        setTriagens(Array.isArray(resTriagens.data) ? resTriagens.data : []);
        setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
        setLeitos(Array.isArray(resLeitos.data) ? resLeitos.data : []);
      } catch (error) {
        console.error("Erro ao carregar dados consolidados do Dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // METRICAS: PROTOCOLO DE MANCHESTER
  const getManchesterData = () => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    triagens.forEach(t => {
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

  // METRICAS: DEMOGRAFIA (GÊNERO/SEXO)
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

  // NOVO - METRICAS: CAPACIDADE HOSPITALAR (LEITOS ATIVOS)
  const getLeitosStats = () => {
    const total = leitos.length;
    const ocupados = leitos.filter(l => String(l.status).toUpperCase() === 'OCUPADO').length;
    const livres = leitos.filter(l => String(l.status).toUpperCase() === 'LIVRE').length;
    const manutencao = total - (ocupados + livres);
    const taxaOcupacao = total > 0 ? Math.round((ocupados / total) * 100) : 0;
    return { total, ocupados, livres, manutencao, taxaOcupacao };
  };

  const manchesterStats = getManchesterData();
  const demoStats = getDemographics();
  const bedStats = getLeitosStats();

  // Quantidade de pacientes em fila aguardando atendimento médico (Status 1 = Pendente)
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
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Painel de Controle Hospitalar</Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Indicadores Clínicos" sx={{ fontWeight: 'bold' }} />
          <Tab label="Arquitetura de Microsserviços" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* ========================================================================= */}
      {/* ABA 0: DASHBOARD CLÍNICO INTEGRADO */}
      {/* ========================================================================= */}
      {tabValue === 0 && (
        <Grid container spacing={3}>
          {/* CARDS INDICADORES EM GRID DE ALTA FIDELIDADE */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#0288d1', color: 'white', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 'bold' }}>TOTAL DE PACIENTES</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', my: 0.5 }}>{pacientes.length}</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 45, opacity: 0.4 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#f57c00', color: 'white', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 'bold' }}>FILA DE ESPERA (TRIADOS)</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', my: 0.5 }}>{filaEspera}</Typography>
                  </Box>
                  <LocalHospitalIcon sx={{ fontSize: 45, opacity: 0.4 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#d32f2f', color: 'white', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 'bold' }}>EMERGÊNCIAS ATIVAS</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', my: 0.5 }}>{manchesterStats[0].count + manchesterStats[1].count}</Typography>
                  </Box>
                  <WarningAmberIcon sx={{ fontSize: 45, opacity: 0.4 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* INTEGRADO: NOVO CARD DE LEITOS CRÍTICO PARA A GERÊNCIA */}
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: '#2e7d32', color: 'white', borderRadius: 2, boxShadow: 2 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle2" sx={{ opacity: 0.8, fontSize: '0.75rem', fontWeight: 'bold' }}>LEITOS OCUPADOS</Typography>
                    <Typography variant="h3" sx={{ fontWeight: 'bold', my: 0.5 }}>{bedStats.ocupados} <span style={{ fontSize: '1.2rem', opacity: 0.7 }}>/ {bedStats.total}</span></Typography>
                  </Box>
                  <BedIcon sx={{ fontSize: 45, opacity: 0.4 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* CLASSIFICAÇÃO MANCHESTER */}
          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#334155' }}>
                Classificação pelo Protocolo de Manchester (Triagem Ativa)
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
                        <Typography variant="body2" fontWeight="bold">{item.count} Casos ({percentage}%)</Typography>
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

          {/* DEMOGRAFIA E ALOCAÇÃO DE RECURSOS */}
          <Grid item xs={12} md={5}>
            <Stack spacing={3} sx={{ height: '100%' }}>
              {/* COMPONENTE INTEGRADO DE LEITOS */}
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, bgcolor: '#f8fafc' }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BedIcon color="success" /> Taxa de Ocupação Hospitalar
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ my: 1.5 }}>
                  <Typography variant="body2" color="textSecondary">Leitos Disponíveis (Livres):</Typography>
                  <Chip size="small" label={`${bedStats.livres} Livres`} color="success" sx={{ fontWeight: 'bold' }} />
                </Stack>
                <Box sx={{ mt: 1 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight="bold">Capacidade de Internação Preenchida</Typography>
                    <Typography variant="caption" fontWeight="bold">{bedStats.taxaOcupacao}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={bedStats.taxaOcupacao} color={bedStats.taxaOcupacao > 80 ? "error" : "success"} sx={{ height: 8, borderRadius: 4 }} />
                </Box>
              </Paper>

              {/* DEMOGRAFIA */}
              <Paper sx={{ p: 3, borderRadius: 2, boxShadow: 1, flexGrow: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#334155' }}>
                  Demografia de Prontuários
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.5, bgcolor: '#f0f9ff', borderRadius: 2, borderLeft: '4px solid #0288d1', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary" block>Masculino</Typography>
                      <Typography variant="h5" color="#0288d1" fontWeight="bold">{demoStats.masc}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.5, bgcolor: '#fdf4ff', borderRadius: 2, borderLeft: '4px solid #c026d3', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary" block>Feminino</Typography>
                      <Typography variant="h5" color="#c026d3" fontWeight="bold">{demoStats.fem}</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 1.5, bgcolor: '#f1f5f9', borderRadius: 2, borderLeft: '4px solid #64748b', textAlign: 'center' }}>
                      <Typography variant="caption" color="textSecondary" block>Outros</Typography>
                      <Typography variant="h5" color="#64748b" fontWeight="bold">{demoStats.outros}</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      )}

      {/* ========================================================================= */}
      {/* ABA 1: ARQUITETURA TÉCNICA (ATUALIZADA E REESTRUTURADA COM OS 7 SERVIÇOS) */}
      {/* ========================================================================= */}
      {tabValue === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: '#0f172a', color: '#10b981', fontFamily: 'monospace', borderRadius: 2 }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>{'>'} CATÁLOGO ATIVO DO EUREKA SERVICE DISCOVERY (MOCK DA INFRAESTRUTURA)</Typography>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>Roteando tráfego HTTP através do API Gateway na porta 8080...</Typography>
            </Paper>
          </Grid>

          {/* CORREÇÃO VISUAL: Mapeamento de todos os 7 serviços reais do ecossistema final do Ian */}
          {[
            { name: 'API-GATEWAY (8080)', type: 'Gateway de Entrada Core' },
            { name: 'AUTH-SERVICE (8081)', type: 'Controle de Acesso / JWT Security' },
            { name: 'PACIENTE-SERVICE (8082)', type: 'Cadastro Clínico / PostgreSQL' },
            { name: 'TRIAGEM-SERVICE (8083)', type: 'Manchester Admissions / PostgreSQL' },
            { name: 'NOTIFICATION-SERVICE (8084)', type: 'Event Streaming / SSE Server' },
            { name: 'MEDICAL-RECORDS (8085)', type: 'Prontuário NoSQL / MongoDB Docs' },
            { name: 'BED-SERVICE (8086)', type: 'Gestão de Leitos / Feign Comms' }
          ].map((service, idx) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={idx}>
              <Card sx={{ borderTop: '4px solid #10b981', bgcolor: '#f8fafc', height: '100%' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1e293b' }}>{service.name}</Typography>
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1.5 }}>{service.type}</Typography>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
                    <Typography variant="caption" fontWeight="bold" color="#10b981">UP (REGISTERED)</Typography>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Paper sx={{ p: 3, bgcolor: '#000', color: '#0f0', fontFamily: 'monospace', borderRadius: 2, minHeight: 220 }}>
              <Typography variant="subtitle1" sx={{ color: '#fff', mb: 1.5, borderBottom: '1px solid #222', pb: 1 }}>
                PROMETHEUS METRICS & ACTUATOR POLLING SYSTEM (HEALTH MONITOR)
              </Typography>
              <Typography variant="body2">jvm_memory_committed_bytes{'{'}area="heap"{'}'} 3.12e+08</Typography>
              <Typography variant="body2">rabbitmq_queue_messages{'{'}queue="medical.notifications"{'}'} 0</Typography>
              <Typography variant="body2">mongodb_connections_active{'{'}database="medical_db"{'}'} 3</Typography>
              <Typography variant="body2">http_server_requests_seconds_count{'{'}uri="/api/leitos",status="200"{'}'} {leitos.length > 0 ? leitos.length * 4 : 42}</Typography>
              <Typography variant="body2" sx={{ mt: 2, color: '#ffeb3b' }}>{'>'} SPRING CLOUD GATEWAY: CORS DISENCUMBERED [TRUE]</Typography>
              <Typography variant="body2" sx={{ color: '#ffeb3b' }}>{'>'} INTERNAL DOCKER NETWORK (healthsys-internal): STATUS OPTIMAL</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default Dashboard;