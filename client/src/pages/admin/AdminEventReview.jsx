import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detailRequest, approveEventRequest, rejectEventRequest, cancelEventRequest } from '../../api/client';
import { adminStatusBadge, adminErrorText, confirmApproveText, confirmRejectText, confirmCancelEventText } from '../../lib/admin';
import { dateLabel, timeLabel, seats } from '../../lib/events';
import { Sheet } from '../../components/ui';

export default function AdminEventReview() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState(null); // 'approve' | 'reject' | 'cancel' | null
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'event-review', slug],
    queryFn: ({ signal }) => detailRequest(slug, signal),
  });

  const event = data?.data?.event;

  // Mutations
  const approveMutation = useMutation({
    mutationFn: () => approveEventRequest(event._id),
    onSuccess: (res) => {
      setConfirmAction(null);
      setActionError('');
      setActionSuccess('Event successfully approved! It is now live in public discovery.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetch();
    },
    onError: (err) => {
      setActionError(adminErrorText(err));
      setConfirmAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: () => rejectEventRequest(event._id),
    onSuccess: () => {
      setConfirmAction(null);
      setActionError('');
      setActionSuccess('Event proposal rejected.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetch();
    },
    onError: (err) => {
      setActionError(adminErrorText(err));
      setConfirmAction(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelEventRequest(event._id),
    onSuccess: () => {
      setConfirmAction(null);
      setActionError('');
      setActionSuccess('Event has been cancelled.');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      refetch();
    },
    onError: (err) => {
      setActionError(adminErrorText(err));
      setConfirmAction(null);
    },
  });

  const isPendingAction = approveMutation.isLoading || rejectMutation.isLoading || cancelMutation.isLoading;

  if (isLoading) {
    return (
      <div className="panel stack" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
        <p className="muted">Loading event details for moderation…</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="panel stack" role="alert">
        <p className="eyebrow" style={{ color: '#ef4444' }}>ERROR LOADING EVENT</p>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.25rem 0' }}>
          Event could not be found
        </h2>
        <p className="muted">
          {adminErrorText(error) || `No event found with slug or ID "${slug}".`}
        </p>
        <div className="heading-actions" style={{ marginTop: '1rem' }}>
          <button type="button" className="button button-secondary" onClick={() => refetch()}>
            Retry
          </button>
          <Link to="/admin/events" className="button">
            Back to Moderation Queue
          </Link>
        </div>
      </div>
    );
  }

  const badge = adminStatusBadge(event.status);
  const remaining = seats(event);
  const isPending = event.status === 'pending';
  const isCancelled = event.status === 'cancelled';

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Top Breadcrumb & Quick Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Link to="/admin/events" className="text-link">← Moderation Queue</Link>
          <span className="muted">/</span>
          <span className="muted">{event.slug}</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link
            to={`/admin/registrations?event=${encodeURIComponent(event._id)}`}
            className="button button-small button-secondary"
          >
            Attendee Roster ({event.registeredCount || 0}) ↗
          </Link>
          <Link
            to={`/events/${encodeURIComponent(event.slug)}`}
            className="button button-small button-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Public Page ↗
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="notice" role="status" style={{ borderLeft: '4px solid #10b981' }}>
          {actionSuccess}
        </div>
      )}
      {actionError && (
        <div className="notice" role="alert" style={{ borderLeft: '4px solid #ef4444' }}>
          {actionError}
        </div>
      )}

      {/* Main Moderation Card */}
      <section className="panel stack" style={{ gap: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className={badge.className}>{badge.label}</span>
              <span className="muted" style={{ fontSize: '0.8125rem', textTransform: 'capitalize' }}>
                Category: <strong>{event.category}</strong>
              </span>
            </div>
            <h1 style={{ fontSize: '1.875rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
              {event.title}
            </h1>
            <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
              Organized by <strong>{event.club?.name || 'Campus Wide'}</strong>
              {event.venue && <> · Location: <strong>{event.venue.name}</strong> ({event.venue.building})</>}
            </p>
          </div>

          {/* Action Buttons Panel */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {isPending && (
              <>
                <button
                  type="button"
                  className="btn-approve"
                  disabled={isPendingAction}
                  onClick={() => setConfirmAction('approve')}
                >
                  ✓ Approve Event
                </button>
                <button
                  type="button"
                  className="btn-reject"
                  disabled={isPendingAction}
                  onClick={() => setConfirmAction('reject')}
                >
                  ✕ Reject Event
                </button>
              </>
            )}
            {!isCancelled && (
              <button
                type="button"
                className="btn-cancel-admin"
                disabled={isPendingAction}
                onClick={() => setConfirmAction('cancel')}
              >
                Soft-Cancel Event
              </button>
            )}
          </div>
        </div>

        {/* Banner Preview if present */}
        {event.banner && (
          <div style={{ maxHeight: '280px', overflow: 'hidden', borderRadius: '0.5rem', background: '#000' }}>
            <img
              src={event.banner}
              alt={`${event.title} banner preview`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}

        {/* Schedule & Capacity Metadata Grid */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Event Start Date</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
              {dateLabel(event.startAt)}
            </span>
            <span className="kpi-hint">{timeLabel(event.startAt)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Event End Date</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
              {dateLabel(event.endAt)}
            </span>
            <span className="kpi-hint">{timeLabel(event.endAt)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Registration Deadline</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
              {dateLabel(event.registrationDeadline)}
            </span>
            <span className="kpi-hint">{timeLabel(event.registrationDeadline)}</span>
          </div>
          <div className="kpi-card">
            <span className="kpi-label">Capacity & Attendance</span>
            <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f8fafc' }}>
              {event.registeredCount || 0} / {event.capacity != null ? event.capacity : 'Unlimited'}
            </span>
            <span className="kpi-hint">
              {remaining != null ? `${remaining} seats remaining` : 'No capacity cap'}
            </span>
          </div>
        </div>

        {/* Description & Details */}
        <div className="stack" style={{ gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Event Description</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#cbd5e1' }}>
            {event.description || 'No description provided.'}
          </div>
        </div>

        {/* Eligibility Requirements */}
        <div className="stack" style={{ gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Eligibility Rules</h2>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            <div>
              <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>
                Eligible Departments
              </span>
              <strong style={{ color: '#f8fafc' }}>
                {event.eligibility?.departments?.length ? event.eligibility.departments.join(', ') : 'All Departments'}
              </strong>
            </div>
            <div>
              <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>
                Eligible Batches / Years
              </span>
              <strong style={{ color: '#f8fafc' }}>
                {event.eligibility?.years?.length ? event.eligibility.years.join(', ') : 'All Years'}
              </strong>
            </div>
            <div>
              <span className="muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', display: 'block' }}>
                Minimum CGPA Requirement
              </span>
              <strong style={{ color: '#f8fafc' }}>
                {event.eligibility?.minCgpa ? `${event.eligibility.minCgpa} CGPA` : 'None (Open)'}
              </strong>
            </div>
          </div>
        </div>

        {/* Guidelines */}
        {event.guidelines && event.guidelines.length > 0 && (
          <div className="stack" style={{ gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Guidelines & Instructions</h2>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>
              {event.guidelines.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
            {event.tags.map((t, i) => (
              <span key={i} className="pill" style={{ fontSize: '0.75rem' }}>#{t}</span>
            ))}
          </div>
        )}

        {/* Media Gallery */}
        {event.gallery && event.gallery.length > 0 && (
          <div className="stack" style={{ gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '1.5rem' }}>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Media Gallery ({event.gallery.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
              {event.gallery.map((img, i) => (
                <div key={i} style={{ height: '120px', borderRadius: '0.375rem', overflow: 'hidden' }}>
                  <img src={img} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Confirmation Sheet */}
      <Sheet
        open={Boolean(confirmAction)}
        onClose={() => setConfirmAction(null)}
        title={
          confirmAction === 'approve'
            ? 'Approve Event Proposal'
            : confirmAction === 'reject'
            ? 'Reject Event Proposal'
            : 'Soft-Cancel Event'
        }
      >
        <div className="stack" style={{ gap: '1.25rem' }}>
          <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            {confirmAction === 'approve' && confirmApproveText(event.title)}
            {confirmAction === 'reject' && confirmRejectText(event.title)}
            {confirmAction === 'cancel' && confirmCancelEventText(event.title)}
          </p>

          <div className="heading-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="button button-secondary"
              disabled={isPendingAction}
              onClick={() => setConfirmAction(null)}
            >
              Cancel
            </button>
            {confirmAction === 'approve' && (
              <button
                type="button"
                className="btn-approve"
                disabled={isPendingAction}
                onClick={() => approveMutation.mutate()}
              >
                {approveMutation.isLoading ? 'Approving…' : 'Confirm Approval'}
              </button>
            )}
            {confirmAction === 'reject' && (
              <button
                type="button"
                className="btn-reject"
                disabled={isPendingAction}
                onClick={() => rejectMutation.mutate()}
              >
                {rejectMutation.isLoading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            )}
            {confirmAction === 'cancel' && (
              <button
                type="button"
                className="btn-reject"
                disabled={isPendingAction}
                onClick={() => cancelMutation.mutate()}
              >
                {cancelMutation.isLoading ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            )}
          </div>
        </div>
      </Sheet>
    </div>
  );
}
