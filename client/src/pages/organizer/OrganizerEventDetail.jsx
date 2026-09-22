import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detailRequest, cancelEventRequest } from '../../api/client';
import { dateLabel, timeLabel } from '../../lib/events';
import { statusBadge, registrationAvailability } from '../../lib/organizer';
import { Skeleton, ErrorState, EventImage } from '../../components/ui';
import CancelEventDialog from '../../components/organizer/CancelEventDialog';

export default function OrganizerEventDetail() {
  const { slug } = useParams();
  const queryClient = useQueryClient();
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const query = useQuery({
    queryKey: ['event', slug],
    queryFn: ({ signal }) => detailRequest(slug, signal),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id }) => cancelEventRequest(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['event', slug] });
      void queryClient.invalidateQueries({ queryKey: ['organizer'] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCancelDialog(false);
    },
  });

  if (query.isPending) {
    return <Skeleton count={4} />;
  }

  if (query.isError) {
    return (
      <ErrorState
        title="We couldn’t load this event."
        error={query.error}
        retry={query.refetch}
      />
    );
  }

  const event = query.data?.data?.event;
  if (!event) {
    return (
      <div className="empty-state">
        <h2>Event not found</h2>
        <p>The requested event could not be located in your managed events catalog.</p>
        <Link className="button" to="/organizer/events">
          Back to managed events
        </Link>
      </div>
    );
  }

  const badge = statusBadge(event.status);
  const isCancelled = event.status === 'cancelled';
  const avail = registrationAvailability(event);
  const seatsRemaining =
    event.seatsRemaining != null
      ? event.seatsRemaining
      : event.capacity != null
      ? Math.max(0, event.capacity - (event.registeredCount || 0))
      : 'Unlimited';

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Back Link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/organizer/events" className="text-link" style={{ fontSize: '0.875rem' }}>
          ← Back to managed events
        </Link>
        <Link to={`/events/${event.slug}`} className="text-link" style={{ fontSize: '0.875rem' }}>
          View public page ↗
        </Link>
      </div>

      {/* Header card */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ maxWidth: '700px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <span className={badge.className}>{badge.label}</span>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}>
                {event.category}
              </span>
              <span className="muted" style={{ fontSize: '0.875rem' }}>
                {dateLabel(event.startAt)} · {timeLabel(event.startAt)}
              </span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.25rem 0 0.5rem', color: '#f8fafc' }}>
              {event.title}
            </h1>
            <p className="muted" style={{ margin: 0 }}>
              Hosted by <strong>{event.club?.name || 'Campus Club'}</strong> at{' '}
              <strong>{event.venue?.name || 'TBA'}</strong>
            </p>
          </div>

          {/* Banner image preview */}
          {event.bannerUrl && (
            <div style={{ width: '160px', height: '100px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
              <EventImage src={event.bannerUrl} alt={event.title} />
            </div>
          )}
        </div>

        {/* Action Toolbar */}
        <div className="event-actions-bar" style={{ marginTop: '1rem' }}>
          <Link className="button button-small" to={`/organizer/events/${event.slug}/participants`}>
            Participants ({event.registeredCount || 0})
          </Link>
          <Link className="button button-small button-secondary" to={`/organizer/events/${event.slug}/check-in`}>
            Check-In Roster
          </Link>
          <Link className="button button-small button-secondary" to={`/organizer/events/${event.slug}/gallery`}>
            Gallery ({event.gallery?.length || 0}/10)
          </Link>
          {!isCancelled && (
            <Link className="button button-small button-secondary" to={`/organizer/events/${event.slug}/edit`}>
              Edit Details
            </Link>
          )}
          {!isCancelled && (
            <button
              type="button"
              className="text-button danger"
              style={{ fontSize: '0.875rem', marginLeft: 'auto' }}
              onClick={() => setShowCancelDialog(true)}
            >
              Cancel event
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Registered Students</span>
          <span className="kpi-value">{event.registeredCount || 0}</span>
          <span className="kpi-sub">
            Capacity: {event.capacity != null ? `${event.capacity} total seats` : 'Unlimited'}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Seats Remaining</span>
          <span className="kpi-value">{seatsRemaining}</span>
          <span className="kpi-sub">
            Registration: <strong style={{ color: avail === 'Open' ? '#34d399' : '#f87171' }}>{avail}</strong>
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Event Status</span>
          <span className="kpi-value" style={{ fontSize: '1.5rem', textTransform: 'capitalize' }}>
            {event.status}
          </span>
          <span className="kpi-sub">
            {event.status === 'approved'
              ? 'Visible on public portal'
              : event.status === 'pending'
              ? 'Awaiting admin moderation'
              : event.status === 'cancelled'
              ? 'Soft-cancelled'
              : 'Rejected by admin'}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Gallery Assets</span>
          <span className="kpi-value">{event.gallery?.length || 0} / 10</span>
          <span className="kpi-sub">
            <Link to={`/organizer/events/${event.slug}/gallery`} className="text-link" style={{ fontSize: '0.8125rem' }}>
              Upload images →
            </Link>
          </span>
        </div>
      </div>

      {/* Detail Sections */}
      <div className="form-grid-2">
        {/* Timing & Schedule */}
        <div className="form-section">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Schedule & Deadlines</h2>
          <div className="stack" style={{ gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span className="muted">Event Starts:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {dateLabel(event.startAt)} at {timeLabel(event.startAt)}
              </p>
            </div>
            <div>
              <span className="muted">Event Ends:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {dateLabel(event.endAt)} at {timeLabel(event.endAt)}
              </p>
            </div>
            <div>
              <span className="muted">Registration Deadline:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {dateLabel(event.registrationDeadline)} at {timeLabel(event.registrationDeadline)}
              </p>
            </div>
          </div>
        </div>

        {/* Location & Club */}
        <div className="form-section">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Venue & Organizer</h2>
          <div className="stack" style={{ gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span className="muted">Assigned Venue:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {event.venue?.name || 'TBA'}
                {event.venue?.building && ` (${event.venue.building})`}
              </p>
              {event.venue?.capacity && (
                <p className="muted" style={{ margin: '0.15rem 0 0', fontSize: '0.8125rem' }}>
                  Venue maximum capacity: {event.venue.capacity}
                </p>
              )}
            </div>
            <div>
              <span className="muted">Organizing Club:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {event.club?.name || 'Campus Club'}
              </p>
            </div>
            {event.organizers && event.organizers.length > 0 && (
              <div>
                <span className="muted">Event Managers:</span>
                <p style={{ margin: '0.15rem 0 0' }}>
                  {event.organizers.map((o) => o.name || o).join(', ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description & Eligibility */}
      <div className="form-grid-2">
        <div className="form-section">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Description</h2>
          <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
            {event.description}
          </p>
          {event.tags && event.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
              {event.tags.map((tag) => (
                <span
                  key={tag}
                  className="badge"
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#94a3b8' }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="form-section">
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>Eligibility Rules</h2>
          <div className="stack" style={{ gap: '0.75rem', fontSize: '0.875rem' }}>
            <div>
              <span className="muted">Departments:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {event.eligibility?.departments?.length > 0
                  ? event.eligibility.departments.join(', ')
                  : 'Open to all departments'}
              </p>
            </div>
            <div>
              <span className="muted">Allowed Years:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {event.eligibility?.years?.length > 0
                  ? event.eligibility.years.map((y) => `Year ${y}`).join(', ')
                  : 'Open to all academic years'}
              </p>
            </div>
            <div>
              <span className="muted">Minimum CGPA:</span>
              <p style={{ margin: '0.15rem 0 0', fontWeight: 600 }}>
                {event.eligibility?.minCgpa != null && event.eligibility.minCgpa > 0
                  ? event.eligibility.minCgpa.toFixed(1)
                  : 'No minimum requirement'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery preview strip */}
      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
            Gallery Photos ({event.gallery?.length || 0}/10)
          </h2>
          <Link to={`/organizer/events/${event.slug}/gallery`} className="text-link" style={{ fontSize: '0.875rem' }}>
            Manage gallery →
          </Link>
        </div>

        {event.gallery?.length > 0 ? (
          <div className="gallery-grid" style={{ marginTop: '0.5rem' }}>
            {event.gallery.map((img, idx) => (
              <div key={img._id || idx} className="gallery-thumbnail">
                <img src={img.url} alt={img.caption || `Event gallery ${idx + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
            No gallery images uploaded yet. You can upload up to 10 photos to showcase event highlights.
          </p>
        )}
      </div>

      {/* Cancellation Dialog */}
      {showCancelDialog && (
        <CancelEventDialog
          event={event}
          onConfirm={() => cancelMutation.mutateAsync({ id: event._id })}
          onClose={() => setShowCancelDialog(false)}
        />
      )}
    </div>
  );
}
