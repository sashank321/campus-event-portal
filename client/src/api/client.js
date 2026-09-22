export async function api(path, { signal, ...options } = {}) {
  let response;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  const defaultHeaders = isFormData ? {} : { 'Content-Type': 'application/json' };
  try {
    response = await fetch(`/api/v1${path}`, {
      credentials: 'include', signal, ...options,
      headers: { ...defaultHeaders, ...options.headers },
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('The campus server could not be reached. Check your connection and try again.');
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.error?.message || 'The campus server could not complete this request.');
    error.code = body.error?.code;
    error.status = response.status;
    throw error;
  }
  return body;
}

export const eventsRequest = (params, signal) => api(`/events?${new URLSearchParams(params)}`, { signal });
export const detailRequest = (slug, signal) => api(`/events/${encodeURIComponent(slug)}`, { signal });
export const myRegistrationsRequest = (params, signal) => api(`/my/registrations?${new URLSearchParams(params)}`, { signal });
export const cancelRegistrationRequest = (id, signal) => api(`/registrations/${encodeURIComponent(id)}`, { method: 'DELETE', signal });

// Organizer & Admin endpoints
export const createEventRequest = (data, signal) => api('/events', { method: 'POST', body: JSON.stringify(data), signal });
export const updateEventRequest = (id, data, signal) => api(`/events/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(data), signal });
export const cancelEventRequest = (id, signal) => api(`/events/${encodeURIComponent(id)}`, { method: 'DELETE', signal });
export const eventParticipantsRequest = (id, params = {}, signal) => api(`/events/${encodeURIComponent(id)}/participants?${new URLSearchParams(params)}`, { signal });
export const uploadGalleryRequest = (id, formData, signal) => api(`/events/${encodeURIComponent(id)}/gallery`, { method: 'POST', body: formData, signal });

// Admin moderation endpoints
export const approveEventRequest = (id, signal) => api(`/events/${encodeURIComponent(id)}/approve`, { method: 'PATCH', signal });
export const rejectEventRequest = (id, signal) => api(`/events/${encodeURIComponent(id)}/reject`, { method: 'PATCH', signal });
