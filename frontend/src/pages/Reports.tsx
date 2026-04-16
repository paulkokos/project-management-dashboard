import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Box,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Description as DescriptionIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import reportApi from '@/services/report.api';
import type { ReportListItem, ReportConfigurationListItem, ReportType } from '@/types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`report-tabpanel-${index}`}
      aria-labelledby={`report-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const getReportTypeLabel = (type: ReportType): string => {
  switch (type) {
    case 'project_progress':
      return 'Project Progress';
    case 'task_completion':
      return 'Task Completion';
    default:
      return type;
  }
};

const getStatusColor = (status: string): 'success' | 'warning' | 'info' | 'error' | 'default' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'generating':
      return 'info';
    case 'failed':
      return 'error';
    case 'draft':
      return 'warning';
    default:
      return 'default';
  }
};

export default function Reports() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'report' | 'config'; id: number } | null>(null);

  const {
    data: reports,
    isLoading: reportsLoading,
    error: reportsError,
    refetch: refetchReports,
  } = useQuery({
    queryKey: ['reports'],
    queryFn: reportApi.getReports,
  });

  const {
    data: configurations,
    isLoading: configsLoading,
    error: configsError,
    refetch: refetchConfigs,
  } = useQuery({
    queryKey: ['report-configurations'],
    queryFn: reportApi.getReportConfigurations,
  });

  const deleteReportMutation = useMutation({
    mutationFn: (id: number) => reportApi.deleteReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      refetchReports();
    },
  });

  const deleteConfigMutation = useMutation({
    mutationFn: (id: number) => reportApi.deleteReportConfiguration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-configurations'] });
      refetchConfigs();
    },
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleDeleteClick = (type: 'report' | 'config', id: number) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'report') {
        deleteReportMutation.mutate(itemToDelete.id);
      } else {
        deleteConfigMutation.mutate(itemToDelete.id);
      }
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const handleDownloadReport = async (report: ReportListItem) => {
    try {
      const blob = await reportApi.downloadReport(report.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${report.title}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download report:', error);
    }
  };

  if (reportsLoading || configsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" gutterBottom>
          Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/reports/new')}
        >
          Create Report
        </Button>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab icon={<DescriptionIcon />} label="Generated Reports" />
          <Tab icon={<BarChartIcon />} label="Saved Configurations" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {reportsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load reports: {reportsError instanceof Error ? reportsError.message : 'Unknown error'}
        </Alert>
        )}

        {reports && reports.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DescriptionIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No reports generated yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Create your first report to get started
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/reports/new')}
            >
              Create Report
            </Button>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Configuration</TableCell>
                  <TableCell>Generated At</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports?.map((report) => (
                  <TableRow key={report.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{report.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          report.report_type === 'project_progress' ? <BarChartIcon /> : <AssignmentIcon />
                        }
                        label={getReportTypeLabel(report.report_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={report.status}
                        color={getStatusColor(report.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {report.configuration_name || '—'}
                    </TableCell>
                    <TableCell>
                      {report.generated_at
                        ? format(new Date(report.generated_at), 'MMM d, yyyy HH:mm')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(report.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/reports/${report.id}`)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                      {report.status === 'completed' && (
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownloadReport(report)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick('report', report.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {configsError && (
          <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load configurations: {configsError instanceof Error ? configsError.message : 'Unknown error'}
        </Alert>
        )}

        {configurations && configurations.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BarChartIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No saved configurations
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Save report configurations to quickly generate reports
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Time Range</TableCell>
                  <TableCell>Projects</TableCell>
                  <TableCell>Charts</TableCell>
                  <TableCell>Updated</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {configurations?.map((config) => (
                  <TableRow key={config.id} hover>
                    <TableCell>
                      <Typography fontWeight="medium">{config.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={
                          config.report_type === 'project_progress' ? <BarChartIcon /> : <AssignmentIcon />
                        }
                        label={getReportTypeLabel(config.report_type)}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      {config.relative_time_range
                        ? config.relative_time_range.replace(/_/g, ' ')
                        : config.start_date && config.end_date
                          ? `${config.start_date} to ${config.end_date}`
                          : 'Custom'}
                    </TableCell>
                    <TableCell>
                      <Chip label={config.project_count} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={config.include_charts ? 'Enabled' : 'Disabled'}
                        color={config.include_charts ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {format(new Date(config.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Use Configuration">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/reports/new?config=${config.id}`)
                          }
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteClick('config', config.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </TabPanel>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {itemToDelete?.type === 'report' ? 'report' : 'configuration'}?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
