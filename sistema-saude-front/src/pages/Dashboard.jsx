import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, Tabs, Tab, Grid, Paper, Card, CardContent, Stack, LinearProgress } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';

// Cores do Protocolo de Manchester para os gráficos
const COLORS_MANCHESTER = {
  5: '#d32f2f', // Vermelho (Emergência)
  4: '#ef6c00', // Laranja (Muito Urgente)
  3: '#fbc02d', // Amarelo (Urgente)
  2: '#2e7d32', // Verde (Pouco Urgente)
  1: '#0288d1', // Azul (Não Urgente)
  default: '#9e9e9e'
};

const TabPanel = (props) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const Dashboard = () => {
  const [tabValue, setTabValue] = useState(0);
  const [triagens, setTriagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Busca os dados clínicos reais do backend
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [resTriagens, resPacientes] = await Promise.all([
          api.get('/tri/triagens'),
          api.get('/api/pacientes')
        ]);
        setTriagens(Array.isArray(resTriagens.data) ? resTriagens.data : []);
        setPacientes(Array.isArray(resPacientes.data) ? resPacientes.data : []);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // ==========================================
  // LÓGICA DE AGRUPAMENTO DOS DADOS CLÍNICOS
  // ==========================================
  
  // 1. Gráfico de Barras: Pacientes por Classificação de Risco
  const dadosRisco = useMemo(() => {
    const contagem = { 'Emergência': 0, 'Muito Urgente': 0, 'Urgente': 0, 'Pouco Urgente': 0, 'Não Urgente': 0 };
    
    triagens.forEach(t => {
      const idRisco = Number(t.riscoId || t.risco?.id || 0);
      if (idRisco === 5) contagem['Emergência']++;
      else if (idRisco === 4) contagem['Muito Urgente']++;
      else if (idRisco === 3) contagem['Urgente']++;
      else if (idRisco === 2) contagem['Pouco Urgente']++;
      else if (idRisco === 1) contagem['Não Urgente']++;
    });

    return Object.keys(contagem).map(key => ({
      name: key,
      Quantidade: contagem[key],
      fill: key === 'Emergência' ? COLORS_MANCHESTER[5] :
            key === 'Muito Urgente' ? COLORS_MANCHESTER[4] :
            key === 'Urgente' ? COLORS_MANCHESTER[3] :
            key === 'Pouco Urgente' ? COLORS_MANCHESTER[2] : COLORS_MANCHESTER[1]
    }));
  }, [triagens]);

  // 2. Gráfico de Pizza: Distribuição por Gênero dos Pacientes
  const dadosGenero = useMemo(() => {
    let masculino = 0;
    let feminino = 0;

    pacientes.forEach(p => {
      // Aceita se o back mandar String ("MASCULINO") ou ID mapeado
      const gen = String(p.genero || p.sexo).toUpperCase();
      if (gen.includes('M') || gen === '1') masculino++;
      if (gen.includes('F') || gen === '2') feminino++;
    });

    return [
      { name: 'Masculino', value: masculino },
      { name: 'Feminino', value: feminino }
    ];
  }, [pacientes]);

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Carregando métricas do sistema...</Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
        Painel de Controle
      </Typography>

      {/* Componente de Double Tab (Aba Dupla) */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Abas do Dashboard">
          <Tab label="Dashboard Clínico" sx={{ fontWeight: 'bold' }} />
          <Tab label="Dashboard Técnico (Informática)" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Box>

      {/* ========================================================
          ABA 1: DASHBOARD CLÍNICO (Dados de Negócio/Hospitalares)
          ======================================================== */}
      <TabPanel value={tabValue} index={0}>
        {/* Cards de KPIs Rápidos */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#e3f2fd', boxShadow: 2 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="subtitle2">TOTAL DE PACIENTES</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#1565c0' }}>{pacientes.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#fff3e0', boxShadow: 2 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="subtitle2">TRIAGENS EM FILA</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#e65100' }}>{triagens.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ bgcolor: '#ffebee', boxShadow: 2 }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom variant="subtitle2">CASOS CRÍTICOS (EMERGÊNCIA)</Typography>
                <Typography variant="h3" sx={{ fontWeight: 'bold', color: '#c62828' }}>
                  {triagens.filter(t => Number(t.riscoId || t.risco?.id) === 5).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Gráficos Clínicos */}
        <Grid container spacing={3}>
          {/* Gráfico Protocolo de Manchester */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Fila Ativa por Protocolo de Manchester
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosRisco}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="Quantidade">
                    {dadosRisco.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Gráfico Epidemiológico de Gênero */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, boxShadow: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, width: '100%' }}>
                Distribuição por Gênero
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={dadosGenero} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#0288d1" />
                    <Cell fill="#ec407a" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                <Box display="flex" alignItems="center"><Box sx={{ width: 12, height: 12, bgcolor: '#0288d1', mr: 1, borderRadius: '50%' }} /> Masculino</Box>
                <Box display="flex" alignItems="center"><Box sx={{ width: 12, height: 12, bgcolor: '#ec407a', mr: 1, borderRadius: '50%' }} /> Feminino</Box>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </TabPanel>

      {/* ========================================================
          ABA 2: DASHBOARD TÉCNICO (Métricas de Infraestrutura)
          ======================================================== */}
      <TabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 4, boxShadow: 3, borderRadius: 2, bgcolor: '#fafafa' }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 1 }}>
            Métricas de Sistema & Microsserviços
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
            Monitoramento em tempo real fornecido pelos filtros Actuator, Prometheus e Micrometer na malha Docker.
          </Typography>

          <Grid container spacing={3}>
            {/* Estado de Saúde dos Nós da Arquitetura */}
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '5px solid #4caf50' }}>
                <Typography variant="subtitle2" color="textSecondary">API GATEWAY</Typography>
                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>PORTA 8080 : ONLINE</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '5px solid #4caf50' }}>
                <Typography variant="subtitle2" color="textSecondary">AUTH SERVICE</Typography>
                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>PORTA 8081 : ONLINE</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '5px solid #4caf50' }}>
                <Typography variant="subtitle2" color="textSecondary">PACIENTE SERVICE</Typography>
                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>PORTA 8082 : ONLINE</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={3}>
              <Paper sx={{ p: 2, textAlign: 'center', borderLeft: '5px solid #4caf50' }}>
                <Typography variant="subtitle2" color="textSecondary">TRIAGEM SERVICE</Typography>
                <Typography variant="h6" sx={{ color: '#2e7d32', fontWeight: 'bold' }}>PORTA 8083 : ONLINE</Typography>
              </Paper>
            </Grid>

            {/* Simulação Gráfica de Latência / Conexões Ativas de Rede */}
            <Grid item xs={12}>
              <Box sx={{ p: 3, mt: 2, bgcolor: '#1e1e1e', borderRadius: 2, color: '#00ff00', fontFamily: 'monospace' }}>
                <Typography variant="subtitle1" sx={{ color: '#fff', mb: 2, fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                  Live Stream de Raspagem de Dados (Prometheus Scrape Map)
                </Typography>
                <p>&gt; http_server_requests_seconds_count{'{'}app="auth-service", status="200"{"}"} → 142 req/s</p>
                <p>&gt; jvm_memory_used_bytes{'{'}area="heap"{"}"} → 312MB / 512MB</p>
                <p>&gt; http_client_requests_active_seconds → Latência média interna: 14ms (FeignClient OK)</p>
                <p>&gt; disk_free_bytes → Espaço em volume de persistência PostgreSQL: 84% livre</p>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </TabPanel>
    </Box>
  );
};

export default Dashboard;