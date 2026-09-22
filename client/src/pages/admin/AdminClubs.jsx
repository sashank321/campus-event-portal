import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventsRequest } from '../../api/client';
import { CONTRACT_GAPS } from '../../lib/admin';
import { SEEDED_CLUBS } from '../../lib/organizer';

export default function AdminClubs() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'clubs-events'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
  });

  const events = Array.isArray(data?.data) ? data.data : (data?.data?.events || []);

  // Group events by club
  const clubMap = new Map();

  // Initialize with seeded clubs
  for (const c of SEEDED_CLUBS) {
    clubMap.set(c.slug, {
      name: c.name,
      slug: c.slug,
      eventsCount: 0,
      description: 'Official recognized campus organization.',
    });
  }

  // Count events for each club
  for (const ev of events) {
    if (ev.club?.slug) {
      const existing = clubMap.get(ev.club.slug) || {
        name: ev.club.name || ev.club.slug,
        slug: ev.club.slug,
        eventsCount: 0,
        description: 'Recognized campus student organization.',
      };
      existing.eventsCount++;
      clubMap.set(ev.club.slug, existing);
    }
  }

  const clubs = Array.from(clubMap.values());

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Contract Notice */}
      <section className="contract-notice" role="region" aria-label="Contract disclosure">
        <div className="contract-notice-title">
          <span>⚠️</span>
          <span>{CONTRACT_GAPS.CLUB_MANAGEMENT.title}</span>
        </div>
        <p className="contract-notice-text">
          {CONTRACT_GAPS.CLUB_MANAGEMENT.description}
        </p>
      </section>

      {/* Clubs Catalog */}
      <section className="panel stack" style={{ gap: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
              Recognized Campus Student Organizations
            </h2>
            <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
              Clubs hosting events across the campus portal ({clubs.length} registered)
            </p>
          </div>
          <Link to="/clubs" className="button button-small button-secondary" target="_blank" rel="noopener noreferrer">
            Public Directory ↗
          </Link>
        </div>

        {isLoading ? (
          <p className="muted">Analyzing club activities…</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Club Name & Slug</th>
                  <th>Description</th>
                  <th>Active Events</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((club) => (
                  <tr key={club.slug}>
                    <td>
                      <strong style={{ color: '#f8fafc', display: 'block' }}>{club.name}</strong>
                      <span className="muted" style={{ fontSize: '0.75rem' }}>/{club.slug}</span>
                    </td>
                    <td style={{ color: '#cbd5e1' }}>
                      {club.description}
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: club.eventsCount > 0 ? '#38bdf8' : '#94a3b8' }}>
                        {club.eventsCount} event{club.eventsCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/clubs/${encodeURIComponent(club.slug)}`}
                        className="button button-small button-secondary"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Public Profile ↗
                      </Link>
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
