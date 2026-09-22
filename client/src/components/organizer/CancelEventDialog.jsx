import { useEffect, useId, useRef, useState } from 'react';
import { organizerErrorText } from '../../lib/organizer';

export default function CancelEventDialog({ event, onConfirm, onClose }) {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef(null);
  const submitting = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, []);

  async function handleConfirm() {
    if (submitting.current) return;
    submitting.current = true;
    setPending(true);
    setError(null);
    try {
      await onConfirm(event);
      onClose();
    } catch (err) {
      setError(organizerErrorText(err));
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="sheet cancel-event-sheet"
      aria-labelledby={titleId}
      aria-describedby={descId}
      onCancel={(e) => {
        e.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !pending) onClose();
      }}
    >
      <div className="sheet-content">
        <div className="section-header">
          <h2 id={titleId}>Cancel Event</h2>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={pending}
            aria-label="Close cancel dialog"
          >
            ×
          </button>
        </div>
        <div className="stack" style={{ gap: '1rem', marginTop: '1rem' }}>
          <p id={descId}>
            Are you sure you want to cancel <strong>{event?.title || 'this event'}</strong>?
          </p>
          <p className="muted" style={{ fontSize: '0.875rem' }}>
            This event will be marked as cancelled immediately. It will no longer accept registrations and will be hidden from public discovery. This cannot be undone from the organizer console.
          </p>
          {error && <p className="error-text" role="alert">{error}</p>}
          <div className="heading-actions" style={{ marginTop: '1rem', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              className="button button-secondary"
              onClick={onClose}
              disabled={pending}
              autoFocus
            >
              Keep event
            </button>
            <button
              type="button"
              className="button danger-button"
              onClick={handleConfirm}
              disabled={pending}
              aria-busy={pending}
            >
              {pending ? 'Cancelling event…' : 'Yes, cancel event'}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
