import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { myRegistrationsRequest } from '../api/client';
import { findOwnRegistration, canCancel, cancellationMessage, attendanceLabel, dateBucket, SCAN_PAGE_LIMIT } from '../lib/registrations';
import { dateLabel, timeLabel } from '../lib/events';
import { Skeleton, ErrorState, EventImage } from '../components/ui';
import { RegistrationStatus } from '../components/student/RegistrationCard';
import CancelRegistrationDialog from '../components/student/CancelRegistrationDialog';
import useCancelRegistration from '../features/student/useCancelRegistration';
import useStudentQuery from '../features/student/useStudentQuery';

export default function RegistrationDetail() {
  const { id } = useParams();
  const cancel = useCancelRegistration();
  const [pendingCancel, setPendingCancel] = useState(null);
  const query = useStudentQuery({
    queryKey: ['own-registration', 'detail', id],
    queryFn: ({ signal }) => findOwnRegistration(myRegistrationsRequest, id, signal, SCAN_PAGE_LIMIT),
  });

  if (query.isPending) return <div className="container page"><Skeleton count={1} /></div>;
  if (query.isError) return <div className="container page"><ErrorState title="We couldn’t open this registration." error={query.error} retry={query.refetch} /><Link className="button button-secondary" to="/student/registrations">Back to my registrations</Link></div>;
  const registration = query.data?.registration || null;
  if (!registration) return <div className="container page"><div className="empty-state" role="status"><div className="empty-orbit" aria-hidden="true">✳</div><h2>{query.data.complete ? 'This registration isn’t in your history.' : 'Your registration list is too long to search fully.'}</h2><p>{query.data.complete ? 'It may belong to a different account, or the link is out of date.' : 'Try opening it again from My registrations.'}</p><Link className="button button-secondary" to="/student/registrations">Back to my registrations</Link></div></div>;

  const snapshot = registration.eventSnapshot || {};
  const start = snapshot.startAt;
  const cancelable = canCancel(registration);
  return <div className="container page detail-page student-home">
    <Link className="back-link" to="/student/registrations">← My registrations</Link>
    <section className="next-event reg-detail">
      <EventImage className="next-event-image" src={snapshot.bannerUrl} alt={snapshot.title || 'Registered event artwork'} eager />
      <div className="next-event-body">
        <div className="kicker-row"><RegistrationStatus status={registration.status} /></div>
        <h1>{snapshot.title || 'Event title unavailable'}</h1>
        <p className="muted" role="note">These details come from the registration snapshot and may differ from the current event schedule. The backend makes the final decision on cancellation eligibility.</p>
        {dateBucket(registration) === 'unknown' && <p className="muted" role="note">This registration has no usable snapshot date. Check the current event schedule before making plans.</p>}
        <dl className="detail-facts">
          <div><dt>When</dt><dd>{dateLabel(start)}<br />{timeLabel(start)}</dd></div>
          <div><dt>Where</dt><dd>{snapshot.venue || 'Venue to be announced'}</dd></div>
          <div><dt>Registered</dt><dd>{dateLabel(registration.registeredAt)}</dd></div>
          {registration.cancelledAt && <div><dt>Cancelled</dt><dd>{dateLabel(registration.cancelledAt)}</dd></div>}
          {registration.status === 'registered' && start && new Date(start).getTime() < Date.now() && <div><dt>Attendance</dt><dd>{attendanceLabel(registration)}</dd></div>}
        </dl>
        <div className="reg-card-actions">
          <Link className="button button-small" to="/events">Discover similar events ↗</Link>
          {cancelable && <button className="text-button danger" onClick={() => setPendingCancel(registration)} disabled={cancel.isPending}>Cancel registration</button>}
          {registration.status === 'cancelled' && <p className="muted">Your spot was released. You can register again while registration stays open.</p>}
        </div>
        {cancel.isError && <p className="error-text" role="alert">{cancellationMessage(cancel.error)}</p>}
      </div>
    </section>
    {pendingCancel && !query.isPending && !query.isError && <CancelRegistrationDialog registration={{ registration: pendingCancel, onConfirm: (target) => cancel.mutateAsync({ id: target._id }) }} onClose={() => setPendingCancel(null)} />}
  </div>;
}
