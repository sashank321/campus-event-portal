import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, myRegistrationsRequest } from '../../api/client';
import { registrationState, safeReturn } from '../../lib/events';
import { canCancel, findEventRegistration, privateRegistrationQuery, publicEventQuery, idOf } from '../../lib/registrations';
import useCancelRegistration from '../student/useCancelRegistration';
import { useAuth } from './AuthContext';
import CancelRegistrationDialog from '../../components/student/CancelRegistrationDialog';

export default function RegistrationCTA({ event }) {
  const auth = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const cancelOwn = useCancelRegistration();
  const eventId = idOf(event);
  const userId = auth.user?.id;
  const student = auth.user?.role === 'student' && auth.user?.isActive !== false;
  const scope = `${userId || ''}:${eventId}`;
  const currentScope = useRef(scope);
  currentScope.current = scope;
  // Keeps the scope snapshot only while this instance is mounted, so a POST
  // resolving after logout (or remount under another session) is discarded.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; };
  }, []);
  const isCurrent = (owner) => alive.current && Boolean(owner) && currentScope.current === owner;
  const submitting = useRef(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const queryKey = ['own-registration', userId, eventId];
  const existing = useQuery({
    queryKey,
    queryFn: ({ signal }) => findEventRegistration(myRegistrationsRequest, eventId, signal),
    enabled: Boolean(eventId && student && !auth.loading && !auth.error),
    meta: { authScoped: true },
    staleTime: 30_000,
    retry: false,
  });

  const registration = useMutation({
    mutationKey: ['own-registration', 'create', userId, eventId],
    meta: { authScoped: true },
    retry: false,
    mutationFn: async ({ id }) => {
      try {
        const body = await api(`/events/${encodeURIComponent(id)}/register`, { method: 'POST' });
        return body.data?.registration || null;
      } catch (error) {
        // Confirm via a fresh lookup, never fabricate a registration id or date.
        if (error.code === 'ALREADY_REGISTERED') return null;
        throw error;
      }
    },
    onSuccess: async (result, variables) => {
      // Public cache refresh is safe for any viewer; do it before the owner guard.
      void queryClient.invalidateQueries({ predicate: publicEventQuery });
      if (!isCurrent(variables.scope)) return;
      await queryClient.cancelQueries({ queryKey, exact: true });
      if (!isCurrent(variables.scope)) return;
      if (result) queryClient.setQueryData(queryKey, result);
      await queryClient.invalidateQueries({ predicate: privateRegistrationQuery });
    },
    onError: (error, variables) => {
      if (!isCurrent(variables.scope)) return;
      if (error.status === 401 || error.code === 'ACCOUNT_DISABLED') void auth.refresh();
      if (['EVENT_FULL', 'REGISTRATION_CLOSED', 'EVENT_NOT_REGISTERABLE', 'EVENT_NOT_FOUND'].includes(error.code)) {
        void queryClient.invalidateQueries({ predicate: publicEventQuery });
      }
    },
  });

  useEffect(() => {
    if (existing.error?.status === 401 || existing.error?.code === 'ACCOUNT_DISABLED') void auth.refresh();
  }, [existing.error, auth.refresh]);
  useEffect(() => { setCancelTarget(null); }, [scope]);

  const sameMutation = registration.variables?.scope === scope;
  const mutationError = sameMutation ? registration.error : null;
  const latest = existing.data;
  const confirmed = latest?.status === 'registered';
  const previouslyCancelled = latest?.status === 'cancelled';
  const waitlisted = latest?.status === 'waitlisted';
  const closed = event ? registrationState(event) : 'Registration unavailable';
  // Cancellation depends on the current event start, not capacity/deadline.
  const cancelable = confirmed && idOf(latest) && canCancel(latest, Date.now(), event.startAt);
  const pending = sameMutation && registration.isPending;
  const serverClosed = ['EVENT_FULL', 'REGISTRATION_CLOSED', 'EVENT_NOT_REGISTERABLE', 'EVENT_NOT_FOUND'].includes(mutationError?.code);
  const returnTo = safeReturn(`${location.pathname}${location.search}${location.hash}`);
  const authSearch = `?${new URLSearchParams({ returnTo })}`;

  async function register() {
    if (submitting.current || !student || auth.loading || auth.error || !eventId || !existing.isSuccess || existing.isFetching || existing.error || confirmed || waitlisted || closed || serverClosed) return;
    submitting.current = true;
    try { await registration.mutateAsync({ id: eventId, scope }); }
    catch { /* The mutation error renders below; never retry a POST automatically. */ }
    finally { if (alive.current) submitting.current = false; }
  }

  async function confirmCancellation(target) {
    const operationScope = scope;
    const body = await cancelOwn.mutateAsync({ id: idOf(target) });
    if (!isCurrent(operationScope)) return;
    const result = body?.data?.registration;
    if (result) queryClient.setQueryData(queryKey, result);
    registration.reset();
  }

  let content;
  if (auth.loading) {
    content = <p className="notice" role="status">Checking your account…</p>;
  } else if (auth.error) {
    content = <><p className="error-text" role="alert">{auth.error}</p><button className="button button-secondary" onClick={() => void auth.refresh()}>Retry account check</button></>;
  } else if (!auth.user) {
    content = <><p className="notice">{closed || 'Log in with a student account to register.'}</p><Link className="button" to={`/login${authSearch}`}>Log in</Link><Link className="link" to={`/register${authSearch}`}>Create a student account</Link></>;
  } else if (!student) {
    content = <p className="notice">{auth.user.isActive === false ? 'This account is inactive. Please contact campus support.' : 'Event registration is available to student accounts only.'}</p>;
  } else if (!eventId) {
    content = <p className="notice">Registration unavailable.</p>;
  } else if (existing.error) {
    content = <><p className="error-text" role="alert">{existing.error.status === 401 ? 'Your session expired. Please log in again.' : existing.error.message}</p><button className="button button-secondary" onClick={() => void existing.refetch()}>Retry registration check</button></>;
  } else if (existing.isPending || existing.isFetching) {
    content = <p className="notice" role="status">Checking your registration…</p>;
  } else if (confirmed) {
    content = <><p className="notice" role="status">You are registered for this event.</p>
      <Link className="text-link" to="/student/registrations">My Events ↗</Link>
      {cancelable && <button className="text-button danger" type="button" onClick={() => setCancelTarget({ ...latest, eventSnapshot: { ...latest.eventSnapshot, title: event.title } })}>Cancel registration</button>}</>;
  } else if (waitlisted) {
    content = <p className="notice" role="status">You are waitlisted for this event. No waitlist actions are available here.</p>;
  } else {
    content = <>
      {previouslyCancelled && <p className="notice" role="status">Registration cancelled.</p>}
      {(closed || serverClosed) && <p className="notice" role="status">{closed || mutationError.message}</p>}
      {mutationError && !serverClosed && <p className="error-text" role="alert">{mutationError.status === 401 ? 'Your session expired. Please log in again.' : mutationError.message}</p>}
      <button className="button" type="button" onClick={register} disabled={pending || Boolean(closed) || serverClosed}>{pending ? 'Registering…' : previouslyCancelled ? 'Register again' : 'Register for this event'}</button>
    </>;
  }

  return <section className="panel stack" aria-label="Event registration" aria-busy={pending}><p className="eyebrow">Registration</p>{content}
    {cancelTarget && student && <CancelRegistrationDialog registration={{ registration: cancelTarget, onConfirm: confirmCancellation }} onClose={() => setCancelTarget(null)} />}
  </section>;
}
