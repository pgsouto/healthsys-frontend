import * as React from 'react';
import PropTypes from 'prop-types';
import { alpha } from '@mui/material/styles';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, Toolbar, Typography,
  Paper, Checkbox, IconButton, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Funções de comparação atualizadas para os novos campos
function descendingComparator(a, b, orderBy) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

// 1. ATUALIZADO: IDs baseados no Model Java (Paciente.java)
const headCells = [
  { id: 'nome', numeric: false, disablePadding: true, label: 'Nome do Paciente' },
  { id: 'cpf', numeric: false, disablePadding: false, label: 'CPF' },
  { id: 'dataNascimento', numeric: false, disablePadding: false, label: 'Data Nasc.' },
  { id: 'telefone', numeric: false, disablePadding: false, label: 'Telefone' },
  { id: 'actions', numeric: true, disablePadding: false, label: 'Ações' },
];

function EnhancedTableHead(props) {
  const { onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort } = props;
  const createSortHandler = (property) => (event) => onRequestSort(event, property);

  return (
    <TableHead>
      <TableRow>
        <TableCell padding="checkbox">
          <Checkbox
            color="primary"
            indeterminate={numSelected > 0 && numSelected < rowCount}
            checked={rowCount > 0 && numSelected === rowCount}
            onChange={onSelectAllClick}
          />
        </TableCell>
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.id === 'actions' ? 'right' : 'left'}
            padding={headCell.disablePadding ? 'none' : 'normal'}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : 'asc'}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function EnhancedTableToolbar(props) {
  const { numSelected, onDeleteSelected } = props;
  return (
    <Toolbar
      sx={{
        pl: { sm: 2 }, pr: { xs: 1, sm: 1 },
        ...(numSelected > 0 && {
          bgcolor: (theme) => alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
        }),
      }}
    >
      {numSelected > 0 ? (
        <Typography sx={{ flex: '1 1 100%' }} color="inherit" variant="subtitle1" component="div">
          {numSelected} selecionado(s)
        </Typography>
      ) : (
        <Typography sx={{ flex: '1 1 100%' }} variant="h6" id="tableTitle" component="div">
          Listagem de Pacientes
        </Typography>
      )}

      {numSelected > 0 ? (
        <Tooltip title="Excluir Selecionados">
          <IconButton onClick={onDeleteSelected}>
            <DeleteIcon color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Filtrar">
          <IconButton><FilterListIcon /></IconButton>
        </Tooltip>
      )}
    </Toolbar>
  );
}

export default function EnhancedTable({ onEdit, onDelete, search }) {
  const [rows, setRows] = useState([]);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('nome'); // Alterado de 'name' para 'nome'
  const [selected, setSelected] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const navigate = useNavigate();

  const fetchPatients = async () => {
    try {
      // 2. ATUALIZADO: Ajuste o parâmetro de busca conforme seu Controller Spring (ex: ?nome=...)
      const url = search ? `/patients?nome=${search}` : '/patients';
      const response = await api.get(url);
      setRows(response.data);
    } catch (error) {
      console.error("Erro ao buscar pacientes:", error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const visibleRows = React.useMemo(
    () => [...rows].sort(getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, order, orderBy, page, rowsPerPage],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2, overflow: 'hidden' }}>
        <EnhancedTableToolbar 
          numSelected={selected.length} 
          onDeleteSelected={() => console.log("Excluir IDs:", selected)}
        />
        <TableContainer>
          <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size="medium">
            <EnhancedTableHead
              numSelected={selected.length}
              order={order}
              orderBy={orderBy}
              onSelectAllClick={handleSelectAllClick}
              onRequestSort={handleRequestSort}
              rowCount={rows.length}
            />
            <TableBody>
              {visibleRows.map((row, index) => {
                const isItemSelected = selected.includes(row.id);
                const labelId = `enhanced-table-checkbox-${index}`;

                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={row.id}
                    selected={isItemSelected}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onClick={(event) => handleClick(event, row.id)}
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </TableCell>
                    
                    {/* 3. ATUALIZADO: Nomes das propriedades de acordo com Paciente.java */}
                    <TableCell component="th" id={labelId} scope="row" padding="none">
                      {row.nome}
                    </TableCell>
                    <TableCell align="left">{row.cpf}</TableCell>
                    <TableCell align="left">
                      {row.dataNascimento ? new Date(row.dataNascimento).toLocaleDateString('pt-BR') : ''}
                    </TableCell>
                    <TableCell align="left">
                      {/* 4. ATUALIZADO: Como 'telefones' é uma lista no Java, pegamos o primeiro */}
                      {row.telefones && row.telefones.length > 0 ? row.telefones[0].numero : 'N/A'}
                    </TableCell>
                    
                    <TableCell align="right">
                      <Tooltip title="Ver Prontuário">
                        <IconButton 
                          color="success" 
                          onClick={() => navigate(`/patients/${row.id}`)}
                        >
                          <HistoryIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Editar">
                        <IconButton color="primary" onClick={() => onEdit(row)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => onDelete(row.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Pacientes por página:"
        />
      </Paper>
    </Box>
  );
}