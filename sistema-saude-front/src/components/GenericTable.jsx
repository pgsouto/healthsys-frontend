import * as React from 'react';
import {
  Box, Table, TableBody, TableCell, TableContainer, TableHead,
  TablePagination, TableRow, TableSortLabel, Toolbar, Typography,
  Paper, Checkbox, IconButton, Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { visuallyHidden } from '@mui/utils';
import { alpha } from '@mui/material/styles';

// Funções de comparação (mantidas, mas agora genéricas)
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

// Sub-componente do Cabeçalho
function EnhancedTableHead({ headCells, onSelectAllClick, order, orderBy, numSelected, rowCount, onRequestSort }) {
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
            align={headCell.numeric ? 'right' : 'left'}
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

// Componente Principal
export default function GenericTable({ 
  title, 
  headCells, 
  rows, 
  onDeleteSelected, 
  renderRow, // Função mágica que decide como mostrar os dados
  initialOrderBy 
}) {
  const [order, setOrder] = React.useState('asc');
  const [orderBy, setOrderBy] = React.useState(initialOrderBy || headCells[0].id);
  const [selected, setSelected] = React.useState([]);
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      setSelected(rows.map((n) => n.id));
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];
    if (selectedIndex === -1) newSelected = [...selected, id];
    else if (selectedIndex === 0) newSelected = selected.slice(1);
    else if (selectedIndex === selected.length - 1) newSelected = selected.slice(0, -1);
    else newSelected = [...selected.slice(0, selectedIndex), ...selected.slice(selectedIndex + 1)];
    setSelected(newSelected);
  };

  const visibleRows = React.useMemo(
    () => [...rows].sort(getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, order, orderBy, page, rowsPerPage]
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2, borderRadius: 2 }}>
        {/* Toolbar Genérica */}
        <Toolbar sx={{ pl: { sm: 2 }, pr: { xs: 1, sm: 1 }, ...(selected.length > 0 && { bgcolor: (t) => alpha(t.palette.primary.main, 0.1) }) }}>
          <Typography sx={{ flex: '1 1 100%' }} variant="h6">
            {selected.length > 0 ? `${selected.length} selecionado(s)` : title}
          </Typography>
          {selected.length > 0 && (
            <IconButton onClick={() => onDeleteSelected(selected)}>
              <DeleteIcon color="error" />
            </IconButton>
          )}
        </Toolbar>

        <TableContainer>
          <Table sx={{ minWidth: 750 }}>
            <EnhancedTableHead
              headCells={headCells}
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
                return (
                  <TableRow key={row.id} hover selected={isItemSelected} role="checkbox">
                    <TableCell padding="checkbox">
                      <Checkbox 
                        checked={isItemSelected} 
                        onChange={() => handleSelectClick(row.id)} 
                      />
                    </TableCell>
                    {/* Aqui chamamos a função que você define na página */}
                    {renderRow(row)}
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
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </Box>
  );
}