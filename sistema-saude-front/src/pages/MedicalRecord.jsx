import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, Typography, Paper, Stack, Button, Divider, 
  Card, CardContent, Chip, IconButton, CircularProgress 
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import api from '../services/api';

const MedicalRecord = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Busca o paciente específico e os registros vinculados ao ID dele
        const [patientRes, recordsRes] = await Promise.all([
          api.get(`/patients/${id}`),
          api.get(`/medical_records?patientId=${id}`)
        ]);
        
        setPatient(patientRes.data);
        // Ordena os registros pela data (mais recente primeiro)
        const sortedRecords = recordsRes.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setRecords(sortedRecords);
      } catch (error) {
        console.error("Erro ao carregar prontuário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 2 }}>
      {/* Botão Voltar */}
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        Voltar para a lista
      </Button>

      {/* Cabeçalho com dados do Paciente */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2, bgcolor: '#f8f9fa' }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <PersonIcon color="primary" sx={{ fontSize: 40 }} />
          <Box>
            <Typography variant="h5" fontWeight="bold">{patient?.name}</Typography>
            <Typography variant="body2" color="textSecondary">CPF: {patient?.cpf}</Typography>
          </Box>
        </Stack>
        <Divider sx={{ my: 1 }} />
        <Stack direction="row" spacing={3} sx={{ mt: 1 }}>
          <Typography variant="body2"><strong>Nasc:</strong> {patient?.dataNasc}</Typography>
          <Typography variant="body2"><strong>Telefone:</strong> {patient?.telefone}</Typography>
        </Stack>
      </Paper>

      {/* Seção de Evoluções (Prontuário) */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">Histórico de Evolução</Typography>
        <Button variant="outlined" startIcon={<AddIcon />} size="small">
          Nova Evolução
        </Button>
      </Stack>

      <Stack spacing={3}>
        {records.length > 0 ? (
          records.map((record) => (
            <Card key={record.id} variant="outlined" sx={{ borderRadius: 2, borderLeft: '5px solid #1976d2' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EventIcon fontSize="small" color="action" />
                    <Typography variant="subtitle2" color="primary">
                      {new Date(record.date).toLocaleDateString('pt-BR')}
                    </Typography>
                  </Stack>
                  <Chip label={record.doctor} size="small" variant="outlined" />
                </Stack>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                  {record.description}
                </Typography>
              </CardContent>
            </Card>
          ))
        ) : (
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 4 }}>
            Nenhum registro encontrado para este paciente.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default MedicalRecord;