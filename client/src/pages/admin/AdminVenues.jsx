import { useQuery } from '@tanstack/react-query';
import { eventsRequest } from '../../api/client';
import { CONTRACT_GAPS } from '../../lib/admin';
import { SEEDED_VENUES } from '../../lib/organizer';

export default function AdminVenues() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'venues-events'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
  });

  const events = Array.isArray(data?.data) ? data.data : (data?.data?.events || []);

  // Group events by venue
  const venueMap = new Map();

  // Initialize with seeded venues
  for (const v of SEEDED_VENUES) {
    venueMap.set(v.name, {
      name: v.name,
      building: v.building,
      capacity: v.capacity,
      eventsCount: 0,
    });
  }

  // Count events for each venue
  for (const ev of events) {
    if (ev.venue?.name) {
      const existing = venueMap.get(ev.venue.name) || {
        name: ev.venue.name,
        building: ev.venue.building || 'Campus Facilities',
        capacity: ev.venue.capacity || 100,
        eventsCount: 0,
      };
      existing.eventsCount++;
      venueMap.set(ev.venue.name, existing);
    }
  }

  const venues = Array.from(venueMap.values());

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Contract Notice */}
      <section className="contract-notice" role="region" aria-label="Contract disclosure">
        <div className="contract-notice-title">
          <span>⚠️</span>
          <span>{CONTRACT_GAPS.VENUE_MANAGEMENT.title}</span>
        </div>
        <p className="contract-notice-text">
          {CONTRACT_GAPS.VENUE_MANAGEMENT.description}
        </p>
      </section>

      {/* Venues Catalog */}
      <section className="panel stack" style={{ gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Campus Venues & Facilities Directory
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Registered presentation halls, auditoriums, and event grounds ({venues.length} locations)
          </p>
        </div>

        {isLoading ? (
          <p className="muted">Loading facility usage…</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Facility Name</th>
                  <th>Campus Building</th>
                  <th>Standard Seating Capacity</th>
                  <th>Events Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {venues.map((venue) => (
                  <tr key={venue.name}>
                    <td>
                      <strong style={{ color: '#f8fafc' }}>{venue.name}</strong>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {venue.building}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {venue.capacity} seats
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: venue.eventsCount > 0 ? '#38bdf8' : '#94a3b8' }}>
                        {venue.eventsCount} event{venue.eventsCount === 1 ? '' : 's'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
