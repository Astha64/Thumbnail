import { apiClient } from './client';
import {
  CreateJobRequest,
  CreateJobResponse,
  JobResponse,
  UploadResponse,
} from '../types/api';

export const jobsApi = {
  uploadHeadshot: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UploadResponse>(
      '/api/upload_headshot',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  },

  createJob: async (data: CreateJobRequest): Promise<CreateJobResponse> => {
    const response = await apiClient.post<CreateJobResponse>('/api/job', data);
    return response.data;
  },

  getJob: async (jobId: string): Promise<JobResponse> => {
    const response = await apiClient.get<JobResponse>(`/api/job/${jobId}`);
    return response.data;
  },

  /**
   * NOTE: GET /api/jobs is NOT yet implemented on the backend.
   * This function exists for the future but is not called until the
   * backend endpoint is available.
   */
  listJobs: async (): Promise<JobResponse[]> => {
    const response = await apiClient.get<JobResponse[]>('/api/jobs');
    return response.data;
  },
};
