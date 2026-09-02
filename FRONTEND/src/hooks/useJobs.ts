import { useQuery } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs.api';

/**
 * NOTE: GET /api/jobs is currently NOT implemented on the backend.
 * This hook stays disabled until the backend provides the endpoint.
 * The dashboard shows the empty state instead.
 */
export function useJobs() {
  return useQuery({
    queryKey: ['jobs'],
    queryFn: jobsApi.listJobs,
    enabled: false, // disabled until backend provides /api/jobs
    staleTime: Infinity,
  });
}
