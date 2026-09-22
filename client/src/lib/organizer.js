import { dateLabel, timeLabel } from './events.js';

export const EVENT_CATEGORIES = [
  'workshop',
  'fest',
  'competition',
  'seminar',
  'hackathon',
  'sports',
  'cultural',
  'other',
];

export const DEPARTMENTS = [
  'all',
  'CSE',
  'ECE',
  'MECH',
  'CIVIL',
  'IT',
  'AI&DS',
];

// Seeded campus catalog fallback for club/venue references
export const SEEDED_CLUBS = [
  { name: 'Coding Club', slug: 'coding-club' },
  { name: 'Cultural Club', slug: 'cultural-club' },
  { name: 'Sports Club', slug: 'sports-club' },
  { name: 'Robotics Club', slug: 'robotics-club' },
];

export const SEEDED_VENUES = [
  { name: 'Main Auditorium', building: 'Central Block', capacity: 500 },
  { name: 'Seminar Hall A', building: 'CSE Block', capacity: 120 },
  { name: 'Sports Complex', building: 'East Campus', capacity: 1000 },
  { name: 'Open Air Stage', building: 'Quadrangle', capacity: 800 },
];

export function toLocalDatetimeString(date) {
  if (!date) return '';
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromLocalDatetimeString(str) {
  if (!str) return null;
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function statusBadge(status) {
  switch (status) {
    case 'approved':
      return { label: 'Approved', className: 'badge-approved' };
    case 'pending':
      return { label: 'Pending Review', className: 'badge-pending' };
    case 'rejected':
      return { label: 'Rejected', className: 'badge-rejected' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'badge-cancelled' };
    default:
      return { label: status || 'Unknown', className: 'badge-default' };
  }
}

export function registrationAvailability(event, now = Date.now()) {
  if (event.status !== 'approved') return 'Unavailable';
  if (new Date(event.registrationDeadline).getTime() <= now) return 'Closed (Deadline)';
  const cap = event.capacity;
  const reg = event.registeredCount || 0;
  if (cap != null && reg >= cap) return 'Full';
  return 'Open';
}

export function validateEventForm(values) {
  const errors = {};

  if (!values.title || !values.title.trim()) {
    errors.title = 'Title is required';
  } else if (values.title.trim().length > 150) {
    errors.title = 'Title cannot exceed 150 characters';
  }

  if (!values.description || !values.description.trim()) {
    errors.description = 'Description is required';
  } else if (values.description.trim().length > 5000) {
    errors.description = 'Description cannot exceed 5000 characters';
  }

  if (!values.category || !EVENT_CATEGORIES.includes(values.category)) {
    errors.category = 'Valid category is required';
  }

  if (!values.club) {
    errors.club = 'Club is required';
  }

  const start = values.startAt ? new Date(values.startAt) : null;
  const end = values.endAt ? new Date(values.endAt) : null;
  const deadline = values.registrationDeadline ? new Date(values.registrationDeadline) : null;

  if (!start || Number.isNaN(start.getTime())) {
    errors.startAt = 'Valid start time is required';
  }

  if (!end || Number.isNaN(end.getTime())) {
    errors.endAt = 'Valid end time is required';
  } else if (start && end <= start) {
    errors.endAt = 'End time must be after start time';
  }

  if (!deadline || Number.isNaN(deadline.getTime())) {
    errors.registrationDeadline = 'Valid registration deadline is required';
  } else if (start && deadline > start) {
    errors.registrationDeadline = 'Registration deadline must be on or before event start';
  }

  if (values.capacity !== undefined && values.capacity !== '' && values.capacity !== null) {
    const capNum = Number(values.capacity);
    if (!Number.isInteger(capNum) || capNum < 1) {
      errors.capacity = 'Capacity must be a positive integer';
    }
  }

  return errors;
}

export function organizerErrorText(error) {
  if (!error) return 'An unexpected error occurred.';
  const code = error.code;
  switch (code) {
    case 'EVENT_NOT_FOUND':
      return 'Event not found or you do not have permission to view it.';
    case 'EVENT_NOT_OWNER':
      return 'You are not authorized to manage this event.';
    case 'EVENT_ALREADY_CANCELLED':
      return 'This event is already cancelled and cannot be modified.';
    case 'INVALID_STATUS_TRANSITION':
      return 'This event cannot transition to the requested status.';
    case 'INVALID_FILE':
      return 'Please upload a supported image file (JPEG, PNG, or WebP).';
    case 'FILE_TOO_LARGE':
      return 'The uploaded image exceeds the 5 MB limit.';
    case 'VALIDATION_ERROR':
      return error.message || 'Please check your inputs and try again.';
    case 'AUTH_REQUIRED':
    case 'AUTH_EXPIRED':
      return 'Your session has expired. Please log in again.';
    case 'FORBIDDEN':
      return 'You do not have permission to perform this action.';
    default:
      return error.message || 'Unable to complete this action.';
  }
}
