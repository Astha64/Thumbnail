import { useQuery } from '@tanstack/react-query';
import { meApi } from '../api/me.api';

/**
 * NOTE: GET /api/me is currently NOT implemented on the backend.
 * This hook stays disabled until the backend provides the endpoint.
 * Use the user from AuthContext instead.
 */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: meApi.getMe,
    enabled: false, // disabled until backend provides /api/me
    staleTime: Infinity,
  });
}
