import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, InputAdornment, MenuItem,
  TableCell, IconButton, Tooltip, Autocomplete, Chip, Divider, Grid, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import BugReportIcon from '@mui/icons-material/BugReport';
import CoronavirusIcon from '@mui/icons-material/Coronavirus';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const headCells = [
  { id: 'nome', label: 'Nome do Paciente' },
  { id: 'cpf', label: 'CPF' },
  { id: 'dataNascimento', label: 'Data Nasc.' },
  { id: 'clinico', label: 'Condições Clínicas' },
  { id: 'actions', label: 'Ações', numeric: true },
];

const formatDateBR = (isoDate) => {
  if (!isoDate) return '-';
  const datePart = String(isoDate).slice(0, 10);
  const [y, m, d] = datePart.split('-');
  return (y && m && d) ? `${d}/${m}/${y}` : '-';
};

const normalizeDateInput = (value) => value ? String(value).slice(0, 10) : '';

const formatCPF = (cpf) => {
  if (!cpf) return '';
  const cleaned = String(cpf).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,3})(\d{0,2})$/);
  if (!match) return cleaned;
  return !match[2] ? match[1] 
       : !match[3] ? `${match[1]}.${match[2]}` 
       : !match[4] ? `${match[1]}.${match[2]}.${match[3]}` 
       : `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
};

const formatPhone = (phone) => {
  if (!phone) return '';
  const cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.length < 3) return cleaned;
  if (cleaned.length < 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  if (cleaned.length < 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`;
};

