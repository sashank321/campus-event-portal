import { useAuth } from '../../features/auth/AuthContext';
import { CAMPUS_ROLES, CONTRACT_GAPS } from '../../lib/admin';

export default function AdminUsers() {
  const auth = useAuth();
  const user = auth.user;

  return (
    <div className="stack" style={{ gap: '2rem' }}>
      {/* Backend Contract Disclosure Banner */}
      <section className="contract-notice" role="region" aria-label="Contract disclosure">
        <div className="contract-notice-title">
          <span>⚠️</span>
          <span>{CONTRACT_GAPS.USER_MANAGEMENT.title}</span>
        </div>
        <p className="contract-notice-text">
          {CONTRACT_GAPS.USER_MANAGEMENT.description}
        </p>
      </section>

      {/* Current Active Administrator Session */}
      <section className="panel stack" style={{ gap: '1.25rem' }}>
        <div>
          <p className="eyebrow" style={{ color: '#38bdf8' }}>ACTIVE SESSION</p>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0.25rem 0' }}>
            Current Administrator Profile
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Verified administrative credentials active in this session
          </p>
        </div>

        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Full Name</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
              {user?.name || 'Administrator'}
            </span>
            <span className="kpi-hint">ID: {user?.id || '—'}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Institutional Email</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#f8fafc' }}>
              {user?.email || '—'}
            </span>
            <span className="kpi-hint">Single Sign-On / Campus Directory</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Assigned Role</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: '#38bdf8', textTransform: 'uppercase' }}>
              {user?.role || 'admin'}
            </span>
            <span className="kpi-hint">Full executive control</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Account Status</span>
            <span style={{ fontSize: '1.25rem', fontWeight: 600, color: user?.isActive !== false ? '#10b981' : '#ef4444' }}>
              {user?.isActive !== false ? 'Active' : 'Suspended'}
            </span>
            <span className="kpi-hint">Operational privileges active</span>
          </div>
        </div>
      </section>

      {/* Campus Roles Taxonomy */}
      <section className="panel stack" style={{ gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Campus Portal Role Taxonomy
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Authorization tiers defined in the core authentication service
          </p>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Role Tier</th>
                <th>Designation</th>
                <th>System Privileges & Boundaries</th>
              </tr>
            </thead>
            <tbody>
              {CAMPUS_ROLES.map((r) => (
                <tr key={r.role}>
                  <td>
                    <code style={{ color: '#38bdf8', fontWeight: 600 }}>{r.role}</code>
                  </td>
                  <td>
                    <strong>{r.title}</strong>
                  </td>
                  <td style={{ color: '#cbd5e1' }}>
                    {r.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Seeded Campus Credentials Reference */}
      <section className="panel stack" style={{ gap: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.25rem' }}>
            Standard Seeded Accounts Reference
          </h2>
          <p className="muted" style={{ fontSize: '0.875rem', margin: 0 }}>
            Configured in seed script for audit and testing
          </p>
        </div>

        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Email Address</th>
                <th>Role</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>System Admin</strong></td>
                <td><code>admin@campus.edu</code></td>
                <td><span className="badge-approved">admin</span></td>
                <td>Event moderation, cancellations, platform rosters</td>
              </tr>
              <tr>
                <td><strong>Club Organizer</strong></td>
                <td><code>organizer@campus.edu</code></td>
                <td><span className="badge-pending">organizer</span></td>
                <td>Propose events, manage club roster, upload media</td>
              </tr>
              <tr>
                <td><strong>Undergraduate Student</strong></td>
                <td><code>student@campus.edu</code></td>
                <td><span className="badge-default">student</span></td>
                <td>Discover events, transactional registrations</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
