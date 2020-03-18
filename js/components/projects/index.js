import React, { memo, useEffect } from 'react';
import { Panel } from '../common/Surfaces/Panel';
import {
  Table,
  makeStyles,
  TableBody,
  TableHead,
  TableCell,
  TableRow,
  TablePagination,
  TableFooter,
  IconButton,
  InputAdornment,
  TextField,
  Chip
} from '@material-ui/core';
import { Delete, Add, Search } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import { URLS } from '../routes/constants';
import moment from 'moment';
import { setProjectModalOpen } from './redux/actions';
import { useDispatch, useSelector } from 'react-redux';
import { ProjectModal } from './projectModal';
import { loadListOfProjects } from './redux/dispatchActions';

const useStyles = makeStyles(theme => ({
  table: {
    minWidth: 650
  },
  search: {
    margin: theme.spacing(1)
  },
  chip: {
    margin: theme.spacing(1) / 2
  }
}));

export const Projects = memo(({ history }) => {
  const classes = useStyles();
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const dispatch = useDispatch();

  const listOfProjects = useSelector(state => state.projectReducers.listOfProjects).map(project => {
    return {
      id: project.id,
      name: project.title,
      tags: JSON.parse(project.tags),
      target: project.target.title,
      createdAt: project.init_date,
      author: project.author.email
    };
  });

  useEffect(() => {
    dispatch(loadListOfProjects()).catch(error => {
      throw new Error(error);
    });
  }, [dispatch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <>
      <Panel
        hasHeader
        title="Project list"
        headerActions={[
          <TextField
            className={classes.search}
            id="input-with-icon-textfield"
            placeholder="Search"
            size="small"
            color="primary"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              )
            }}
          />,
          <IconButton color="inherit" onClick={() => dispatch(setProjectModalOpen(true))}>
            <Add />
          </IconButton>
        ]}
      >
        <Table className={classes.table} size="small" aria-label="a dense table">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell align="left">Target</TableCell>
              <TableCell align="left">Tags</TableCell>
              <TableCell align="left">Author</TableCell>
              <TableCell align="left">Created at</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {listOfProjects.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(project => (
              <TableRow key={project.id} hover>
                <TableCell component="th" scope="row">
                  <Link to={`${URLS.projects}${project.id}`}>{project.name}</Link>
                </TableCell>
                <TableCell align="left">
                  <Link to={`${URLS.target}${project.target}`}>{project.target}</Link>
                </TableCell>
                <TableCell align="left">
                  {project.tags &&
                    project.tags.map((tag, index) => (
                      <Chip key={index} label={tag} size="small" className={classes.chip} />
                    ))}
                </TableCell>
                <TableCell align="left">{project.author}</TableCell>
                <TableCell align="left">{moment(project.createdAt).format('LLL')}</TableCell>
                <TableCell align="right">
                  <IconButton>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[10, 15, 30, 50, 100]}
                count={listOfProjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                SelectProps={{
                  inputProps: { 'aria-label': 'rows per page' },
                  native: true
                }}
                onChangePage={handleChangePage}
                onChangeRowsPerPage={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </Panel>
      <ProjectModal history={history} />
    </>
  );
});
