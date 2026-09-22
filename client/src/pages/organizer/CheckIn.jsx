import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { detailRequest, eventParticipantsRequest } from '../../api/client';
import { dateLabel, timeLabel } from '../../lib/events';
import { Skeleton, ErrorState } from '../../components/ui';

export default function CheckIn() {
  const { slug } = useParams();
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch event
  const eventQuery = useQuery({
    queryKey: ['event', slug],
    queryFn: ({ signal }) => detailRequest(slug, signal),
  });

  const event = eventQuery.data?.data?.event;
  const eventId = event?._id;

  // 2. Fetch all registered participants (limit 100 for check-in desk)
  const participantsQuery = useQuery({
    queryKey: ['organizer', 'check-in', eventId],
    queryFn: ({ signal }) =>
      eventParticipantsRequest(
        eventId,
        {
          page: 1,
          limit: 100,
          status: 'registered',
        },
        signal
      ),
    enabled: Boolean(eventId),
    staleTime: 15_000,
  });

  const participants = participantsQuery.data?.data || [];

  const checkedInCount = participants.filter((p) => Boolean(p.attendedAt)).length;
  const pendingCount = participants.length - checkedInCount;

  const filtered = participants.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const name = p.student?.name?.toLowerCase() || '';
    const email = p.student?.email?.toLowerCase() || '';
    const rollNo = p.student?.profile?.rollNo?.toLowerCase() || '';
    const dept = p.student?.profile?.department?.toLowerCase() || '';
    return name.includes(q) || email.includes(q) || rollNo.includes(q) || dept.includes(q);
  });

  if (eventQuery.isPending) {
    return <Skeleton count={3} />;
  }

  if (eventQuery.isError) {
    return <ErrorState title="We couldn’t load this event." error={eventQuery.error} retry={eventQuery.refetch} />;
  }

  if (!event) {
    return (
      <div className="empty-state">
        <h2>Event not found</h2>
        <Link className="button" to="/organizer/events">
          Back to managed events
        </Link>
      </div>
    );
  }

  return (
    <div className="stack" style={{ gap: '1.5rem' }}>
      {/* Back link */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/organizer/events/${event.slug}`} className="text-link" style={{ fontSize: '0.875rem' }}>
          ← Back to {event.title}
        </Link>
        <Link to={`/organizer/events/${event.slug}/participants`} className="text-link" style={{ fontSize: '0.875rem' }}>
          View full participants roster →
        </Link>
      </div>

      {/* Header & KPI Summary */}
      <div className="form-section">
        <div>
          <p className="eyebrow" style={{ margin: 0 }}>EVENT RECEPTION DESK</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0' }}>
            Check-In Roster: {event.title}
          </h1>
          <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
            Venue: <strong>{event.venue?.name || 'TBA'}</strong> · Schedule:{' '}
            <strong>{dateLabel(event.startAt)} at {timeLabel(event.startAt)}</strong>
          </p>
        </div>

        {/* Contract Gap Notice Banner */}
        <div
          role="note"
          aria-label="API Contract Notice"
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '8px',
            padding: '0.875rem 1rem',
            fontSize: '0.8125rem',
            color: '#93c5fd',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ display: 'block', marginBottom: '0.25rem', color: '#bfdbfe' }}>
            ℹ️ Backend Contract Notice: Read-Only Attendance Roster
          </strong>
          The current campus backend API supports participant querying and CSV exports, but does not provide a check-in mutation endpoint to mark student attendance (<code>attendedAt</code>). Attendance indicators displayed below reflect live database records.
        </div>

        {/* Counters */}
        <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', marginTop: '0.5rem' }}>
          <div className="kpi-card" style={{ padding: '0.875rem 1rem' }}>
            <span className="kpi-label">Registered</span>
            <span className="kpi-value" style={{ fontSize: '1.5rem' }}>{participants.length}</span>
          </div>
          <div className="kpi-card" style={{ padding: '0.875rem 1rem' }}>
            <span className="kpi-label">Checked-In</span>
            <span className="kpi-value" style={{ fontSize: '1.5rem', color: '#34d399' }}>{checkedInCount}</span>
          </div>
          <div className="kpi-card" style={{ padding: '0.875rem 1rem' }}>
            <span className="kpi-label">Awaiting Arrival</span>
            <span className="kpi-value" style={{ fontSize: '1.5rem', color: '#fbbf24' }}>{pendingCount}</span>
          </div>
        </div>

        {/* Quick Search */}
        <div style={{ marginTop: '0.5rem' }}>
          <input
            type="search"
            aria-label="Quick search attendee"
            placeholder="Quick search by student name, roll number, or department…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field"
            style={{ fontSize: '1rem', padding: '0.625rem 1rem' }}
            autoFocus
          />
        </div>
      </div>

      {/* Roster List */}
      {participantsQuery.isPending ? (
        <Skeleton count={4} />
      ) : participantsQuery.isError ? (
        <ErrorState
          title="We couldn’t load the check-in roster."
          error={participantsQuery.error}
          retry={participantsQuery.refetch}
        />
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No matching registered students</h2>
          <p>
            {searchTerm
              ? `No registered attendees match "${searchTerm}".`
              : 'There are currently no registered participants for this event.'}
          </p>
          {searchTerm && (
            <button type="button" className="button button-secondary" onClick={() => setSearchTerm('')}>
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="op-table">
            <thead>
              <tr>
                <th>Attendee</th>
                <th>Roll Number</th>
                <th className="responsive-table-hide">Academic Profile</th>
                <th>Status</th>
                <th>Attendance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg) => {
                const student = reg.student || {};
                const profile = student.profile || {};
                const isAttended = Boolean(reg.attendedAt);

                return (
                  <tr key={reg._id}>
                    <td>
                      <strong style={{ color: '#f8fafc', fontSize: '0.9375rem' }}>
                        {student.name || 'Student'}
                      </strong>
                      <div className="muted" style={{ fontSize: '0.8125rem' }}>
                        {student.email || '—'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {profile.rollNo || '—'}
                      </span>
                    </td>
                    <td className="responsive-table-hide">
                      <span>{profile.department || '—'}</span>
                      {profile.year && <span className="muted"> (Year {profile.year})</span>}
                    </td>
                    <td>
                      <span className="badge badge-approved" style={{ fontSize: '0.7rem' }}>
                        {reg.status}
                      </span>
                    </td>
                    <td>
                      {isAttended ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#34d399' }}>
                          <span aria-hidden="true">✓</span>
                          <strong>Checked In</strong>
                          <span className="muted" style={{ fontSize: '0.75rem' }}>
                            ({dateLabel(reg.attendedAt)})
                          </span>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8' }}>
                          <span style={{ opacity: 0.5 }}>○</span>
                          <span>Pending check-in</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
