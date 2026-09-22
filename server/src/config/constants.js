const ROLES = ['student', 'organizer', 'admin'];

const DEPARTMENTS = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'MBA', 'MCA', 'Other'];

const EVENT_CATEGORIES = [
  'workshop',
  'fest',
  'competition',
  'seminar',
  'hackathon',
  'sports',
  'cultural',
  'other',
];

const EVENT_STATUSES = ['pending', 'approved', 'rejected', 'cancelled', 'completed'];

const REGISTRATION_STATUSES = ['registered', 'cancelled', 'waitlisted'];

const ANNOUNCEMENT_SCOPES = ['global', 'event', 'club'];

module.exports = {
  ROLES,
  DEPARTMENTS,
  EVENT_CATEGORIES,
  EVENT_STATUSES,
  REGISTRATION_STATUSES,
  ANNOUNCEMENT_SCOPES,
};
