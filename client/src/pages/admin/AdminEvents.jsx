import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { eventsRequest } from '../../api/client';
import { adminStatusBadge, CONTRACT_GAPS } from '../../lib/admin';
import { dateLabel, categories, seats } from '../../lib/events';
import { DEPARTMENTS } from '../../lib/organizer';

export default function AdminEvents() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const department = searchParams.get('department') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 15;

  const [jumpInput, setJumpInput] = useState('');
  const [jumpError, setJumpError] = useState('');

  const queryParams = {
    page: String(page),
    limit: String(limit),
  };
  if (search) queryParams.search = search;
  if (category) queryParams.category = category;
  if (department) queryParams.department = department;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'events-catalog', queryParams],
    queryFn: ({ signal }) => eventsRequest(queryParams, signal),
    keepPreviousData: true,
  });

  const events = Array.isArray(data?.data) ? data.data : (data?.data?.events || []);
  const pagination = data?.meta || data?.data?.pagination || { page: 1, pages: 1, total: events.length };
  const totalPages = pagination.totalPages || pagination.pages || 1;
  const totalCount = pagination.total != null ? pagination.total : events.length;

  const handleJump = (e) => {
    e.preventDefault();
    const clean = jumpInput.trim();
    if (!clean) {
      setJumpError('Please enter an event slug or ID');
      return;
    }
    setJumpError('');
    navigate(`/admin/events/${encodeURIComponent(clean)}`);
  };

  const updateParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set(key, val);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Moderation Review Jumper */}
      <section className="review-jumper" aria-labelledby="direct-moderation-title">
        <div>
          <h2 id="direct-moderation-title" style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Direct Event Moderation & Review Jumper
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Review pending submissions, approve/reject proposals, or soft-cancel any event by entering its slug or ID.
          </p>
        </div>
        <form onSubmit={handleJump} className="review-jumper-form">
          <input
            type="text"
            className="review-jumper-input"
            placeholder="Enter event slug or MongoDB ObjectId (e.g. hackathon-2026)..."
            value={jumpInput}
            onChange={(e) => {
              setJumpInput(e.target.value);
              if (jumpError) setJumpError('');
            }}
            aria-label="Direct event slug or ID"
          />
          <button type="submit" className="button button-small">
            Load Submission ↗
          </button>
        </form>
        {jumpError && <p className="form-error" role="alert">{jumpError}</p>}
      </section>

      {/* Backend Contract Notice */}
      <section className="contract-notice" role="region" aria-label="Backend contract disclosure">
        <div className="contract-notice-title">
          <span>⚠️</span>
          <span>{CONTRACT_GAPS.PENDING_EVENTS_LIST.title}</span>
        </div>
        <p className="contract-notice-text">
          {CONTRACT_GAPS.PENDING_EVENTS_LIST.description}
        </p>
      </section>

      {/* Filters & Search Controls */}
      <section className="panel" aria-label="Search and filter controls">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <label htmlFor="admin-events-search" className="sr-only">Search events</label>
            <input
              id="admin-events-search"
              type="search"
              className="review-jumper-input"
              style={{ width: '100%' }}
              placeholder="Search by title, description, or tags…"
              value={search}
              onChange={(e) => updateParam('search', e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <label htmlFor="admin-category-select" className="sr-only">Filter by category</label>
            <select
              id="admin-category-select"
              className="review-jumper-input"
              value={category}
              onChange={(e) => updateParam('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <label htmlFor="admin-department-select" className="sr-only">Filter by department</label>
            <select
              id="admin-department-select"
              className="review-jumper-input"
              value={department}
              onChange={(e) => updateParam('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.filter(d => d !== 'all').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {(search || category || department) && (
            <button
              type="button"
              className="button button-small button-secondary"
              onClick={() => setSearchParams({ page: '1' })}
            >
              Clear Filters
            </button>
          )}
        </div>
      </section>

      {/* Events Table */}
      <section aria-labelledby="catalog-table-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 id="catalog-table-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              Campus Events Catalog
            </h2>
            <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Showing {events.length} of {totalCount} registered platform events
            </p>
          </div>
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Updating…' : 'Refresh'}
          </button>
        </div>

        {isLoading ? (
          <p className="muted">Loading event catalog…</p>
        ) : error ? (
          <div className="notice" role="alert">
            Unable to load event records. <button className="text-button" onClick={() => refetch()}>Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div className="panel" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="muted" style={{ margin: 0 }}>No events matched your search filters.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event Title & Slug</th>
                  <th>Category</th>
                  <th>Club</th>
                  <th>Venue</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Registrations</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => {
                  const badge = adminStatusBadge(event.status);
                  const remaining = seats(event);
                  return (
                    <tr key={event._id || event.slug}>
                      <td>
                        <strong style={{ color: '#f8fafc', display: 'block' }}>{event.title}</strong>
                        <span className="muted" style={{ fontSize: '0.75rem' }}>/{event.slug}</span>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>{event.category}</span>
                      </td>
                      <td>{event.club?.name || 'Campus Wide'}</td>
                      <td>{event.venue?.name || 'TBA'}</td>
                      <td>{dateLabel(event.startAt)}</td>
                      <td>
                        <span className={badge.className}>{badge.label}</span>
                      </td>
                      <td>
                        {event.registeredCount || 0}
                        {event.capacity != null ? ` / ${event.capacity}` : ' (unlimited)'}
                        {remaining != null && remaining <= 5 && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: '#f59e0b' }}>
                            {remaining === 0 ? 'Full' : `${remaining} seats left`}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <Link
                            to={`/admin/events/${encodeURIComponent(event.slug)}`}
                            className="button button-small"
                          >
                            Review
                          </Link>
                          <Link
                            to={`/admin/registrations?event=${encodeURIComponent(event._id)}`}
                            className="button button-small button-secondary"
                            title="View attendee roster"
                          >
                            Roster
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="button button-small button-secondary"
              disabled={page <= 1}
              onClick={() => updateParam('page', String(page - 1))}
            >
              ← Previous
            </button>
            <span className="muted" style={{ fontSize: '0.875rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              className="button button-small button-secondary"
              disabled={page >= totalPages}
              onClick={() => updateParam('page', String(page + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
