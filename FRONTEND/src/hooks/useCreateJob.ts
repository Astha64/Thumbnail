import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { jobsApi } from '../api/jobs.api';
import { CreateJobRequest } from '../types/api';

export function useCreateJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateJobRequest) => jobsApi.createJob(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      navigate(`/job/${data.job_id}`);
    },
  });
}
