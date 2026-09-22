import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { detailRequest, updateEventRequest, eventsRequest } from '../../api/client';
import {
  EVENT_CATEGORIES,
  DEPARTMENTS,
  toLocalDatetimeString,
  fromLocalDatetimeString,
  validateEventForm,
  organizerErrorText,
} from '../../lib/organizer';
import { Skeleton, ErrorState } from '../../components/ui';

export default function EditEvent() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ['event', slug],
    queryFn: ({ signal }) => detailRequest(slug, signal),
  });

  const catalogQuery = useQuery({
    queryKey: ['organizer', 'catalog-discovery'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
    staleTime: 60_000,
  });

  const event = eventQuery.data?.data?.event;

  const discoveredClubs = [
    ...new Map(
      (catalogQuery.data?.data || [])
        .filter((e) => e.club && e.club._id)
        .map((e) => [e.club._id, { id: e.club._id, name: e.club.name }])
    ).values(),
  ];

  const discoveredVenues = [
    ...new Map(
      (catalogQuery.data?.data || [])
        .filter((e) => e.venue && e.venue._id)
        .map((e) => [e.venue._id, { id: e.venue._id, name: e.venue.name }])
    ).values(),
  ];

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  useEffect(() => {
    if (event) {
      setForm({
        title: event.title || '',
        description: event.description || '',
        category: event.category || 'workshop',
        club: event.club?._id || '',
        venue: event.venue?._id || '',
        department: event.department || 'all',
        startAt: toLocalDatetimeString(event.startAt),
        endAt: toLocalDatetimeString(event.endAt),
        registrationDeadline: toLocalDatetimeString(event.registrationDeadline),
        capacity: event.capacity != null ? String(event.capacity) : '',
        bannerUrl: event.bannerUrl || '',
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : '',
        rules: Array.isArray(event.rules) ? event.rules.join('\n') : '',
      });
    }
  }, [event]);

  const mutation = useMutation({
    mutationFn: (data) => updateEventRequest(event._id, data),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['organizer'] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      void queryClient.invalidateQueries({ queryKey: ['event', slug] });
      const nextSlug = res.data?.event?.slug || slug;
      navigate(`/organizer/events/${nextSlug}`, {
        state: { updated: true, message: 'Event updated successfully.' },
      });
    },
    onError: (err) => {
      setServerError(organizerErrorText(err));
    },
  });

  if (eventQuery.isPending || !form) {
    return (
      <div className="stack" style={{ gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <Skeleton count={2} />
      </div>
    );
  }

  if (eventQuery.isError) {
    return (
      <div className="stack" style={{ gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <ErrorState title="We couldn’t open this event for editing." error={eventQuery.error} retry={eventQuery.refetch} />
        <Link className="button button-secondary" to="/organizer/events">
          Back to managed events
        </Link>
      </div>
    );
  }

  if (event.status === 'cancelled') {
    return (
      <div className="stack" style={{ gap: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
        <section className="panel stack" role="alert">
          <h2>This event is cancelled.</h2>
          <p className="muted">Cancelled events cannot be modified. They remain in the event archive for reference.</p>
          <Link className="button button-secondary" to={`/organizer/events/${slug}`}>
            View event record
          </Link>
        </section>
      </div>
    );
  }

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateEventForm({
      ...form,
      startAt: fromLocalDatetimeString(form.startAt),
      endAt: fromLocalDatetimeString(form.endAt),
      registrationDeadline: fromLocalDatetimeString(form.registrationDeadline),
    });

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      club: form.club,
      venue: form.venue || undefined,
      department: form.department || 'all',
      startAt: fromLocalDatetimeString(form.startAt),
      endAt: fromLocalDatetimeString(form.endAt),
      registrationDeadline: fromLocalDatetimeString(form.registrationDeadline),
      capacity: form.capacity ? parseInt(form.capacity, 10) : null,
      bannerUrl: form.bannerUrl.trim() || undefined,
      tags: form.tags
        ? form.tags
            .split(',')
            .map((t) => t.trim().replace(/^#/, ''))
            .filter(Boolean)
        : [],
      rules: form.rules
        ? form.rules
            .split('\n')
            .map((r) => r.trim())
            .filter(Boolean)
        : [],
    };

    mutation.mutate(payload);
  }

  return (
    <div className="stack" style={{ gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link className="back-link" to={`/organizer/events/${slug}`} style={{ margin: 0 }}>
          ← Back to event console
        </Link>
      </div>

      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Edit Event Details</h2>
        <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          {event.status === 'approved'
            ? '⚠️ Notice: Saving edits to an approved event resets its status to Pending Review for moderation.'
            : `Current status: ${event.status}`}
        </p>
      </div>

      {serverError && (
        <div className="error-text" role="alert" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack" style={{ gap: '1.75rem' }} noValidate>
        {/* Basic Information */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>1. Basic Information</h3>

          <div className="field">
            <label htmlFor="edit-title">Event Title (required)</label>
            <input
              id="edit-title"
              type="text"
              required
              maxLength={150}
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={mutation.isPending}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="edit-category">Category (required)</label>
              <select
                id="edit-category"
                value={form.category}
                onChange={(e) => updateField('category', e.target.value)}
                disabled={mutation.isPending}
              >
                {EVENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="edit-club">Organizing Club (required)</label>
              <select
                id="edit-club"
                required
                value={form.club}
                onChange={(e) => updateField('club', e.target.value)}
                disabled={mutation.isPending}
              >
                {event.club && <option value={event.club._id}>{event.club.name}</option>}
                {discoveredClubs
                  .filter((c) => c.id !== event.club?._id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              rows={4}
              maxLength={5000}
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={mutation.isPending}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>
        </section>

        {/* Schedule & Venue */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>2. Schedule & Venue</h3>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="edit-startAt">Starts (required)</label>
              <input
                id="edit-startAt"
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => updateField('startAt', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.startAt && <span className="error-text">{errors.startAt}</span>}
            </div>

            <div className="field">
              <label htmlFor="edit-endAt">Ends (required)</label>
              <input
                id="edit-endAt"
                type="datetime-local"
                required
                value={form.endAt}
                onChange={(e) => updateField('endAt', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.endAt && <span className="error-text">{errors.endAt}</span>}
            </div>
          </div>

          <div className="field">
            <label htmlFor="edit-venue">Campus Venue</label>
            <select
              id="edit-venue"
              value={form.venue}
              onChange={(e) => updateField('venue', e.target.value)}
              disabled={mutation.isPending}
            >
              <option value="">Venue to be announced</option>
              {discoveredVenues.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Registration */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>3. Registration Rules</h3>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="edit-deadline">Registration Deadline (required)</label>
              <input
                id="edit-deadline"
                type="datetime-local"
                required
                value={form.registrationDeadline}
                onChange={(e) => updateField('registrationDeadline', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.registrationDeadline && <span className="error-text">{errors.registrationDeadline}</span>}
            </div>

            <div className="field">
              <label htmlFor="edit-capacity">Seat Capacity (blank = unlimited)</label>
              <input
                id="edit-capacity"
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.capacity && <span className="error-text">{errors.capacity}</span>}
            </div>
          </div>
        </section>

        {/* Media & Rules */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>4. Artwork & Rules</h3>

          <div className="field">
            <label htmlFor="edit-banner">Banner Image URL</label>
            <input
              id="edit-banner"
              type="url"
              value={form.bannerUrl}
              onChange={(e) => updateField('bannerUrl', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-rules">Rules (one per line)</label>
            <textarea
              id="edit-rules"
              rows={3}
              value={form.rules}
              onChange={(e) => updateField('rules', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
        </section>

        <div className="heading-actions" style={{ justifyContent: 'flex-end', gap: '1rem' }}>
          <Link className="button button-secondary" to={`/organizer/events/${slug}`}>
            Cancel
          </Link>
          <button type="submit" className="button" disabled={mutation.isPending} aria-busy={mutation.isPending}>
            {mutation.isPending ? 'Saving Changes…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
