import { api } from '@/data';
import { useSession } from '@/store/session';
import { useAsync } from './useAsync';

export function useLoyalty() {
  const token = useSession((s) => s.token);
  return useAsync(async () => (token ? api.loyalty(token) : undefined), [token]);
}
