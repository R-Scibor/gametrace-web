import { useQuery } from '@tanstack/react-query';
import { getTrash } from '../api/sessions';
import { qk } from '../lib/queryKeys';

export function useTrash() {
  return useQuery({
    queryKey: qk.trash,
    queryFn: () => getTrash(0, 100),
  });
}
