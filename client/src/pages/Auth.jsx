import { useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { safeReturn } from '../lib/events';
import { useAuth } from '../features/auth/AuthContext';

export default function Auth({ mode = 'login' }) {
  const location = useLocation();
  // Remount form state when switching modes; never retain a password across forms.
  return <AuthForm key={`${mode}:${location.search}`} mode={mode} />;
}

function AuthForm({ mode }) {
  const register = mode === 'register';
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const returnTo = safeReturn(new URLSearchParams(location.search).get('returnTo'));
  const search = `?${new URLSearchParams({ returnTo })}`;
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const submitting = useRef(false);

  async function submit(event) {
    event.preventDefault();
    if (submitting.current || auth.loading) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    const form = event.currentTarget;
    const fields = new FormData(form);
    const email = String(fields.get('email')).trim();
    const password = String(fields.get('password'));
    try {
      if (register) {
        await api('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ name: String(fields.get('name')).trim(), email, password }),
        });
        form.reset();
        navigate(`/login${search}`, { replace: true, state: { registered: true } });
      } else {
        await auth.login({ email, password });
        form.reset();
        navigate(returnTo, { replace: true });
      }
    } catch (failure) {
      setError(failure.message || 'Unable to complete this request. Please try again.');
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  if (!auth.loading && auth.user) return <Navigate to={returnTo} replace />;

  return (
    <main className="auth-page">
      <section className="panel auth-panel stack" aria-labelledby="auth-heading">
        <p className="eyebrow">Campus Event Portal</p>
        <h1 id="auth-heading">{register ? 'Create a student account' : 'Log in'}</h1>
        <p>{register ? 'Create your account, then log in to register for campus events.' : 'Log in to register for campus events.'}</p>
        {!register && location.state?.registered && (
          <p className="notice" role="status">Account created. Please log in to continue.</p>
        )}
        {(error || auth.error) && <p className="error-text" id="auth-error" role="alert">{error || auth.error}</p>}
        {auth.loading && <p className="notice" role="status">Checking your account…</p>}
        <form className="stack" onSubmit={submit} aria-busy={pending} aria-describedby={error || auth.error ? 'auth-error' : undefined}>
          {register && (
            <div className="field">
              <label htmlFor="auth-name">Name (required)</label>
              <input id="auth-name" name="name" type="text" autoComplete="name" required disabled={pending || auth.loading} />
            </div>
          )}
          <div className="field">
            <label htmlFor="auth-email">Email (required)</label>
            <input id="auth-email" name="email" type="email" autoComplete="email" required disabled={pending || auth.loading} />
          </div>
          <div className="field">
            <label htmlFor="auth-password">Password (required)</label>
            <input id="auth-password" name="password" type="password" autoComplete={register ? 'new-password' : 'current-password'} required disabled={pending || auth.loading} />
          </div>
          <button className="button" type="submit" disabled={pending || auth.loading}>
            {pending ? (register ? 'Creating account…' : 'Logging in…') : (register ? 'Create account' : 'Log in')}
          </button>
        </form>
        <p>
          {register ? 'Already have an account? ' : 'New here? '}
          <Link className="link" to={`${register ? '/login' : '/register'}${search}`}>
            {register ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  );
}
