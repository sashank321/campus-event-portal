import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsRequest, createEventRequest } from '../../api/client';
import {
  EVENT_CATEGORIES,
  DEPARTMENTS,
  validateEventForm,
  fromLocalDatetimeString,
  organizerErrorText,
} from '../../lib/organizer';

export default function CreateEvent() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch public events to extract known clubs and venues with their real DB IDs
  const catalogQuery = useQuery({
    queryKey: ['organizer', 'catalog-discovery'],
    queryFn: ({ signal }) => eventsRequest({ limit: 50 }, signal),
    staleTime: 60_000,
  });

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

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'workshop',
    club: '',
    venue: '',
    department: 'all',
    startAt: '',
    endAt: '',
    registrationDeadline: '',
    capacity: '',
    bannerUrl: '',
    tags: '',
    rules: '',
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => createEventRequest(data),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['organizer'] });
      void queryClient.invalidateQueries({ queryKey: ['events'] });
      const slug = res.data?.event?.slug;
      if (slug) {
        navigate(`/organizer/events/${slug}`, {
          state: { created: true, message: 'Event submitted for review.' },
        });
      } else {
        navigate('/organizer/events');
      }
    },
    onError: (err) => {
      setServerError(organizerErrorText(err));
    },
  });

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSubmit(e) {
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
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
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

  // Pre-select first discovered club if available and not selected
  if (!form.club && discoveredClubs.length > 0) {
    updateField('club', discoveredClubs[0].id);
  }

  return (
    <div className="stack" style={{ gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Link className="back-link" to="/organizer/events" style={{ margin: 0 }}>
          ← Back to managed events
        </Link>
      </div>

      <div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Publish a New Campus Event</h2>
        <p className="muted" style={{ fontSize: '0.875rem', margin: '0.25rem 0 0' }}>
          New organizer events begin in <strong>Pending Review</strong> until approved by campus administration.
        </p>
      </div>

      {serverError && (
        <div className="error-text" role="alert" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="stack" style={{ gap: '1.75rem' }} noValidate>
        {/* Section 1: Basic Information */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>1. Basic Information</h3>

          <div className="field">
            <label htmlFor="create-title">Event Title (required)</label>
            <input
              id="create-title"
              type="text"
              required
              maxLength={150}
              placeholder="e.g. Autonomous Drone Sprint 2026"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              disabled={mutation.isPending}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="create-category">Category (required)</label>
              <select
                id="create-category"
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
              {errors.category && <span className="error-text">{errors.category}</span>}
            </div>

            <div className="field">
              <label htmlFor="create-club">Organizing Club (required)</label>
              <select
                id="create-club"
                required
                value={form.club}
                onChange={(e) => updateField('club', e.target.value)}
                disabled={mutation.isPending}
              >
                {discoveredClubs.length > 0 ? (
                  discoveredClubs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))
                ) : (
                  <option value="">Loading clubs…</option>
                )}
              </select>
              {errors.club && <span className="error-text">{errors.club}</span>}
            </div>
          </div>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="create-department">Target Department</label>
              <select
                id="create-department"
                value={form.department}
                onChange={(e) => updateField('department', e.target.value)}
                disabled={mutation.isPending}
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments (Campus-wide)' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="create-description">Event Description (required)</label>
            <textarea
              id="create-description"
              rows={4}
              required
              maxLength={5000}
              placeholder="Detail what attendees will build, learn, or experience…"
              value={form.description}
              onChange={(e) => updateField('description', e.target.value)}
              disabled={mutation.isPending}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>
        </section>

        {/* Section 2: Schedule & Venue */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>2. Schedule & Location</h3>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="create-startAt">Event Starts (required)</label>
              <input
                id="create-startAt"
                type="datetime-local"
                required
                value={form.startAt}
                onChange={(e) => updateField('startAt', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.startAt && <span className="error-text">{errors.startAt}</span>}
            </div>

            <div className="field">
              <label htmlFor="create-endAt">Event Ends (required)</label>
              <input
                id="create-endAt"
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
            <label htmlFor="create-venue">Campus Venue</label>
            <select
              id="create-venue"
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

        {/* Section 3: Registration Rules */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>3. Registration Rules</h3>

          <div className="form-grid-2">
            <div className="field">
              <label htmlFor="create-deadline">Registration Closes (required)</label>
              <input
                id="create-deadline"
                type="datetime-local"
                required
                value={form.registrationDeadline}
                onChange={(e) => updateField('registrationDeadline', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.registrationDeadline && <span className="error-text">{errors.registrationDeadline}</span>}
            </div>

            <div className="field">
              <label htmlFor="create-capacity">Total Capacity (leave blank for unlimited)</label>
              <input
                id="create-capacity"
                type="number"
                min="1"
                placeholder="e.g. 100"
                value={form.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
                disabled={mutation.isPending}
              />
              {errors.capacity && <span className="error-text">{errors.capacity}</span>}
            </div>
          </div>
        </section>

        {/* Section 4: Media, Tags & Rules */}
        <section className="form-section">
          <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>4. Artwork, Tags & Guidelines</h3>

          <div className="field">
            <label htmlFor="create-banner">Banner Artwork URL</label>
            <input
              id="create-banner"
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={form.bannerUrl}
              onChange={(e) => updateField('bannerUrl', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="field">
            <label htmlFor="create-tags">Tags (comma-separated, up to 10)</label>
            <input
              id="create-tags"
              type="text"
              placeholder="robotics, hardware, contest"
              value={form.tags}
              onChange={(e) => updateField('tags', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>

          <div className="field">
            <label htmlFor="create-rules">Event Guidelines / Rules (one per line)</label>
            <textarea
              id="create-rules"
              rows={3}
              placeholder="Bring your campus ID card&#10;Teams of 2 to 4 members&#10;Laptops with Node.js installed"
              value={form.rules}
              onChange={(e) => updateField('rules', e.target.value)}
              disabled={mutation.isPending}
            />
          </div>
        </section>

        <div className="heading-actions" style={{ justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
          <Link className="button button-secondary" to="/organizer/events">
            Cancel
          </Link>
          <button type="submit" className="button" disabled={mutation.isPending} aria-busy={mutation.isPending}>
            {mutation.isPending ? 'Publishing Event…' : 'Submit Event for Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
