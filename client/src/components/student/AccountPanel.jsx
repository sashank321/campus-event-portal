import { useAuth } from '../../features/auth/AuthContext';
import { dateLabel } from '../../lib/events';

// Only fields the backend actually returns on /auth/me; nothing inferred.
export default function AccountPanel() {
  const auth = useAuth();
  const user = auth.user;
  if (!user) return null;
  const profile = user.profile || null;
  const facts = [
    ['Email', user.email],
    ['Role', user.role],
    ['Roll number', profile?.rollNo],
    ['Department', profile?.department],
    ['Year', profile?.year],
    ['Phone', profile?.phone],
    ['Member since', user.createdAt ? dateLabel(user.createdAt) : null],
  ].filter(([, value]) => value !== undefined && value !== null && value !== '');
  return <section className="panel account-panel stack" aria-label="Account">
    <p className="eyebrow">YOUR ACCOUNT</p>
    <h2>{user.name}</h2>
    <dl className="account-facts">{facts.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{String(value)}</dd></div>)}</dl>
    <button className="text-button" onClick={auth.logout}>Log out</button>
  </section>;
}
