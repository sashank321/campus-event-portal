import { useState } from 'react';
import { Link } from 'react-router-dom';
import useStudentQuery from '../features/student/useStudentQuery';
import { myRegistrationsRequest } from '../api/client';
import { scanRegistrationDates, dateBucket, canCancel, SCAN_PAGE_LIMIT } from '../lib/registrations';
import { dateLabel, timeLabel } from '../lib/events';
import { Skeleton, ErrorState, EventImage } from '../components/ui';
import { RegistrationStatus, StudentHeader } from '../components/student/RegistrationCard';
import AccountPanel from '../components/student/AccountPanel';
import useCancelRegistration from '../features/student/useCancelRegistration';
import CancelRegistrationDialog from '../components/student/CancelRegistrationDialog';
import { useAuth } from '../features/auth/AuthContext';

function firstName(name = '') { return name.trim().split(/\s+/)[0] || 'there'; }

function NextEvent({ registration, onCancel, cancelPending, complete }) {
  const snapshot = registration.eventSnapshot || {};
  return <section aria-labelledby="next-up-heading">
    <p className="section-label" id="next-up-heading">{complete ? 'Next up (snapshot schedule)' : 'Upcoming event (snapshot schedule)'}</p>
    <article className="next-event">
      <EventImage className="next-event-image" src={snapshot.bannerUrl} alt={snapshot.title || 'Next event artwork'} eager />
      <div className="next-event-body">
        <div className="kicker-row"><RegistrationStatus status={registration.status} /></div>
        <h2>{snapshot.title || 'Event title unavailable'}</h2>
        <p className="next-meta">{dateLabel(snapshot.startAt)} · {timeLabel(snapshot.startAt)}<br />{snapshot.venue || 'Venue to be announced'}</p>
        <div className="reg-card-actions">
          <Link className="button button-small" to={`/student/registrations/${registration._id}`}>View registration</Link>
          {canCancel(registration) && <button className="text-button danger" onClick={() => onCancel(registration)} disabled={cancelPending}>Cancel registration</button>}
        </div>
      </div>
    </article>
  </section>;
}

export default function StudentOverview() {
  const auth = useAuth();
  const cancel = useCancelRegistration();
  const [pendingCancel, setPendingCancel] = useState(null);
  const upcomingQuery = useStudentQuery({
    queryKey: ['own-registrations', 'overview', 'upcoming'],
    queryFn: ({ signal }) => scanRegistrationDates(myRegistrationsRequest, 'upcoming', signal, Date.now(), SCAN_PAGE_LIMIT),
  });
  const recentQuery = useStudentQuery({
    queryKey: ['own-registrations', 'overview', 'recent'],
    queryFn: ({ signal }) => myRegistrationsRequest({ status: 'all', sort: 'newest', page: 1, limit: 5 }, signal),
  });

  const incomplete = Boolean(upcomingQuery.data && !upcomingQuery.data.complete);
  const unknownDates = Boolean(upcomingQuery.data?.unknownDates) || (recentQuery.data?.data || []).some((registration) => dateBucket(registration) === 'unknown');
  const upcoming = upcomingQuery.data?.items || [];
  const next = upcoming[0] || null;
  const rest = upcoming.slice(1, 4);
  const recent = recentQuery.data?.data || [];
  const loading = upcomingQuery.isPending || recentQuery.isPending;
  const error = upcomingQuery.error || recentQuery.error;

  function retry() { void upcomingQuery.refetch(); void recentQuery.refetch(); }

  return <div className="container page student-home">
    <StudentHeader eyebrow={`WELCOME BACK, ${firstName(auth.user?.name).toUpperCase()}`} title={<em>Your campus, your schedule.</em>}>
      <div className="heading-actions"><Link className="button button-small" to="/events">Explore events ↗</Link><Link className="button button-small button-secondary" to="/student/registrations">My registrations</Link></div>
    </StudentHeader>
    {loading ? <Skeleton /> : error ? <ErrorState title="We couldn’t load your plans." error={error} retry={retry} />
      : <>
        <p className="muted" role="note">Times below come from registration snapshots and may differ from the current event schedule. The backend has the final say on cancellations.</p>
        {incomplete && <p className="muted" role="note">The upcoming date scan reached its limit. These are only some matching registrations, not necessarily your nearest upcoming events. My registrations shows the same partial scan; earlier upcoming events may be missing.</p>}
        {unknownDates && <p className="muted" role="note">Some registrations are missing a usable event date and can’t be placed on your schedule. Open My registrations and check the All tab.</p>}
        {!upcoming.length && !recent.length ? <div className="empty-state"><div className="empty-orbit" aria-hidden="true">✳</div><h2>{incomplete ? 'No plans found in this partial scan.' : 'No plans yet.'}</h2><p>Discover what’s happening around campus.</p><Link className="button" to="/events">Explore Events</Link></div>
          : <>
            {next && <NextEvent registration={next} onCancel={setPendingCancel} cancelPending={cancel.isPending && pendingCancel?._id === next._id} complete={!incomplete && !unknownDates} />}
            {rest.length > 0 && <section aria-label="More upcoming events"><p className="section-label">Also coming up</p><div className="reg-grid">{rest.map((registration) => <article key={registration._id} className="reg-card"><Link className="reg-card-link compact" to={`/student/registrations/${registration._id}`}><div className="reg-card-body"><div className="reg-card-top"><span className="reg-when">{dateLabel(registration.eventSnapshot?.startAt)} · {timeLabel(registration.eventSnapshot?.startAt)}</span><RegistrationStatus status={registration.status} /></div><h3>{registration.eventSnapshot?.title || 'Event title unavailable'}</h3><p className="reg-venue">{registration.eventSnapshot?.venue || 'Venue to be announced'}</p></div></Link></article>)}</div></section>}
            {recent.length > 0 && <section aria-label="Recent registration activity"><p className="section-label">My activity</p><div className="panel activity-list">{recent.map((registration) => <Link key={registration._id} className="activity-row" to={`/student/registrations/${registration._id}`}><span className="activity-title">{registration.eventSnapshot?.title || 'Event title unavailable'}</span><span className="activity-meta">{dateLabel(registration.eventSnapshot?.startAt)}</span><RegistrationStatus status={registration.status} /></Link>)}</div></section>}
          </>}
        <p className="muted"><Link className="text-link" to="/student/registrations">Manage every registration ↗</Link></p>
      </>}
    {!loading && !error && <div id="account"><AccountPanel /></div>}
    {pendingCancel && !loading && !error && <CancelRegistrationDialog registration={{ registration: pendingCancel, onConfirm: (target) => cancel.mutateAsync({ id: target._id }) }} onClose={() => setPendingCancel(null)} />}
  </div>;
}