const Patients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Catálogos Mestres carregados do Back
  const [sexos, setSexos] = useState([]);
  const [generos, setGeneros] = useState([]);
  const [allAlergias, setAllAlergias] = useState([]);
  const [allComorbidades, setAllComorbidades] = useState([]);
  const [allVacinas, setAllVacinas] = useState([]);

  // Estados de seleção lógicos vinculados ao Paciente aberto
  const [selectedAlergias, setSelectedAlergias] = useState([]);
  const [selectedComorbidades, setSelectedComorbidades] = useState([]);
  const [pacienteVacinas, setPacienteVacinas] = useState([]);

  // Form de inclusão de vacina aplicada
  const [inputVacina, setInputVacina] = useState(null);
  const [inputDataVacina, setInputDataVacina] = useState('');

  // Estados para máscaras lógicas
  const [cpfValue, setCpfValue] = useState('');
  const [tel1Value, setTel1Value] = useState('');
  const [tel2Value, setTel2Value] = useState('');

  // GET: Lista todos os pacientes
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const unmaskedSearchTerm = searchTerm.replace(/\D/g, '');
        const url = unmaskedSearchTerm
          ? `/api/pacientes?cpf=${encodeURIComponent(unmaskedSearchTerm)}`
          : '/api/pacientes';
        const response = await api.get(url);
        setPatients(response.data);
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      }
    };
    fetchPatients();
  }, [refreshKey, searchTerm]);

  // GET: Carrega todos os metadados cadastrais mestres (Seeders)
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [resSexo, resGenero, resComorbidades, resAlergias, resVacinas] = await Promise.all([
          api.get('/api/sexos'),
          api.get('/api/generos'),
          api.get('/api/comorbidades'),
          api.get('/api/alergias'),
          api.get('/api/vacinas')
        ]);
        setSexos(resSexo.data);
        setGeneros(resGenero.data);
        setAllComorbidades(resComorbidades.data);
        setAllAlergias(resAlergias.data);
        setAllVacinas(resVacinas.data);
      } catch (err) {
        console.error('Erro ao carregar catálogos médicos:', err);
      }
    };
    fetchMetadata();
  }, []);

  const handleOpen = async (patient = null) => {
    setSelectedPatient(patient);
    setCpfValue(formatCPF(patient?.cpf || ''));
    setTel1Value(formatPhone(patient?.telefones?.[0] || ''));
    setTel2Value(formatPhone(patient?.telefones?.[1] || ''));
    setInputVacina(null);
    setInputDataVacina('');

    if (patient?.id) {
      // FIX CRÍTICO: Re-mapeamento reverso das strings de resposta do back para objetos lógicos válidos com ID
      const mappedAlergias = (patient.alergias || []).map(nomeAlergia => {
        const found = allAlergias.find(a => (a.descricao === nomeAlergia || a.nome === nomeAlergia));
        return found ? found : { id: null, descricao: nomeAlergia };
      });
      setSelectedAlergias(mappedAlergias);

      const mappedComorbidades = (patient.comorbidades || []).map(nomeComorb => {
        const found = allComorbidades.find(c => (c.descricao === nomeComorb || c.nome === nomeComorb));
        return found ? found : { id: null, descricao: nomeComorb };
      });
      setSelectedComorbidades(mappedComorbidades);
      
      // Busca histórico de vacinas aplicadas a este paciente específico
      try {
        const resVacinasPaciente = await api.get(`/api/paciente-vacinas/paciente/${patient.id}`);
        setPacienteVacinas(resVacinasPaciente.data);
      } catch (e) {
        setPacienteVacinas([]);
      }
    } else {
      setSelectedAlergias([]);
      setSelectedComorbidades([]);
      setPacienteVacinas([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedPatient(null);
    setSelectedAlergias([]);
    setSelectedComorbidades([]);
    setPacienteVacinas([]);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Deseja realmente excluir este paciente?')) {
      try {
        await api.delete(`/api/pacientes/${id}`);
        setRefreshKey((prev) => prev + 1);
      } catch (error) {
        alert('Erro ao deletar: Verifique se o paciente possui triagens vinculadas.');
      }
    }
  };

  const handleAddVacinaDirect = async () => {
    if (!inputVacina || !inputDataVacina) {
      alert("Selecione o imunizante e informe a data da aplicação.");
      return;
    }
    if (!selectedPatient?.id) {
      alert("Por favor, conclua o cadastro inicial do paciente antes de lançar vacinas aplicadas.");
      return;
    }

    const payloadVacina = {
      pacienteId: selectedPatient.id,
      vacinaId: inputVacina.id,
      dataAplicacao: inputDataVacina
    };

    try {
      await api.post('/api/paciente-vacinas', payloadVacina);
      const resVacinasPaciente = await api.get(`/api/paciente-vacinas/paciente/${selectedPatient.id}`);
      setPacienteVacinas(resVacinasPaciente.data);
      setInputVacina(null);
      setInputDataVacina('');
    } catch (err) {
      alert("Erro ao associar vacina.");
    }
  };

  const handleDeleteVacina = async (id) => {
    if (window.confirm("Remover o registro desta aplicação?")) {
      try {
        await api.delete(`/api/paciente-vacinas/${id}`);
        setPacienteVacinas(prev => prev.filter(v => v.id !== id));
      } catch (err) {
        alert("Erro ao remover registro vacinal.");
      }
    }
  };

  const handleVerProntuario = (patient) => {
    if (!patient || !patient.id) return;
    sessionStorage.setItem('selectedPacienteId', patient.id);
    navigate(`/patients/${patient.id}`);
  };

  const selectedSexoId = useMemo(() => {
    if (!selectedPatient?.sexo) return '';
    return sexos.find(s => (s.descricao || s.nome) === selectedPatient.sexo)?.id || '';
  }, [selectedPatient, sexos]);

  const selectedGeneroId = useMemo(() => {
    if (!selectedPatient?.genero) return '';
    return generos.find(g => (g.descricao || g.nome) === selectedPatient.genero)?.id || '';
  }, [selectedPatient, generos]);

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // PAYLOAD INTEGRADO E HIGIENIZADO SEGUNDO PACIENTEREQUESTDTO.JAVA
    const payload = {
      nome: data.nome,
      nomeSocial: data.nomeSocial || null,
      cpf: data.cpf.replace(/\D/g, ''), 
      dataNascimento: data.dataNascimento,
      sexo: Number(data.sexoId),
      genero: Number(data.generoId),
      telefones: [tel1Value.replace(/\D/g, ''), tel2Value.replace(/\D/g, '')].filter(Boolean),
      alergias: selectedAlergias.map(a => ({ 
        id: a.id ? Number(a.id) : null, 
        descricao: a.descricao || a.nome || "" 
      })),
      comorbidades: selectedComorbidades.map(c => ({ 
        id: c.id ? Number(c.id) : null, 
        descricao: c.descricao || c.nome || "" 
      })),
      enderecos: []
    };

    try {
      if (selectedPatient?.id) {
        await api.put(`/api/pacientes/${selectedPatient.id}`, payload);
      } else {
        await api.post('/api/pacientes', payload);
      }
      setRefreshKey((prev) => prev + 1);
      handleClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao processar e salvar paciente.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Pacientes</Typography>
        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>
          <TextField
            size="small"
            placeholder="Consultar por CPF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(formatCPF(e.target.value))}
            inputProps={{ maxLength: 14 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
            }}
          />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
            Novo Paciente
          </Button>
        </Stack>
      </Stack>

      <GenericTable
        title="Listagem de Pacientes"
        headCells={headCells}
        rows={patients}
        renderRow={(row) => (
          <>
            <TableCell sx={{ fontWeight: 'bold' }}>{row.nome}</TableCell>
            <TableCell>{formatCPF(row.cpf)}</TableCell>
            <TableCell>{formatDateBR(row.dataNascimento)}</TableCell>
            <TableCell>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {row.alergias?.length > 0 && <Chip size="small" label={`${row.alergias.length} Alergias`} color="error" variant="outlined" icon={<BugReportIcon />} />}
                {row.comorbidades?.length > 0 && <Chip size="small" label={`${row.comorbidades.length} Comorbidades`} color="secondary" variant="outlined" icon={<CoronavirusIcon />} />}
              </Stack>
            </TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Tooltip title="Ver Prontuário Completo">
                  <IconButton color="success" onClick={() => handleVerProntuario(row)}>
                    <AssignmentIcon />
                  </IconButton>
                </Tooltip>
                <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
              </Stack>
            </TableCell>
          </>
        )}
      />

      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedPatient ? 'Editar Ficha do' : 'Novo'} Paciente
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ mt: 0.5 }}>
            
            {/* ESÇÃO 1: DADOS CORE */}
            <Grid item xs={12} md={6}>
              <Stack spacing={2.5}>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">Dados Identificativos</Typography>
                <TextField name="nome" label="Nome Completo" fullWidth defaultValue={selectedPatient?.nome || ''} required />
                <TextField name="nomeSocial" label="Nome Social" fullWidth defaultValue={selectedPatient?.nomeSocial || ''} />
                
                <Stack direction="row" spacing={2}>
                  <TextField 
                    name="cpf" 
                    label="CPF" 
                    fullWidth 
                    value={cpfValue}
                    onChange={(e) => setCpfValue(formatCPF(e.target.value))}
                    inputProps={{ maxLength: 14 }}
                    required 
                  />
                  <TextField 
                    name="dataNascimento" 
                    label="Data Nasc." 
                    type="date" 
                    fullWidth 
                    InputLabelProps={{ shrink: true }} 
                    defaultValue={normalizeDateInput(selectedPatient?.dataNascimento)} 
                    required 
                  />
                </Stack>

                <Stack direction="row" spacing={2}>
                  <TextField select name="sexoId" label="Sexo" fullWidth defaultValue={selectedSexoId} required>
                    {sexos.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt.id}</MenuItem>)}
                  </TextField>
                  <TextField select name="generoId" label="Gênero" fullWidth defaultValue={selectedGeneroId} required>
                    {generos.map((opt) => <MenuItem key={opt.id} value={opt.id}>{opt.id}</MenuItem>)}
                  </TextField>
                </Stack>

                <Typography variant="subtitle2" color="primary" fontWeight="bold">Contatos</Typography>
                <Stack direction="row" spacing={2}>
                  <TextField 
                    name="tel1" 
                    label="Telefone Principal" 
                    fullWidth 
                    value={tel1Value}
                    onChange={(e) => setTel1Value(formatPhone(e.target.value))}
                    inputProps={{ maxLength: 15 }}
                    required 
                  />
                  <TextField 
                    name="tel2" 
                    label="Telefone Opcional" 
                    fullWidth 
                    value={tel2Value}
                    onChange={(e) => setTel2Value(formatPhone(e.target.value))}
                    inputProps={{ maxLength: 15 }}
                  />
                </Stack>
              </Stack>
            </Grid>

            {/* SEÇÃO 2: CRUDS MULTIPLOS DE N CAPACIDADE */}
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Typography variant="subtitle2" color="secondary" fontWeight="bold">Mapeamento Clínico (N Condições)</Typography>
                
                {/* AUTOCOMPLETE ALERGIAS */}
                <Autocomplete
                  multiple
                  options={allAlergias}
                  getOptionLabel={(option) => option.descricao || option.nome || ''}
                  value={selectedAlergias}
                  isOptionEqualToValue={(obj, val) => obj.id === val.id || obj.descricao === val.descricao}
                  onChange={(e, newVal) => setSelectedAlergias(newVal)}
                  renderInput={(params) => <TextField {...params} label="Alergias Clínicas Cadastradas" placeholder="Vincular Alergia..." />}
                  renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => (
                    <Chip size="small" label={option.descricao || option.nome} color="error" {...getTagProps({ index })} />
                  ))}
                />

                {/* AUTOCOMPLETE COMORBIDADES */}
                <Autocomplete
                  multiple
                  options={allComorbidades}
                  getOptionLabel={(option) => option.descricao || option.nome || ''}
                  value={selectedComorbidades}
                  isOptionEqualToValue={(obj, val) => obj.id === val.id || obj.descricao === val.descricao}
                  onChange={(e, newVal) => setSelectedComorbidades(newVal)}
                  renderInput={(params) => <TextField {...params} label="Comorbidades / DCNT" placeholder="Vincular Comorbidade..." />}
                  renderTags={(tagValue, getTagProps) => tagValue.map((option, index) => (
                    <Chip size="small" label={option.descricao || option.nome} color="secondary" {...getTagProps({ index })} />
                  ))}
                />

                {/* CARTEIRA DE VACINAÇÃO INTEGRADA */}
                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc' }}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, fontWeight: 'bold' }}>
                    <VaccinesIcon fontSize="small" color="primary" /> Histórico de Imunizações (Vacinas)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />

                  {selectedPatient?.id ? (
                    <Stack spacing={2}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Autocomplete
                          options={allVacinas}
                          getOptionLabel={(opt) => opt.nome || opt.descricao || ''}
                          value={inputVacina}
                          onChange={(e, v) => setInputVacina(v)}
                          size="small"
                          fullWidth
                          renderInput={(params) => <TextField {...params} label="Selecionar Vacina" />}
                        />
                        <TextField
                          type="date"
                          size="small"
                          label="Aplicação"
                          InputLabelProps={{ shrink: true }}
                          value={inputDataVacina}
                          onChange={(e) => setInputDataVacina(e.target.value)}
                        />
                        <Button variant="contained" color="success" size="small" onClick={handleAddVacinaDirect} sx={{ minWidth: 40, height: 40 }}>
                          +
                        </Button>
                      </Stack>

                      <Box sx={{ maxHeight: 120, overflowY: 'auto', mt: 1 }}>
                        {pacienteVacinas.length === 0 ? (
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block', textAlign: 'center', py: 1 }}>
                            Nenhuma vacina aplicada registrada.
                          </Typography>
                        ) : (
                          pacienteVacinas.map((pv) => (
                            <Stack key={pv.id} direction="row" justifyContent="space-between" alignItems="center" sx={{ bgcolor: 'white', p: 1, mb: 0.5, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                              <Typography variant="caption" fontWeight="bold">{pv.vacinaNome || pv.vacina?.nome || "Imunizante"}</Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Chip size="small" label={formatDateBR(pv.dataAplicacao)} variant="outlined" />
                                <IconButton size="small" color="error" onClick={() => handleDeleteVacina(pv.id)}><DeleteIcon fontSize="inherit" /></IconButton>
                              </Stack>
                            </Stack>
                          ))
                        )}
                      </Box>
                    </Stack>
                  ) : (
                    <Typography variant="caption" color="textSecondary">
                      * O histórico vacinal pode ser gerenciado imediatamente após concluir o primeiro registro básico do paciente.
                    </Typography>
                  )}
                </Paper>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">Salvar Alterações</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Patients;