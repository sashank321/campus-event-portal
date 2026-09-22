import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { detailRequest, eventParticipantsRequest } from '../../api/client';
import { dateLabel, timeLabel } from '../../lib/events';
import { Skeleton, ErrorState, Pagination } from '../../components/ui';

export default function Participants() {
  const { slug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState('');
  const [downloadingCsv, setDownloadingCsv] = useState(false);
  const [csvError, setCsvError] = useState(null);

  const page = parseInt(searchParams.get('page') || '1', 10);
  const status = searchParams.get('status') || 'registered';

  // 1. Fetch event to resolve event._id
  const eventQuery = useQuery({
    queryKey: ['event', slug],
    queryFn: ({ signal }) => detailRequest(slug, signal),
  });

  const event = eventQuery.data?.data?.event;
  const eventId = event?._id;

  // 2. Fetch participants for this event
  const participantsQuery = useQuery({
    queryKey: ['organizer', 'participants', eventId, page, status],
    queryFn: ({ signal }) =>
      eventParticipantsRequest(
        eventId,
        {
          page,
          limit: 20,
          status,
        },
        signal
      ),
    enabled: Boolean(eventId),
    staleTime: 30_000,
  });

  const items = participantsQuery.data?.data || [];
  const meta = participantsQuery.data?.meta;

  function updateSearch(values) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(values).forEach(([k, v]) => {
        if (v === undefined || v === null || v === '') next.delete(k);
        else next.set(k, String(v));
      });
      return next;
    });
  }

  // Handle authenticated CSV export
  async function handleDownloadCsv() {
    if (!eventId) return;
    setDownloadingCsv(true);
    setCsvError(null);
    try {
      const res = await fetch(
        `/api/v1/events/${encodeURIComponent(eventId)}/participants?format=csv&status=${encodeURIComponent(status)}`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        throw new Error(`Failed to download CSV (${res.status})`);
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `participants-${slug || eventId}-${status}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setCsvError(err.message || 'Failed to export CSV. Please try again.');
    } finally {
      setDownloadingCsv(false);
    }
  }

  // Client-side quick filter
  const filteredItems = items.filter((row) => {
    if (!localSearch.trim()) return true;
    const q = localSearch.toLowerCase();
    const name = row.student?.name?.toLowerCase() || '';
    const email = row.student?.email?.toLowerCase() || '';
    const rollNo = row.student?.profile?.rollNo?.toLowerCase() || '';
    const dept = row.student?.profile?.department?.toLowerCase() || '';
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
      {/* Header breadcrumb and actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <Link to={`/organizer/events/${event.slug}`} className="text-link" style={{ fontSize: '0.875rem' }}>
          ← Back to {event.title}
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link className="button button-small button-secondary" to={`/organizer/events/${event.slug}/check-in`}>
            Check-In Roster →
          </Link>
        </div>
      </div>

      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <p className="eyebrow" style={{ margin: 0 }}>PARTICIPANT ROSTER</p>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.25rem 0' }}>
              {event.title}
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: '0.875rem' }}>
              Capacity: <strong>{event.registeredCount || 0}</strong> /{' '}
              {event.capacity != null ? `${event.capacity} seats` : '∞'} · Total Roster Records:{' '}
              <strong>{meta?.total != null ? meta.total : items.length}</strong>
            </p>
          </div>

          <button
            type="button"
            className="button button-small"
            onClick={handleDownloadCsv}
            disabled={downloadingCsv || items.length === 0}
            title="Download CSV export"
          >
            {downloadingCsv ? 'Preparing CSV…' : '↓ Export CSV'}
          </button>
        </div>

        {csvError && (
          <p className="field-error" style={{ margin: '0.5rem 0 0' }}>
            {csvError}
          </p>
        )}

        {/* Filter Tabs & Local Search */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
            paddingTop: '1rem',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['registered', 'cancelled', 'waitlisted'].map((st) => (
              <button
                key={st}
                type="button"
                className={`filter-chip ${status === st ? 'active' : ''}`}
                onClick={() => updateSearch({ status: st, page: 1 })}
                style={{ textTransform: 'capitalize' }}
              >
                {st}
              </button>
            ))}
          </div>

          <div style={{ width: '100%', maxWidth: '320px' }}>
            <input
              type="search"
              aria-label="Search participants"
              placeholder="Filter by name, email, roll no…"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="input-field"
              style={{ padding: '0.45rem 0.75rem', fontSize: '0.875rem' }}
            />
          </div>
        </div>
      </div>

      {/* Participants Table */}
      {participantsQuery.isPending ? (
        <Skeleton count={4} />
      ) : participantsQuery.isError ? (
        <ErrorState
          title="We couldn’t load the participants list."
          error={participantsQuery.error}
          retry={participantsQuery.refetch}
        />
      ) : filteredItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-orbit" aria-hidden="true">✳</div>
          <h2>No participants found</h2>
          <p>
            {localSearch
              ? 'No records match your search filter.'
              : `There are currently no students with status "${status}".`}
          </p>
          {localSearch && (
            <button type="button" className="button button-secondary" onClick={() => setLocalSearch('')}>
              Clear search filter
            </button>
          )}
        </div>
      ) : (
        <div className="stack" style={{ gap: '1rem' }}>
          <div className="table-wrapper">
            <table className="op-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll No</th>
                  <th className="responsive-table-hide">Department & Year</th>
                  <th>Status</th>
                  <th className="responsive-table-hide">Registered</th>
                  <th>Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((reg) => {
                  const student = reg.student || {};
                  const profile = student.profile || {};
                  const isAttended = Boolean(reg.attendedAt);

                  return (
                    <tr key={reg._id}>
                      <td>
                        <strong style={{ color: '#f8fafc', display: 'block' }}>{student.name || 'Student'}</strong>
                        <span className="muted" style={{ fontSize: '0.8125rem' }}>{student.email || '—'}</span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {profile.rollNo || '—'}
                        </span>
                      </td>
                      <td className="responsive-table-hide">
                        {profile.department || '—'}{profile.year ? ` · Year ${profile.year}` : ''}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            reg.status === 'registered'
                              ? 'badge-approved'
                              : reg.status === 'waitlisted'
                              ? 'badge-pending'
                              : 'badge-cancelled'
                          }`}
                        >
                          {reg.status}
                        </span>
                      </td>
                      <td className="responsive-table-hide" style={{ fontSize: '0.8125rem' }}>
                        {reg.registeredAt ? (
                          <>
                            {dateLabel(reg.registeredAt)}<br />
                            <span className="muted">{timeLabel(reg.registeredAt)}</span>
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        {isAttended ? (
                          <span style={{ color: '#34d399', fontWeight: 600, fontSize: '0.8125rem' }}>
                            ✓ Attended<br />
                            <span className="muted" style={{ fontWeight: 400 }}>
                              {dateLabel(reg.attendedAt)}
                            </span>
                          </span>
                        ) : (
                          <span className="muted" style={{ fontSize: '0.8125rem' }}>
                            Not checked in
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination meta={meta} onPage={(p) => updateSearch({ page: p })} />
        </div>
      )}
    </div>
  );
}
