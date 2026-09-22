import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { eventsRequest, eventParticipantsRequest, cancelRegistrationRequest } from '../../api/client';
import { registrationStatusBadge, adminErrorText, confirmCancelRegistrationText, CONTRACT_GAPS } from '../../lib/admin';
import { dateLabel, timeLabel } from '../../lib/events';
import { Sheet } from '../../components/ui';

export default function AdminRegistrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const selectedEventParam = searchParams.get('event') || '';
  const [selectedEventId, setSelectedEventId] = useState(selectedEventParam);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null); // participant object to cancel
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Sync state if URL searchParam changes
  useEffect(() => {
    if (selectedEventParam && selectedEventParam !== selectedEventId) {
      setSelectedEventId(selectedEventParam);
    }
  }, [selectedEventParam]);

  // Load events for dropdown
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'registration-events-selector'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
  });

  const events = Array.isArray(eventsData?.data) ? eventsData.data : (eventsData?.data?.events || []);

  // Default to first event if none selected
  useEffect(() => {
    if (!selectedEventId && events.length > 0) {
      setSelectedEventId(events[0]._id);
    }
  }, [events, selectedEventId]);

  const selectedEvent = events.find((e) => e._id === selectedEventId);

  // Load participants for chosen event
  const {
    data: participantsData,
    isLoading: participantsLoading,
    error: participantsError,
    refetch: refetchParticipants,
  } = useQuery({
    queryKey: ['admin', 'event-participants', selectedEventId, statusFilter, searchTerm],
    queryFn: ({ signal }) => {
      const p = {};
      if (statusFilter) p.status = statusFilter;
      if (searchTerm) p.search = searchTerm;
      return eventParticipantsRequest(selectedEventId, p, signal);
    },
    enabled: Boolean(selectedEventId),
  });

  const participants = Array.isArray(participantsData?.data)
    ? participantsData.data
    : (participantsData?.data?.participants || []);
  const totalCount = participantsData?.meta?.total ?? participantsData?.data?.total ?? participants.length;

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (registrationId) => cancelRegistrationRequest(registrationId),
    onSuccess: () => {
      setCancelTarget(null);
      setActionError('');
      setActionSuccess('Registration cancelled successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'event-participants'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'events-catalog'] });
      refetchParticipants();
    },
    onError: (err) => {
      setActionError(adminErrorText(err));
      setCancelTarget(null);
    },
  });

  const handleSelectEvent = (id) => {
    setSelectedEventId(id);
    const next = new URLSearchParams(searchParams);
    next.set('event', id);
    setSearchParams(next);
  };

  const downloadCSV = () => {
    if (!participants.length) return;
    const headers = ['Registration ID', 'Student Name', 'Email', 'Department', 'Year', 'Status', 'Registered At'];
    const rows = participants.map((p) => {
      const s = p.student || p.user;
      return [
        p._id || '',
        `"${(s?.name || '').replace(/"/g, '""')}"`,
        `"${(s?.email || '').replace(/"/g, '""')}"`,
        s?.studentProfile?.department || '',
        s?.studentProfile?.year || '',
        p.status || '',
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roster-${selectedEvent?.slug || 'event'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Contract Notice */}
      <section className="contract-notice" role="region" aria-label="Contract disclosure">
        <div className="contract-notice-title">
          <span>⚠️</span>
          <span>{CONTRACT_GAPS.GLOBAL_REGISTRATIONS.title}</span>
        </div>
        <p className="contract-notice-text">
          {CONTRACT_GAPS.GLOBAL_REGISTRATIONS.description}
        </p>
      </section>

      {/* Event Selector & Controls */}
      <section className="panel stack" style={{ gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Event Attendee Roster Inspector
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Inspect registrations, filter by status, export participant CSVs, and moderate individual bookings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <label htmlFor="select-roster-event" className="sr-only">Select Event</label>
            <select
              id="select-roster-event"
              className="review-jumper-input"
              style={{ width: '100%' }}
              value={selectedEventId}
              onChange={(e) => handleSelectEvent(e.target.value)}
              disabled={eventsLoading}
            >
              {eventsLoading ? (
                <option>Loading events…</option>
              ) : events.length === 0 ? (
                <option>No events available</option>
              ) : (
                events.map((ev) => (
                  <option key={ev._id} value={ev._id}>
                    {ev.title} ({ev.registeredCount || 0} registered)
                  </option>
                ))
              )}
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <label htmlFor="select-status-filter" className="sr-only">Status</label>
            <select
              id="select-status-filter"
              className="review-jumper-input"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="registered">Registered</option>
              <option value="waitlisted">Waitlisted</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ minWidth: '180px' }}>
            <label htmlFor="search-participants" className="sr-only">Search</label>
            <input
              id="search-participants"
              type="search"
              className="review-jumper-input"
              placeholder="Search name or email…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="button button-small button-secondary"
            onClick={downloadCSV}
            disabled={!participants.length}
          >
            Export CSV ↓
          </button>
        </div>
      </section>

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

      {/* Participants Table */}
      <section aria-labelledby="attendees-table-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 id="attendees-table-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              {selectedEvent ? selectedEvent.title : 'Attendee Roster'}
            </h2>
            <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Showing {participants.length} of {totalCount} attendees
            </p>
          </div>
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={() => refetchParticipants()}
            disabled={participantsLoading}
          >
            {participantsLoading ? 'Refreshing…' : 'Refresh Roster'}
          </button>
        </div>

        {participantsLoading ? (
          <p className="muted">Loading participant roster…</p>
        ) : participantsError ? (
          <div className="notice" role="alert">
            {adminErrorText(participantsError)} <button className="text-button" onClick={() => refetchParticipants()}>Retry</button>
          </div>
        ) : participants.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="muted" style={{ margin: 0 }}>No participants found matching the criteria.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Institutional Email</th>
                  <th>Department & Year</th>
                  <th>Registration Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {participants.map((p) => {
                  const student = p.student || p.user;
                  const badge = registrationStatusBadge(p.status);
                  const isRegistered = p.status === 'registered';
                  return (
                    <tr key={p._id}>
                      <td>
                        <strong style={{ color: '#f8fafc' }}>{student?.name || 'Student'}</strong>
                      </td>
                      <td>
                        <code>{student?.email || '—'}</code>
                      </td>
                      <td>
                        {student?.studentProfile?.department || '—'}
                        {student?.studentProfile?.year ? ` (Yr ${student.studentProfile.year})` : ''}
                      </td>
                      <td>
                        {dateLabel(p.createdAt)} <span className="muted" style={{ fontSize: '0.75rem' }}>{timeLabel(p.createdAt)}</span>
                      </td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isRegistered && (
                          <button
                            type="button"
                            className="btn-cancel-admin"
                            style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                            onClick={() => setCancelTarget(p)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Cancel Registration Confirmation Sheet */}
      <Sheet
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel Student Registration"
      >
        <div className="stack" style={{ gap: '1.25rem' }}>
          <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.5 }}>
            {cancelTarget && confirmCancelRegistrationText(cancelTarget.user?.name, selectedEvent?.title)}
          </p>

          <div className="heading-actions" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="button button-secondary"
              disabled={cancelMutation.isLoading}
              onClick={() => setCancelTarget(null)}
            >
              Keep Registration
            </button>
            <button
              type="button"
              className="btn-reject"
              disabled={cancelMutation.isLoading}
              onClick={() => cancelMutation.mutate(cancelTarget._id)}
            >
              {cancelMutation.isLoading ? 'Cancelling…' : 'Confirm Cancellation'}
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
