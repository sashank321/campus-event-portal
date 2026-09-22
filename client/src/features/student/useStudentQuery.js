import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthContext';
import { idOf } from '../../lib/registrations';

// Keep account data isolated, including when a background refetch loses auth.
export default function useStudentQuery({ queryKey, ...options }) {
  const auth = useAuth();
  const userId = idOf(auth.user);
  const query = useQuery({
    ...options,
    queryKey: [queryKey[0], userId, ...queryKey.slice(1)],
    enabled: Boolean(userId) && !auth.loading,
    meta: { authScoped: true },
    retry: (failureCount, error) => error?.status !== 401 && error?.code !== 'ACCOUNT_DISABLED' && failureCount < 1,
  });
  const unauthorized = query.error?.status === 401;
  const disabled = query.error?.code === 'ACCOUNT_DISABLED';

  useEffect(() => {
    if (unauthorized || disabled) void auth.refresh().catch(() => {});
  }, [unauthorized, disabled, query.errorUpdatedAt, auth.refresh]);

  // A disabled account is not a transient failure: hide private data and stop retrying.
  const hidden = unauthorized || disabled || !userId || auth.user?.isActive === false || auth.loading;
  return {
    ...query,
    data: hidden ? undefined : query.data,
    isPending: !unauthorized && !disabled && (query.isPending || !userId || auth.loading),
    isError: unauthorized || disabled || query.isError,
  };
}
