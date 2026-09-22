import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';

const AuthContext = createContext(null);
const authKey = ['auth', 'me'];
const privateRoots = new Set(['auth', 'own-registration', 'own-registrations', 'my-registrations', 'registrations']);
const isPrivate = (query) => query.meta?.authScoped === true || privateRoots.has(query.queryKey[0]);

function readUser(body) {
  if (!body?.data?.user?.id) throw new Error('The server returned an invalid account. Please try again.');
  return body.data.user;
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState(null);
  const operation = useRef(false);
  const session = useQuery({
    queryKey: authKey,
    queryFn: async ({ signal }) => {
      try {
        return readUser(await api('/auth/me', { signal }));
      } catch (error) {
        if (error.status === 401) return null;
        if (error.code === 'ACCOUNT_DISABLED' || (error.status === 403 && error.code === 'ACCOUNT_DISABLED')) {
          const cached = queryClient.getQueryData(authKey);
          if (cached) return { ...cached, isActive: false };
          return { id: 'disabled', role: 'student', isActive: false };
        }
        throw error;
      }
    },
    enabled: !busy,
    meta: { authScoped: true },
    retry: false,
    staleTime: 60_000,
  });

  const clearPrivateData = useCallback(async () => {
    await queryClient.cancelQueries({ predicate: isPrivate });
    queryClient.removeQueries({ predicate: (query) => isPrivate(query) && !(query.queryKey[0] === 'auth' && query.queryKey[1] === 'me') });
    for (const mutation of queryClient.getMutationCache().getAll()) {
      if (mutation.options.meta?.authScoped) queryClient.getMutationCache().remove(mutation);
    }
  }, [queryClient]);

  const refresh = useCallback(async () => {
    if (operation.current) return queryClient.getQueryData(authKey);
    setActionError(null);
    await queryClient.cancelQueries({ queryKey: authKey, exact: true });
    const result = await session.refetch();
    if (result.isSuccess && (!result.data || result.data.isActive === false)) await clearPrivateData();
    return result.data;
  }, [queryClient, session.refetch, clearPrivateData]);

  const login = useCallback(async ({ email, password }) => {
    if (operation.current) throw new Error('Please wait for the current account request.');
    operation.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await queryClient.cancelQueries({ queryKey: authKey, exact: true });
      const user = readUser(await api('/auth/login', {
        method: 'POST', body: JSON.stringify({ email, password }),
      }));
      await clearPrivateData();
      queryClient.setQueryData(authKey, user);
      return user;
    } catch (error) {
      setActionError(error.message);
      throw error;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }, [queryClient, clearPrivateData]);

  // Resolve failures rather than throwing: navigation can safely call logout directly.
  const logout = useCallback(async () => {
    if (operation.current) return false;
    operation.current = true;
    setBusy(true);
    setActionError(null);
    try {
      await queryClient.cancelQueries({ queryKey: authKey, exact: true });
      try {
        await api('/auth/logout', { method: 'POST' });
      } catch (error) {
        if (error.status !== 401) throw error;
      }
      await clearPrivateData();
      queryClient.setQueryData(authKey, null);
      return true;
    } catch (error) {
      setActionError(error.message || 'Could not log out. Please try again.');
      return false;
    } finally {
      operation.current = false;
      setBusy(false);
    }
  }, [queryClient, clearPrivateData]);

  const value = useMemo(() => ({
    user: session.data ?? null,
    loading: session.isPending || busy,
    error: actionError || session.error?.message || null,
    login, logout, refresh,
  }), [session.data, session.isPending, session.error, busy, actionError, login, logout, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider.');
  return context;
}

export default AuthProvider;
