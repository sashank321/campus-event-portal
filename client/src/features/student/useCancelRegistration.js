import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelRegistrationRequest } from '../../api/client';
import { cancellationMessage, privateRegistrationQuery, publicEventQuery } from '../../lib/registrations';
import { useAuth } from '../auth/AuthContext';

// Server-confirmed only. Capture the owner at submission, not callback time.
export default function useCancelRegistration() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const userId = auth.user?.id;
  const currentUser = useRef(userId);
  const mounted = useRef(true);
  currentUser.current = userId;
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const isCurrent = (owner) => mounted.current && Boolean(owner) && currentUser.current === owner;
  const sessionChanged = () => new Error('Your account session changed. Please reopen your registrations.');

  const mutation = useMutation({
    mutationKey: ['own-registrations', userId, 'cancel'],
    meta: { authScoped: true },
    retry: false,
    mutationFn: async ({ id, signal, owner }) => {
      if (!isCurrent(owner)) throw sessionChanged();
      try {
        const response = await cancelRegistrationRequest(id, signal);
        if (!isCurrent(owner)) throw sessionChanged();
        return response;
      } catch (error) {
        // Do not expose backend messages (or a previous user's error) to callers.
        if (!isCurrent(owner)) throw sessionChanged();
        const failure = new Error(cancelErrorText(error));
        failure.code = error?.code;
        failure.status = error?.status;
        throw failure;
      }
    },
    onSuccess: async (_response, { owner }) => {
      if (!isCurrent(owner)) return;
      await queryClient.invalidateQueries({
        predicate: (query) => isCurrent(owner) && (privateRegistrationQuery(query) || publicEventQuery(query)),
      });
    },
    onError: (error, { owner }) => {
      if (isCurrent(owner) && (error.status === 401 || error.code === 'ACCOUNT_DISABLED')) void auth.refresh();
    },
  });

  function scopedOptions(options) {
    if (!options) return undefined;
    return Object.fromEntries(Object.entries(options).map(([key, callback]) => [key, (...args) => {
      if (isCurrent(userId)) callback?.(...args);
    }]));
  }

  return {
    ...mutation,
    mutate: (variables, options) => mutation.mutate({ ...variables, owner: userId }, scopedOptions(options)),
    mutateAsync: async (variables, options) => {
      const response = await mutation.mutateAsync({ ...variables, owner: userId }, scopedOptions(options));
      if (!isCurrent(userId)) throw sessionChanged();
      return response;
    },
  };
}

export function cancelErrorText(error) {
  return cancellationMessage(error);
}
