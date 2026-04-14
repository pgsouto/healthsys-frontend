import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Stack, 
  InputAdornment, MenuItem 
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HospitalScheduler from '../components/Myscheduler';
import api from '../services/api';

const Appointments = () => {
  const [open, setOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); 
  const [searchTerm, setSearchTerm] = useState('');
  const [staffList, setStaffList] = useState([]); // Para carregar os médicos/enfermeiros

  // Simulação de busca de profissionais para o Select do Modal
  useEffect(() => {
    // Aqui você buscaria seus profissionais da API
    // const response = await api.get('/staff');
    setStaffList([
      { id: 1, name: 'Dr. Silva', role: 'Cardiologista' },
      { id: 2, name: 'Dra. Ana', role: 'Pediatra' },
      { id: 3, name: 'Enf. Marcos', role: 'Triagem' },
      { id: 4, name: 'Dra. Carla', role: 'Ginecologista' },
      { id: 5, name: 'Dr. Pedro', role: 'Ortopedista' },
    ]);
  }, []);

  const handleOpen = (appointment = null) => {
    setSelectedAppointment(appointment);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedAppointment(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      if (selectedAppointment) {
        await api.put(`/appointments/${selectedAppointment.id}`, data);
      } else {
        await api.post('/appointments', data);
      }
      setRefreshKey(prev => prev + 1);
      handleClose();
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      {/* Cabeçalho Seguindo o Padrão da sua Página de Pacientes */}
      <Stack 
        direction={{ xs: 'column', md: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'flex-start', md: 'center' }} 
        spacing={2} 
        sx={{ mb: 3 }}
      >

        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Agendamentos
        </Typography>

        <Stack direction="row" spacing={2} sx={{ width: { xs: '100%', md: 'auto' } }}>

          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => handleOpen()}
            sx={{ whiteSpace: 'nowrap', borderRadius: 2 }}
          >
            Novo Agendamento
          </Button>
        </Stack>
      </Stack>

      {/* O Componente de Agenda Hospitalar */}
      {/* Passamos o searchTerm e o refreshKey para ele se atualizar */}
      <HospitalScheduler 
        key={refreshKey} 
        search={searchTerm} 
        onEditAppointment={handleOpen} 
      />

      {/* Modal de Agendamento */}
      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {selectedAppointment ? 'Editar' : 'Novo'} Agendamento
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1, minWidth: { md: 450 } }}>
            
            <TextField 
              select
              name="staffId" 
              label="Profissional" 
              fullWidth 
              defaultValue={selectedAppointment?.staffId || ''} 
              required
            >
              {staffList.map((pro) => (
                <MenuItem key={pro.id} value={pro.id}>
                  {pro.name} ({pro.role})
                </MenuItem>
              ))}
            </TextField>

            <TextField 
              name="patientName" 
              label="Nome do Paciente" 
              fullWidth 
              defaultValue={selectedAppointment?.patientName} 
              required 
            />

            <Stack direction="row" spacing={2}>
                <TextField 
                name="date" 
                label="Data" 
                type="date" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                defaultValue={selectedAppointment?.date || new Date().toISOString().split('T')[0]} 
                required
                />
                <TextField 
                name="time" 
                label="Horário" 
                type="time" 
                fullWidth 
                InputLabelProps={{ shrink: true }} 
                defaultValue={selectedAppointment?.time} 
                required
                />
            </Stack>

            <TextField 
              select
              name="status" 
              label="Status Inicial" 
              fullWidth 
              defaultValue={selectedAppointment?.status || 'Aguardando'} 
            >
                <MenuItem value="Aguardando">Aguardando</MenuItem>
                <MenuItem value="Confirmado">Confirmado</MenuItem>
                <MenuItem value="Em Atendimento">Em Atendimento</MenuItem>
            </TextField>

            <TextField 
              name="observations" 
              label="Observações/Sintomas" 
              multiline 
              rows={3}
              fullWidth 
              defaultValue={selectedAppointment?.observations} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained">Salvar Agendamento</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;