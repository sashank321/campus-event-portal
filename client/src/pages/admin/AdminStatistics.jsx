import { useQuery } from '@tanstack/react-query';
import { eventsRequest } from '../../api/client';
import { computePlatformKPIs, CONTRACT_GAPS } from '../../lib/admin';
import { categories } from '../../lib/events';
import { DEPARTMENTS } from '../../lib/organizer';

export default function AdminStatistics() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin', 'statistics-events'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
  });

  const events = Array.isArray(data?.data) ? data.data : (data?.data?.events || []);
  const kpis = computePlatformKPIs(events);

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Contract Notice */}
      <section className="contract-notice" role="region" aria-label="Contract disclosure">
        <div className="contract-notice-title">
          <span>⚠️</span>
          <span>{CONTRACT_GAPS.AGGREGATE_STATS.title}</span>
        </div>
        <p className="contract-notice-text">
          {CONTRACT_GAPS.AGGREGATE_STATS.description}
        </p>
      </section>

      {/* Primary KPI Overview */}
      <section aria-labelledby="stats-kpi-heading">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 id="stats-kpi-heading" style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              Platform Utilization Summary
            </h2>
            <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
              Aggregated across {events.length} active platform events
            </p>
          </div>
          <button
            type="button"
            className="button button-small button-secondary"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Updating…' : 'Refresh Data'}
          </button>
        </div>

        {error ? (
          <div className="notice" role="alert">
            Unable to compute platform metrics. <button className="text-button" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-label">Active Approved Events</span>
              <span className="kpi-value">{isLoading ? '…' : kpis.totalEvents}</span>
              <span className="kpi-hint">Discoverable by students</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Total Registrations</span>
              <span className="kpi-value">{isLoading ? '…' : kpis.totalRegistered}</span>
              <span className="kpi-hint">Confirmed attendee reservations</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Platform Seat Capacity</span>
              <span className="kpi-value">{isLoading ? '…' : kpis.totalCapacity}</span>
              <span className="kpi-hint">Across capped event venues</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-label">Capacity Utilization</span>
              <span className="kpi-value">{isLoading ? '…' : `${kpis.fillRatePercent}%`}</span>
              <span className="kpi-hint">Seat fill percentage</span>
            </div>
          </div>
        )}
      </section>

      {/* Visual Distributions Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Category Breakdown */}
        <section className="panel stack" style={{ gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
              Events by Category
            </h3>
            <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
              Distribution across event genres
            </p>
          </div>

          <div>
            {categories.map((cat) => {
              const count = kpis.categoryCounts[cat] || 0;
              const pct = kpis.totalEvents > 0 ? Math.round((count / kpis.totalEvents) * 100) : 0;
              return (
                <div key={cat} className="bar-row">
                  <div className="bar-label" style={{ textTransform: 'capitalize' }}>
                    {cat}
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: '#38bdf8' }} />
                  </div>
                  <div className="bar-count">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Department Eligibility Breakdown */}
        <section className="panel stack" style={{ gap: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
              Events by Academic Department
            </h3>
            <p className="muted" style={{ fontSize: '0.8125rem', margin: 0 }}>
              Targeted departmental eligibility
            </p>
          </div>

          <div>
            {DEPARTMENTS.map((dept) => {
              const count = kpis.departmentCounts[dept] || 0;
              const pct = kpis.totalEvents > 0 ? Math.round((count / kpis.totalEvents) * 100) : 0;
              return (
                <div key={dept} className="bar-row">
                  <div className="bar-label">
                    {dept === 'all' ? 'All Departments' : dept}
                  </div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${pct}%`, background: '#10b981' }} />
                  </div>
                  <div className="bar-count">
                    {count}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
