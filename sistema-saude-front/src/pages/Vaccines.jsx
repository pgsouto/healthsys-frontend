import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Stack, TableCell, IconButton, Tooltip, 
  CircularProgress, Tabs, Tab, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import CoronavirusIcon from '@mui/icons-material/Coronavirus'; // Ícone para Comorbidades
import BugReportIcon from '@mui/icons-material/BugReport'; // Ícone para Alergias
import api from '../services/api';
import GenericTable from '../components/GenericTable';

const Vaccines = () => {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Mapeamento de abas para endpoints e nomes
  const tabsConfig = [
    { label: 'Vacinas', endpoint: '/api/vacinas', icon: <VaccinesIcon />, color: '#1976d2' },
    { label: 'Comorbidades', endpoint: '/api/comorbidades', icon: <CoronavirusIcon />, color: '#7b1fa2' },
    { label: 'Alergias', endpoint: '/api/alergias', icon: <BugReportIcon />, color: '#d32f2f' }
  ];

  const currentTab = tabsConfig[tabValue];

  // Busca dados dinamicamente com base na aba ativa
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get(currentTab.endpoint);
        setData(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error(`Erro ao buscar ${currentTab.label}:`, error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tabValue, refreshKey]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpen = (item = null) => {
    setSelectedItem(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedItem(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm(`Deseja realmente remover este registo de ${currentTab.label}?`)) {
      try {
        await api.delete(`${currentTab.endpoint}/${id}`);
        setRefreshKey(prev => prev + 1);
      } catch (error) {
        alert('Erro ao eliminar: Verifique se existem pacientes vinculados a este registo.');
      }
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // Payload base (comum a todos)
    let payload = {
      nome: formData.get('nome'),
      descricao: formData.get('descricao') || formData.get('nome'),
    };

    // Adiciona campos extras se for a aba de Vacinas
    if (tabValue === 0) {
      payload = {
        ...payload,
        fabricante: formData.get('fabricante'),
        lote: formData.get('lote'),
        dataValidade: formData.get('dataValidade') || null
      };
    }

    try {
      if (selectedItem?.id) {
        await api.put(`${currentTab.endpoint}/${selectedItem.id}`, payload);
      } else {
        await api.post(currentTab.endpoint, payload);
      }
      setRefreshKey(prev => prev + 1);
      handleClose();
    } catch (error) {
      alert(error.response?.data?.message || 'Erro ao processar requisição.');
    }
  };

  // Configuração das colunas da tabela dependendo da aba
  const getHeadCells = () => {
    if (tabValue === 0) { // Vacinas
      return [
        { id: 'nome', label: 'Vacina' },
        { id: 'fabricante', label: 'Fabricante' },
        { id: 'lote', label: 'Lote' },
        { id: 'actions', label: 'Ações', numeric: true },
      ];
    }
    return [ // Comorbidades e Alergias
      { id: 'nome', label: 'Nome / Descrição' },
      { id: 'detalhes', label: 'Informações Adicionais' },
      { id: 'actions', label: 'Ações', numeric: true },
    ];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>Recursos Clínicos</Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          indicatorColor="primary" 
          textColor="primary"
          variant="fullWidth"
        >
          {tabsConfig.map((t, index) => (
            <Tab 
              key={index} 
              icon={t.icon} 
              iconPosition="start" 
              label={t.label} 
              sx={{ fontWeight: 'bold', minHeight: 64 }}
            />
          ))}
        </Tabs>
      </Paper>

      <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpen()}
          sx={{ bgcolor: currentTab.color, '&:hover': { bgcolor: currentTab.color, opacity: 0.9 } }}
        >
          Novo(a) {currentTab.label.slice(0, -1)}
        </Button>
      </Stack>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>
      ) : (
        <GenericTable
          title={`Listagem de ${currentTab.label}`}
          headCells={getHeadCells()}
          rows={data}
          renderRow={(row) => (
            <>
              <TableCell sx={{ fontWeight: 'bold' }}>{row.nome || row.descricao}</TableCell>
              
              {tabValue === 0 ? ( // Colunas exclusivas de Vacinas
                <>
                  <TableCell>{row.fabricante || '-'}</TableCell>
                  <TableCell>{row.lote || '-'}</TableCell>
                </>
              ) : ( // Coluna de descrição para os outros
                <TableCell>{row.descricao || row.nome}</TableCell>
              )}

              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <IconButton color="primary" onClick={() => handleOpen(row)}><EditIcon /></IconButton>
                  <IconButton color="error" onClick={() => handleDelete(row.id)}><DeleteIcon /></IconButton>
                </Stack>
              </TableCell>
            </>
          )}
        />
      )}

      {/* Modal Dinâmico */}
      <Dialog open={open} onClose={handleClose} component="form" onSubmit={handleSave} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold', color: currentTab.color }}>
          {selectedItem ? 'Editar' : 'Registar'} {currentTab.label.slice(0, -1)}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField 
              name="nome" 
              label={`Nome do(a) ${currentTab.label.slice(0, -1)}`} 
              defaultValue={selectedItem?.nome || selectedItem?.descricao || ''} 
              fullWidth 
              required 
            />
            
            {tabValue === 0 && ( // Campos extras apenas para Vacinas
              <>
                <TextField name="fabricante" label="Fabricante" defaultValue={selectedItem?.fabricante || ''} fullWidth required />
                <Stack direction="row" spacing={2}>
                  <TextField name="lote" label="Lote" defaultValue={selectedItem?.lote || ''} fullWidth required />
                  <TextField 
                    name="dataValidade" 
                    type="date" 
                    label="Validade" 
                    InputLabelProps={{ shrink: true }} 
                    defaultValue={selectedItem?.dataValidade?.slice(0,10) || ''} 
                    fullWidth 
                  />
                </Stack>
              </>
            )}

            {(tabValue === 1 || tabValue === 2) && (
              <TextField 
                name="descricao" 
                label="Descrição / Observações" 
                multiline 
                rows={3} 
                defaultValue={selectedItem?.descricao || ''} 
                fullWidth 
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button type="submit" variant="contained" sx={{ bgcolor: currentTab.color }}>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Vaccines;