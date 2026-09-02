import { useMutation } from '@tanstack/react-query';
import { jobsApi } from '../api/jobs.api';

export function useUploadHeadshot() {
  return useMutation({
    mutationFn: (file: File) => jobsApi.uploadHeadshot(file),
  });
}
