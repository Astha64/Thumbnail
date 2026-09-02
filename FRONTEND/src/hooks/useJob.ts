import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs.api';

export function useJob(jobId: string | undefined) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobsApi.getJob(jobId!),
    enabled: !!jobId,
    retry: 2,
  });
}
