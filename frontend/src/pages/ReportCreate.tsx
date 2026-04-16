import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Chip,
  Divider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete,
  ListItemText,
  OutlinedInput,
  Tabs,
  Tab,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
  PictureAsPdf as PdfIcon,
  SaveAlt as SaveAltIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import reportApi from '@/services/report.api';
import { projectAPI } from '@/services';
import type {
  ReportType,
  TimeRangeOption,
  ProjectProgressReport,
  TaskCompletionReport,
  Project,
} from '@/types';

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
      id={`report-type-tabpanel-${index}`}
      aria-labelledby={`report-type-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const TIME_RANGE_OPTIONS: { value: TimeRangeOption; label: string }[] = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_30_days', label: 'Last 30 Days' },
  { value: 'last_90_days', label: 'Last 90 Days' },
  { value: 'this_month', label: 'This Month' },
  { value: 'this_quarter', label: 'This Quarter' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function ReportCreate() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const configId = searchParams.get('config');

  // Report type
  const [reportType, setReportType] = useState<ReportType>('project_progress');
  const [tabValue, setTabValue] = useState(0);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timeRangeOption, setTimeRangeOption] = useState<TimeRangeOption>('last_30_days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [healthFilter, setHealthFilter] = useState<string>('');
  const [includeCharts, setIncludeCharts] = useState(true);
  const [saveConfigName, setSaveConfigName] = useState('');

  // Results
  const [reportData, setReportData] = useState<ProjectProgressReport | TaskCompletionReport | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load projects
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectAPI.list(),
  });

  // Load config if provided
  const { data: config } = useQuery({
    queryKey: ['report-configuration', configId],
    queryFn: () => reportApi.getReportConfiguration(Number(configId)),
    enabled: !!configId,
  });

  // Apply config values
  useEffect(() => {
    if (config) {
      setReportType(config.report_type);
      setTabValue(config.report_type === 'project_progress' ? 0 : 1);
      setTitle(config.name + ' Report');
      setStatusFilter(config.status_filter || '');
      setHealthFilter(config.health_filter || '');
      setIncludeCharts(config.include_charts);
      setSaveConfigName(config.name);
      if (config.relative_time_range) {
        setTimeRangeOption(config.relative_time_range as TimeRangeOption);
      } else if (config.start_date && config.end_date) {
        setTimeRangeOption('custom');
        setStartDate(config.start_date);
        setEndDate(config.end_date);
      }
      if (config.projects) {
        setSelectedProjects(config.projects.map((p) => p.id));
      }
    }
  }, [config]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setReportType(newValue === 0 ? 'project_progress' : 'task_completion');
  };

  const getReportParams = () => {
    const params: any = {};
    
    if (timeRangeOption === 'custom') {
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
    } else {
      params.relative_time_range = timeRangeOption;
    }
    
    if (selectedProjects.length > 0) {
      params.project_ids = selectedProjects;
    }
    
    if (reportType === 'project_progress') {
      if (statusFilter) params.status_filter = statusFilter;
      if (healthFilter) params.health_filter = healthFilter;
    }
    
    return params;
  };

  const generateReport = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const params = getReportParams();
      let result;
      
      if (reportType === 'project_progress') {
        result = await reportApi.generateProjectProgressReport(params);
      } else {
        result = await reportApi.generateTaskCompletionReport(params);
      }
      
      setReportData(result as ProjectProgressReport | TaskCompletionReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveAndGenerateReport = async () => {
    if (!saveConfigName.trim()) {
      setError('Please enter a configuration name');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // First, save configuration
      const configData: any = {
        name: saveConfigName,
        report_type: reportType,
        include_charts: includeCharts,
        chart_types: ['bar', 'pie'],
      };
      
      if (timeRangeOption === 'custom') {
        if (startDate) configData.start_date = startDate;
        if (endDate) configData.end_date = endDate;
      } else {
        configData.relative_time_range = timeRangeOption;
      }
      
      if (selectedProjects.length > 0) {
        configData.project_ids = selectedProjects;
      }
      
      if (reportType === 'project_progress') {
        if (statusFilter) configData.status_filter = statusFilter;
        if (healthFilter) configData.health_filter = healthFilter;
      }
      
      await reportApi.createReportConfiguration(configData);
      
      // Then generate and save report
      const params = {
        ...getReportParams(),
        save_report: true,
        title: title || saveConfigName,
        description,
      };
      
      let result;
      if (reportType === 'project_progress') {
        result = await reportApi.generateProjectProgressReport(params);
      } else {
        result = await reportApi.generateTaskCompletionReport(params);
      }
      
      setReportData(result as ProjectProgressReport | TaskCompletionReport);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-configurations'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save and generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(title || 'Project Report', 20, 25);
    
    // Date
    doc.setFontSize(10);
    doc.text(`Generated on: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, 20, 35);
    
    // Description
    if (description) {
      doc.setFontSize(12);
      doc.text(description, 20, 45);
    }

    let yPos = 60;

    if ('total_projects' in reportData) {
      // Project Progress Report
      doc.setFontSize(16);
      doc.text(`Project Progress Report - ${reportData.total_projects} Projects`, 20, yPos);
      yPos += 15;

      // Summary table
      const summaryData = [
        ['Metric', 'Value'],
        ['Average Progress', `${reportData.summary.average_progress}%`],
        ['Completed Projects', String(reportData.summary.completed_count)],
        ['Active Projects', String(reportData.summary.active_count)],
        ['On Hold Projects', String(reportData.summary.on_hold_count)],
      ];

      autoTable(doc, {
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: yPos,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // Projects table
      if (reportData.projects.length > 0) {
        doc.setFontSize(14);
        doc.text('Projects', 20, yPos);
        yPos += 10;

        const projectData = [
          ['Project', 'Status', 'Progress', 'Risk'],
          ...reportData.projects.map((p) => [
            p.title,
            p.status,
            `${p.progress}%`,
            p.risk_level,
          ]),
        ];

        autoTable(doc, {
          head: [projectData[0]],
          body: projectData.slice(1),
          startY: yPos,
          theme: 'striped',
        });
      }
    } else {
      // Task Completion Report
      doc.setFontSize(16);
      doc.text(`Task Completion Report - ${reportData.total_tasks} Tasks`, 20, yPos);
      yPos += 15;

      // Summary table
      const summaryData = [
        ['Metric', 'Value'],
        ['Completion Rate', `${reportData.summary.completion_rate}%`],
        ['Completed Tasks', String(reportData.summary.completed_count)],
        ['In Progress', String(reportData.summary.in_progress_count)],
        ['To Do', String(reportData.summary.todo_count)],
      ];

      autoTable(doc, {
        head: [summaryData[0]],
        body: summaryData.slice(1),
        startY: yPos,
        theme: 'grid',
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // Tasks by project
      if (reportData.by_project.length > 0) {
        doc.setFontSize(14);
        doc.text('Tasks by Project', 20, yPos);
        yPos += 10;

        const projectData = [
          ['Project', 'Total Tasks', 'Completed'],
          ...reportData.by_project.map((p) => [
            p.project__title,
            String(p.total),
            String(p.completed),
          ]),
        ];

        autoTable(doc, {
          head: [projectData[0]],
          body: projectData.slice(1),
          startY: yPos,
          theme: 'striped',
        });
      }
    }

    doc.save(`${title || 'report'}.pdf`);
  };

  // Chart data preparations
  const statusChartData = useMemo(() => {
    if (!reportData || !('by_status' in reportData)) return [];
    return reportData.by_status.map((item) => ({
      name: item.status,
      value: item.count,
    }));
  }, [reportData]);

  const healthChartData = useMemo(() => {
    if (!reportData || !('by_health' in reportData)) return [];
    return reportData.by_health.map((item) => ({
      name: item.health,
      value: item.count,
    }));
  }, [reportData]);

  const progressChartData = useMemo(() => {
    if (!reportData || !('progress_distribution' in reportData)) return [];
    return reportData.progress_distribution.map((item) => ({
      range: item.range,
      count: item.count,
    }));
  }, [reportData]);

  const taskStatusChartData = useMemo(() => {
    if (!reportData || !('by_status' in reportData)) return [];
    if ('total_projects' in reportData) return [];
    return reportData.by_status.map((item) => ({
      name: item.status,
      value: item.count,
    }));
  }, [reportData]);

  const taskPriorityChartData = useMemo(() => {
    if (!reportData || !('by_priority' in reportData)) return [];
    return reportData.by_priority.map((item) => ({
      name: item.priority,
      value: item.count,
    }));
  }, [reportData]);

  const taskByProjectChartData = useMemo(() => {
    if (!reportData || !('by_project' in reportData)) return [];
    return reportData.by_project.map((item) => ({
      project: item.project__title || 'Unknown',
      total: item.total,
      completed: item.completed,
    }));
  }, [reportData]);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
        <Typography variant="h4" component="h1">
          Create Report
        </Typography>
      </div>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Report Configuration
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {/* Report Type */}
            <Box sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel id="report-type-label">Report Type</InputLabel>
                <Select
                  labelId="report-type-label"
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => {
                    const value = e.target.value as ReportType;
                    setReportType(value);
                    setTabValue(value === 'project_progress' ? 0 : 1);
                  }}
                >
                  <MenuItem value="project_progress">
                    <BarChartIcon sx={{ mr: 1 }} /> Project Progress Report
                  </MenuItem>
                  <MenuItem value="task_completion">
                    <AssignmentIcon sx={{ mr: 1 }} /> Task Completion Report
                  </MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              label="Report Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Description */}
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mb: 3 }}
            />

            {/* Time Range */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Time Range
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="time-range-label">Time Range</InputLabel>
              <Select
                labelId="time-range-label"
                value={timeRangeOption}
                label="Time Range"
                onChange={(e) => setTimeRangeOption(e.target.value as TimeRangeOption)}
              >
                {TIME_RANGE_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {timeRangeOption === 'custom' && (
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
            )}

            {/* Projects Selection */}
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Projects (Leave empty for all)
            </Typography>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="projects-label">Select Projects</InputLabel>
              <Select
                labelId="projects-label"
                multiple
                value={selectedProjects}
                onChange={(e) => setSelectedProjects(e.target.value as number[])}
                input={<OutlinedInput label="Select Projects" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const project = projects?.data?.results?.find((p) => p.id === id);
                      return (
                        <Chip key={id} label={project?.title || id} size="small" />
                      );
                    })}
                  </Box>
                )}
              >
                {projects?.data?.results?.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    <Checkbox checked={selectedProjects.indexOf(project.id) > -1} />
                    <ListItemText primary={project.title} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Project Progress specific filters */}
            {reportType === 'project_progress' && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Filters
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="status-filter-label">Status Filter</InputLabel>
                  <Select
                    labelId="status-filter-label"
                    value={statusFilter}
                    label="Status Filter"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="on_hold">On Hold</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                    <MenuItem value="archived">Archived</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="health-filter-label">Health Filter</InputLabel>
                  <Select
                    labelId="health-filter-label"
                    value={healthFilter}
                    label="Health Filter"
                    onChange={(e) => setHealthFilter(e.target.value)}
                  >
                    <MenuItem value="">All Health</MenuItem>
                    <MenuItem value="healthy">Healthy</MenuItem>
                    <MenuItem value="at_risk">At Risk</MenuItem>
                    <MenuItem value="critical">Critical</MenuItem>
                  </Select>
                </FormControl>
              </>
            )}

            {/* Chart Options */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                />
              }
              label="Include Charts in Report"
              sx={{ mb: 3 }}
            />

            {/* Save Configuration */}
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>Save as Configuration</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <TextField
                  fullWidth
                  label="Configuration Name"
                  value={saveConfigName}
                  onChange={(e) => setSaveConfigName(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={saveAndGenerateReport}
                  disabled={isGenerating || !saveConfigName.trim()}
                >
                  Save Config & Generate
                </Button>
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                fullWidth
                variant="contained"
                onClick={generateReport}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <CircularProgress size={24} />
                ) : (
                  'Generate Report'
                )}
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, minHeight: '600px' }}>
            {!reportData ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '500px',
                }}
              >
                {reportType === 'project_progress' ? (
                  <BarChartIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                ) : (
                  <AssignmentIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                )}
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  Configure and Generate Report
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Select your report options and click "Generate Report" to preview
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6">
                    {title || 'Report Preview'}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<PdfIcon />}
                      onClick={exportToPDF}
                    >
                      Export PDF
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<SaveAltIcon />}
                      onClick={async () => {
                        try {
                          const params = {
                            ...getReportParams(),
                            save_report: true,
                            title: title || 'Saved Report',
                            description,
                          };
                          
                          if (reportType === 'project_progress') {
                            await reportApi.generateProjectProgressReport(params);
                          } else {
                            await reportApi.generateTaskCompletionReport(params);
                          }
                          queryClient.invalidateQueries({ queryKey: ['reports'] });
                          navigate('/reports');
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Failed to save report');
                        }
                      }}
                    >
                      Save Report
                    </Button>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  {'total_projects' in reportData ? (
                    <>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Total Projects
                            </Typography>
                            <Typography variant="h4">{reportData.total_projects}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Avg Progress
                            </Typography>
                            <Typography variant="h4">{reportData.summary.average_progress}%</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Completed
                            </Typography>
                            <Typography variant="h4">{reportData.summary.completed_count}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Active
                            </Typography>
                            <Typography variant="h4">{reportData.summary.active_count}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  ) : (
                    <>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Total Tasks
                            </Typography>
                            <Typography variant="h4">{reportData.total_tasks}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Completion Rate
                            </Typography>
                            <Typography variant="h4">{reportData.summary.completion_rate}%</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              Completed
                            </Typography>
                            <Typography variant="h4">{reportData.summary.completed_count}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Card>
                          <CardContent>
                            <Typography color="text.secondary" variant="caption">
                              In Progress
                            </Typography>
                            <Typography variant="h4">{reportData.summary.in_progress_count}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </>
                  )}
                </Grid>

                {/* Charts */}
                {includeCharts && (
                  <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Charts
                    </Typography>
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                      {'total_projects' in reportData ? (
                        <>
                          {statusChartData.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Projects by Status
                                </Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={statusChartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {statusChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </Paper>
                            </Grid>
                          )}

                          {healthChartData.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Projects by Health
                                </Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={healthChartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {healthChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </Paper>
                            </Grid>
                          )}

                          {progressChartData.length > 0 && (
                            <Grid item xs={12}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Progress Distribution
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                  <BarChart data={progressChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="range" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="count" fill="#8884d8" name="Number of Projects" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </Paper>
                            </Grid>
                          )}
                        </>
                      ) : (
                        <>
                          {taskStatusChartData.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Tasks by Status
                                </Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={taskStatusChartData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {taskStatusChartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </Paper>
                            </Grid>
                          )}

                          {taskPriorityChartData.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Tasks by Priority
                                </Typography>
                                <ResponsiveContainer width="100%" height={250}>
                                  <BarChart data={taskPriorityChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="value" fill="#82ca9d" name="Number of Tasks" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </Paper>
                            </Grid>
                          )}

                          {taskByProjectChartData.length > 0 && (
                            <Grid item xs={12}>
                              <Paper sx={{ p: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                  Tasks by Project
                                </Typography>
                                <ResponsiveContainer width="100%" height={300}>
                                  <BarChart data={taskByProjectChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="project" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="total" fill="#8884d8" name="Total Tasks" />
                                    <Bar dataKey="completed" fill="#82ca9d" name="Completed" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </Paper>
                            </Grid>
                          )}
                        </>
                      )}
                    </Grid>
                  </>
                )}

                {/* Data Tables */}
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Details
                </Typography>

                {'total_projects' in reportData && 'projects' in reportData && reportData.projects.length > 0 && (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Project</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Health</TableCell>
                          <TableCell align="right">Progress</TableCell>
                          <TableCell>Risk</TableCell>
                          <TableCell>Team</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.projects.map((project) => (
                          <TableRow key={project.id}>
                            <TableCell>{project.title}</TableCell>
                            <TableCell>
                              <Chip label={project.status} size="small" />
                            </TableCell>
                            <TableCell>
                              <Chip label={project.health} size="small" />
                            </TableCell>
                            <TableCell align="right">{project.progress}%</TableCell>
                            <TableCell>
                              <Chip
                                label={project.risk_level}
                                color={
                                  project.risk_level === 'critical'
                                    ? 'error'
                                    : project.risk_level === 'high'
                                      ? 'warning'
                                      : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{project.team_count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {'total_tasks' in reportData && 'tasks' in reportData && reportData.tasks.length > 0 && (
                  <TableContainer component={Paper}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Task</TableCell>
                          <TableCell>Project</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Priority</TableCell>
                          <TableCell align="right">Progress</TableCell>
                          <TableCell>Assigned To</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {reportData.tasks.slice(0, 20).map((task) => (
                          <TableRow key={task.id}>
                            <TableCell>{task.title}</TableCell>
                            <TableCell>{task.project_title}</TableCell>
                            <TableCell>
                              <Chip
                                label={task.status}
                                color={task.status === 'done' ? 'success' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={task.priority}
                                color={
                                  task.priority === 'critical'
                                    ? 'error'
                                    : task.priority === 'high'
                                      ? 'warning'
                                      : 'default'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell align="right">{task.progress}%</TableCell>
                            <TableCell>{task.assigned_to?.username || '—'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {reportData.generation_time_seconds && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    Generated in {reportData.generation_time_seconds} seconds on {reportData.generated_at}
                  </Typography>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
}
