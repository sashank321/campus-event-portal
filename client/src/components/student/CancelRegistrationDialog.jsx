import { useEffect, useId, useRef, useState } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { cancelErrorText } from '../../features/student/useCancelRegistration';

// A keyed instance keeps errors and late confirmations out of a different dialog/session.
export default function CancelRegistrationDialog({ registration, onClose }) {
  const auth = useAuth();
  return registration ? <Confirmation key={`${auth.user?.id}:${registration.registration?._id}`} registration={registration} onClose={onClose} /> : null;
}

function Confirmation({ registration, onClose }) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef(null);
  const active = useRef(false);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const title = registration.registration?.eventSnapshot?.title || 'this event';

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    active.current = true;
    dialog.showModal();
    return () => {
      active.current = false;
      // Close before removal so the native modal focus lifecycle can complete.
      if (dialog.open) dialog.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  function requestClose() {
    if (!submitting.current) onClose();
  }

  async function confirm() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await registration.onConfirm(registration.registration);
      if (active.current) onClose();
    } catch (failure) {
      if (active.current) setError(cancelErrorText(failure));
    } finally {
      submitting.current = false;
      if (active.current) setPending(false);
    }
  }

  return <dialog ref={dialogRef} className="sheet cancel-registration-sheet" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={pending}
    onCancel={(event) => { event.preventDefault(); requestClose(); }}
    onClick={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
    <div className="sheet-content">
      <div className="section-header"><h2 id={titleId}>Cancel registration</h2><button type="button" className="icon-button" onClick={requestClose} disabled={pending} aria-label="Close cancel registration">×</button></div>
      <div className="cancel-dialog stack">
        <p id={descriptionId}>Cancel your registration for <strong>{title}</strong>?</p>
        <p className="muted">Your spot will be released for someone else. You can register again while registration stays open.</p>
        {error && <p className="error-text" role="alert">{error}</p>}
        <div className="cancel-dialog-actions">
          <button type="button" className="button danger-button" onClick={confirm} disabled={pending} aria-busy={pending}>{pending ? 'Cancelling…' : 'Yes, cancel it'}</button>
          <button type="button" className="button button-secondary" onClick={requestClose} disabled={pending} autoFocus>Keep my spot</button>
        </div>
      </div>
    </div>
  </dialog>;
}
