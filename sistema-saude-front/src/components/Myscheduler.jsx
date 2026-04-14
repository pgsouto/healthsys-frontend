import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Avatar, Chip, 
  IconButton, Stack, alpha, Button
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import api from '../services/api';

const staff = [
  { id: 1, name: 'Dr. Silva', role: 'Cardiologista', color: '#1976d2', avatar: 'S' },
  { id: 2, name: 'Dra. Ana', role: 'Pediatra', color: '#9c27b0', avatar: 'A' },
  { id: 3, name: 'Enf. Marcos', role: 'Triagem', color: '#2e7d32', avatar: 'M' },
];

const HospitalScheduler = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState([]);
  const hours = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  // Formata a data para o padrão do banco (YYYY-MM-DD)
  const formattedDate = selectedDate.toISOString().split('T')[0];

  useEffect(() => {
    fetchAppointments();
  }, [formattedDate]);

  const fetchAppointments = async () => {
    try {
      // Busca apenas agendamentos da data selecionada
      const response = await api.get(`/appointments?date=${formattedDate}`);
      setAppointments(response.data);
    } catch (error) {
      console.error("Erro ao carregar agenda:", error);
    }
  };

  const changeDay = (amount) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + amount);
    setSelectedDate(newDate);
  };

  return (
    <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden' }}>
      {/* Header com Controles de Navegação */}
      <Box sx={{ p: 2, bgcolor: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="700">Agenda de Atendimentos</Typography>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconButton onClick={() => changeDay(-1)}><ChevronLeftIcon /></IconButton>
            
            <Button 
              startIcon={<CalendarMonthIcon />}
              sx={{ fontWeight: 'bold', textTransform: 'none' }}
            >
              {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Button>

            <IconButton onClick={() => changeDay(1)}><ChevronRightIcon /></IconButton>
            <Button size="small" onClick={() => setSelectedDate(new Date())}>Hoje</Button>
          </Stack>
        </Stack>
      </Box>

      {/* Grade da Agenda (Mantemos sua lógica de colunas por médico) */}
      <Box sx={{ display: 'grid', gridTemplateColumns: `80px repeat(${staff.length}, 1fr)`, minWidth: 700 }}>
        {/* Espaço Vazio e Cabeçalho de Médicos */}
        <Box sx={{ borderBottom: '2px solid #eee' }} />
        {staff.map((pro) => (
          <Box key={pro.id} sx={{ p: 2, textAlign: 'center', borderBottom: '2px solid', borderColor: pro.color, bgcolor: alpha(pro.color, 0.05) }}>
            <Avatar sx={{ bgcolor: pro.color, margin: '0 auto', mb: 1, width: 32, height: 32 }}>{pro.avatar}</Avatar>
            <Typography variant="subtitle2" fontWeight="700">{pro.name}</Typography>
          </Box>
        ))}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <Box sx={{ p: 2, borderRight: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" fontWeight="bold">{hour}</Typography>
            </Box>

            {staff.map((pro) => {
              const app = appointments.find(a => a.staffId === pro.id && a.time === hour);
              return (
                <Box key={`${hour}-${pro.id}`} sx={{ p: 1, borderBottom: '1px solid #f0f0f0', borderRight: '1px solid #f0f0f0', minHeight: 85 }}>
                  {app && (
                    <Paper elevation={0} sx={{ 
                        p: 1, height: '100%', border: '1px solid', borderColor: alpha(pro.color, 0.3), borderRadius: 2,
                        bgcolor: app.status === 'Em Atendimento' ? alpha(pro.color, 0.1) : 'white'
                    }}>
                      <Typography variant="caption" display="block" fontWeight="bold">{app.patient}</Typography>
                      <Chip label={app.status} size="small" sx={{ height: 16, fontSize: '0.6rem', mt: 0.5, bgcolor: pro.color, color: 'white' }} />
                    </Paper>
                  )}
                </Box>
              );
            })}
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
};

export default HospitalScheduler;