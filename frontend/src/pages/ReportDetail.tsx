import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  PictureAsPdf as PdfIcon,
  Download as DownloadIcon,
  BarChart as BarChartIcon,
  Assignment as AssignmentIcon,
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
} from 'recharts';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import reportApi from '@/services/report.api';
import type { Report, ProjectProgressReport, TaskCompletionReport } from '@/types';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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

const getReportTypeLabel = (type: string): string => {
  switch (type) {
    case 'project_progress':
      return 'Project Progress Report';
    case 'task_completion':
      return 'Task Completion Report';
    default:
      return type;
  }
};

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const {
    data: report,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['report', id],
    queryFn: () => reportApi.getReport(Number(id)),
    enabled: !!id,
  });

  const reportData = report?.report_data as ProjectProgressReport | TaskCompletionReport | null;

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

  const exportToPDF = () => {
    if (!report || !reportData) return;

    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(report.title, 20, 25);
    
    // Date
    doc.setFontSize(10);
    if (report.generated_at) {
      doc.text(`Generated on: ${format(new Date(report.generated_at), 'MMM d, yyyy HH:mm')}`, 20, 35);
    }
    
    // Description
    if (report.description) {
      doc.setFontSize(12);
      doc.text(report.description, 20, 45);
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

    doc.save(`${report.title}.pdf`);
  };

  const downloadReport = async () => {
    if (!report) return;
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
    } catch (err) {
      console.error('Failed to download report:', err);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
        <Alert severity="error">
          Failed to load report: {error instanceof Error ? error.message : 'Unknown error'}
        </Alert>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reports')}>
          Back to Reports
        </Button>
        <Alert severity="info">Report not found</Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/reports')}>
            Back to Reports
          </Button>
          <Typography variant="h4" component="h1">
            {report.title}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<PdfIcon />}
            onClick={exportToPDF}
            disabled={report.status !== 'completed'}
          >
            Export PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={downloadReport}
            disabled={report.status !== 'completed'}
          >
            Download Data
          </Button>
        </Box>
      </div>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Chip
                icon={
                  report.report_type === 'project_progress' ? <BarChartIcon /> : <AssignmentIcon />
                }
                label={getReportTypeLabel(report.report_type)}
                variant="outlined"
              />
              <Chip
                label={report.status}
                color={getStatusColor(report.status)}
              />
            </Box>
            {report.description && (
              <Typography variant="body1" color="text.secondary">
                {report.description}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: { xs: 'left', md: 'right' } }}>
              {report.configuration_name && (
                <Typography variant="caption" display="block">
                  Configuration: {report.configuration_name}
                </Typography>
              )}
              {report.generated_at && (
                <Typography variant="caption" display="block">
                  Generated: {format(new Date(report.generated_at), 'MMM d, yyyy HH:mm')}
                </Typography>
              )}
              {report.generation_time_seconds && (
                <Typography variant="caption" display="block">
                  Generation time: {report.generation_time_seconds.toFixed(2)}s
                </Typography>
              )}
              <Typography variant="caption" display="block">
                Created: {format(new Date(report.created_at), 'MMM d, yyyy')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {report.status === 'failed' && (
        <Alert severity="error">
          Report generation failed: {report.error_message || 'Unknown error'}
        </Alert>
      )}

      {report.status === 'completed' && reportData && (
        <>
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

          <Divider sx={{ mb: 4 }} />

          {/* Charts */}
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

          {/* Data Tables */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            Details
          </Typography>

          {'total_projects' in reportData && 'projects' in reportData && reportData.projects.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Health</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell>Risk</TableCell>
                    <TableCell>Team</TableCell>
                    <TableCell>Milestones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{project.title}</Typography>
                      </TableCell>
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
                      <TableCell>
                        {project.completed_milestone_count} / {project.milestone_count}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {'total_tasks' in reportData && 'tasks' in reportData && reportData.tasks.length > 0 && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Task</TableCell>
                    <TableCell>Project</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Priority</TableCell>
                    <TableCell align="right">Progress</TableCell>
                    <TableCell>Assigned To</TableCell>
                    <TableCell>Due Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reportData.tasks.slice(0, 50).map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <Typography fontWeight="medium">{task.title}</Typography>
                      </TableCell>
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
                      <TableCell>
                        {task.due_date ? (
                          <Chip
                            label={task.due_date}
                            color={task.is_overdue ? 'error' : 'default'}
                            size="small"
                          />
                        ) : (
                          '—'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {reportData.tasks.length > 50 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Showing 50 of {reportData.tasks.length} tasks. Download the report to see all data.
                  </Typography>
                </Box>
              )}
            </TableContainer>
          )}
        </>
      )}
    </div>
  );
}
