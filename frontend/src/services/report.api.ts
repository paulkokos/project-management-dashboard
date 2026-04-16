import api from './api';
import type {
  ReportConfiguration,
  ReportConfigurationListItem,
  Report,
  ReportListItem,
  ProjectProgressReport,
  TaskCompletionReport,
} from '@/types';

export const reportApi = {
  getReportConfigurations: async (): Promise<ReportConfigurationListItem[]> => {
    const response = await api.get('/report-configurations/');
    return response.data;
  },

  getReportConfiguration: async (id: number): Promise<ReportConfiguration> => {
    const response = await api.get(`/report-configurations/${id}/`);
    return response.data;
  },

  createReportConfiguration: async (data: Partial<ReportConfiguration>): Promise<ReportConfiguration> => {
    const response = await api.post('/report-configurations/', data);
    return response.data;
  },

  updateReportConfiguration: async (id: number, data: Partial<ReportConfiguration>): Promise<ReportConfiguration> => {
    const response = await api.patch(`/report-configurations/${id}/`, data);
    return response.data;
  },

  deleteReportConfiguration: async (id: number): Promise<void> => {
    await api.delete(`/report-configurations/${id}/`);
  },

  getReports: async (): Promise<ReportListItem[]> => {
    const response = await api.get('/reports/');
    return response.data;
  },

  getReport: async (id: number): Promise<Report> => {
    const response = await api.get(`/reports/${id}/`);
    return response.data;
  },

  deleteReport: async (id: number): Promise<void> => {
    await api.delete(`/reports/${id}/`);
  },

  generateProjectProgressReport: async (params: {
    start_date?: string;
    end_date?: string;
    relative_time_range?: string;
    project_ids?: number[];
    status_filter?: string;
    health_filter?: string;
    save_report?: boolean;
    title?: string;
    description?: string;
  }): Promise<ProjectProgressReport | Report> => {
    const response = await api.post('/reports/generate_project_progress/', params);
    return response.data;
  },

  generateTaskCompletionReport: async (params: {
    start_date?: string;
    end_date?: string;
    relative_time_range?: string;
    project_ids?: number[];
    save_report?: boolean;
    title?: string;
    description?: string;
  }): Promise<TaskCompletionReport | Report> => {
    const response = await api.post('/reports/generate_task_completion/', params);
    return response.data;
  },

  exportReportToPDF: async (id: number): Promise<{ success: boolean; message: string; report_id: number; report_title: string }> => {
    const response = await api.post(`/reports/${id}/export_pdf/`);
    return response.data;
  },

  downloadReport: async (id: number): Promise<Blob> => {
    const response = await api.get(`/reports/${id}/download/`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportApi;
