import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, MenuItem, TableCell, IconButton, Chip, Autocomplete, Grid, Divider, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'data', label: 'Entrada' }, // NOVA COLUNA
  { id: 'paciente', label: 'Paciente' },
  { id: 'risco', label: 'Classificação' },
  { id: 'status', label: 'Status Atual' },
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

const formatTimeBR = (isoDate) => {
  if (!isoDate) return '-';
  const date = new Date(isoDate);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
};

const Screening = () => {
  const [triagens, setTriagens] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [sintomas, setSintomas] = useState([]);
  const [statusOptions, setStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [open, setOpen] = useState(false);
  const [selectedTriagem, setSelectedTriagem] = useState(null);
  const [patientValue, setPatientValue] = useState(null);
  const [selectedSintomas, setSelectedSintomas] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // GET: Busca registros de triagens ativos na fila
  useEffect(() => {
    setLoading(true);
    api.get('/tri/triagens')
      .then(res => {
        // Ordena automaticamente colocando os riscos mais altos (Emergências) no topo da fila
        const dados = Array.isArray(res.data) ? res.data : [];
        const ordenadas = dados.sort((a, b) => Number(b.risco || 0) - Number(a.risco || 0));
        setTriagens(ordenadas);
      })
      .catch(err => console.error('Erro ao buscar triagens:', err))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  // GET: Carrega opções estruturais do banco de dados (Sintomas, Status e Pacientes)
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
        console.error('Erro ao carregar opções para triagem:', err);
      }
    };
    fetchOptions();
  }, []);

  // Algoritmo de decisão clínica: Filtra e localiza a queixa de maior gravidade/risco
  const calcularRiscoFinal = (sintomasEscolhidos) => {
    if (!sintomasEscolhidos || sintomasEscolhidos.length === 0) return null;
    
    return sintomasEscolhidos.reduce((prev, curr) => {
      const prevId = prev && typeof prev.risco === 'object' ? Number(prev.risco.id) : Number(prev?.risco || prev?.riscoId || 0);
      const currId = curr && typeof curr.risco === 'object' ? Number(curr.risco.id) : Number(curr?.risco || curr?.riscoId || 0);
      return (prevId > currId) ? prev : curr;
    });
  };

  const riscoSugerido = useMemo(() => calcularRiscoFinal(selectedSintomas), [selectedSintomas]);

  const handleOpen = (triagem = null) => {
    setSelectedTriagem(triagem);
    if (triagem) {
      const idPacienteAlvo = triagem.pacienteId || triagem.paciente;
      setPatientValue(pacientes.find(p => p.id === idPacienteAlvo) || null);
      setSelectedSintomas([]); // Reseta para seleção limpa
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
      alert("Selecione um paciente cadastrado para abrir a admissão.");
      return;
    }

    // RESOLUÇÃO: Se estiver editando e não escolheu novos sintomas, mantém o risco original já salvo no back
    let riscoFinalId = selectedTriagem ? selectedTriagem.risco : 1;

    if (selectedSintomas.length > 0) {
      const riscoSugeridoId = riscoSugerido && typeof riscoSugerido.risco === 'object' 
        ? riscoSugerido.risco.id 
        : (riscoSugerido?.risco || riscoSugerido?.riscoId);
      riscoFinalId = Number(riscoSugeridoId);
    } else if (!selectedTriagem) {
      alert("Selecione ao menos uma queixa/sintoma do protocolo para classificar o paciente.");
      return;
    }

    const formData = new FormData(event.currentTarget);

    // PAYLOAD EXATO CONFORME TRIAGEMREQUESTDTO.JAVA
    const payload = {
      paciente: patientValue.id,
      risco: riscoFinalId,
      status: Number(formData.get('statusId') || 1),
      dataCriacao: selectedTriagem?.dataCriacao || (() => {
        const agora = new Date();
        // Subtrai o fuso horário local para gerar uma string ISO baseada na hora real do PC
        const tzOffset = agora.getTimezoneOffset() * 60000;
        return new Date(agora.getTime() - tzOffset).toISOString().slice(0, -1);
      })(),
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
      alert(error.response?.data?.message || "Erro ao processar e salvar triagem clínica.");
    }
  };

  const riscoSugeridoId = riscoSugerido && typeof riscoSugerido.risco === 'object' ? riscoSugerido.risco.id : (riscoSugerido?.risco || riscoSugerido?.riscoId);
  const riscoSugeridoDesc = riscoSugerido && typeof riscoSugerido.risco === 'object' ? riscoSugerido.risco.descricao : (riscoSugerido?.riscoDescricao || 'Triagem');

  if (loading && triagens.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
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
        title="Fila de Espera Ativa - Protocolo de Manchester"
        headCells={headCells}
        rows={triagens.filter(t => {
          // Captura o ID ou texto do status atual da triagem
          const statusId = Number(t.statusId || t.status?.id || t.status || 1);
          
          // No banco do Ian, Status 1 = PENDENTE/EM ESPERA, Status 2 = EM ATENDIMENTO
          // Statuses maiores (como Finalizado ou Cancelado) são ocultados da fila ativa
          return statusId === 1 || statusId === 2;
        })}
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
              {/* RENDERIZAÇÃO DA DATA DE ENTRADA CRONOLÓGICA */}
              <TableCell sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  <AccessTimeIcon fontSize="inherit" />
                  <span>{formatTimeBR(row.dataCriacao)}</span>
                </Stack>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>{pacientes.find(p => p.id === idPac)?.nome || 'Buscando Paciente...'}</TableCell>
              <TableCell>
                <Chip 
                  label={getRiscoTexto().toUpperCase()} 
                  color={getRiscoColor(idRiscoReal)} 
                  sx={{ fontWeight: 'bold', width: 130 }}
                />
              </TableCell>
              <TableCell>
                <Chip 
                  label={(statusOptions.find(s => s.id === row.statusId || s.id === row.status)?.descricao || 'Pendente').toUpperCase()} 
                  variant="outlined" 
                  size="small"
                  sx={{ fontWeight: 'bold' }} 
                />
              </TableCell>
              <TableCell align="right">
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
              </TableCell>
            </>
          );
        }}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>{selectedTriagem ? 'Atualizar Evolução do Atendimento' : 'Iniciar Classificação de Risco'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            
            <Grid item xs={12}>
              <Autocomplete
                options={pacientes}
                getOptionLabel={(opt) => opt ? `${opt.nome || ''} (CPF: ${opt.cpf || ''})` : ''}
                value={patientValue}
                disabled={!!selectedTriagem} // Bloqueia troca de paciente se estiver apenas editando a triagem
                onChange={(_, val) => setPatientValue(val)}
                renderInput={(params) => <TextField {...params} label="Identificar Paciente Cadastrado" required />}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>Sinais Vitais (Mensuração Biomédica)</Divider>
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
              <TextField name="saturacaoOxigenio" label="Saturação SPO2 (%)" defaultValue={selectedTriagem?.saturacaoOxigenio || ""} fullWidth placeholder="Ex: 98" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField name="frequenciaRespiratoria" label="Freq. Respiratória (irpm)" defaultValue={selectedTriagem?.frequenciaRespiratoria || ""} fullWidth placeholder="Ex: 16" />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ mb: 1, fontWeight: 'bold', color: 'text.secondary' }}>Protocolo de Manchester</Divider>
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
                renderInput={(params) => <TextField {...params} label="Avaliação de Sintomas e Queixas" placeholder={selectedTriagem ? "Manter queixas originais ou redefinir..." : "Selecione..."} />}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 2, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', boxSizing: 'border-box' }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'text.secondary' }}>
                  {selectedSintomas.length > 0 ? 'GRAVIDADE SUGERIDA:' : 'GRAVIDADE ATUAL:'}
                </Typography>
                {selectedSintomas.length > 0 ? (
                  <Chip 
                    label={String(riscoSugeridoDesc).toUpperCase()} 
                    color={getRiscoColor(riscoSugeridoId)}
                    sx={{ fontSize: '1rem', p: 2, height: 'auto', fontWeight: 'bold' }}
                  />
                ) : selectedTriagem ? (
                  <Chip 
                    label={selectedTriagem.riscoDescricao?.toUpperCase() || (Number(selectedTriagem.risco) === 5 ? 'EMERGÊNCIA' : Number(selectedTriagem.risco) === 4 ? 'MUITO URGENTE' : Number(selectedTriagem.risco) === 3 ? 'URGENTE' : Number(selectedTriagem.risco) === 2 ? 'POUCO URGENTE' : 'NÃO URGENTE')} 
                    color={getRiscoColor(selectedTriagem.risco)}
                    sx={{ fontSize: '1rem', p: 2, height: 'auto', fontWeight: 'bold' }}
                  />
                ) : (
                  <Typography color="textSecondary" variant="body2">Aguardando queixas...</Typography>
                )}
              </Box>
            </Grid>

            <Grid item xs={12} md={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <TextField 
                select 
                name="statusId" 
                label="Status do Encaminhamento" 
                defaultValue={selectedTriagem?.statusId || selectedTriagem?.status || 1} 
                fullWidth 
                required
              >
                {statusOptions.map((opt) => (
                  <MenuItem key={opt.id} value={opt.id}>{opt.descricao.toUpperCase()}</MenuItem>
                ))}
              </TextField>
            </Grid>

          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">Salvar e Atualizar Fila</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Screening;