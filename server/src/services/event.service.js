const mongoose = require('mongoose');
const { Event, Club, Venue, Registration } = require('../models');
const { EVENT_CATEGORIES } = require('../config/constants');
const ApiError = require('../utils/ApiError');
const { validateEventInput } = require('../utils/eventValidator');
const { uniqueSlug } = require('../utils/slugify');

const LIST_DEFAULT_LIMIT = 12;
const LIST_MAX_LIMIT = 50;
const SORT_WHITELIST = {
  startAt: { startAt: 1 },
  '-startAt': { startAt: -1 },
  title: { title: 1 },
  '-title': { title: -1 },
  createdAt: { createdAt: -1 },
  '-createdAt': { createdAt: 1 },
  popular: { registeredCount: -1 },
};

function toObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${label} reference is invalid`);
  }
  return new mongoose.Types.ObjectId(id);
}

async function assertReferenceExists(Model, id, label) {
  if (!(await Model.exists({ _id: id }))) {
    throw new ApiError(400, 'VALIDATION_ERROR', `${label} does not exist`);
  }
}

function computeSeatsRemaining(event) {
  if (event.capacity == null) return null; // unlimited
  return Math.max(0, event.capacity - (event.registeredCount || 0));
}

async function createEvent(user, body) {
  const errors = validateEventInput(body, { partial: false });
  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', errors.join(', '));
  }

  const clubId = toObjectId(body.club, 'club');
  await assertReferenceExists(Club, clubId, 'club');
  let venueId;
  if (body.venue) {
    venueId = toObjectId(body.venue, 'venue');
    await assertReferenceExists(Venue, venueId, 'venue');
  }

  const slug = await uniqueSlug(Event, 'slug', body.title);

  // Admin-created events skip moderation; organizer-created events start pending
  const status = user.role === 'admin' ? 'approved' : 'pending';

  const event = await Event.create({
    title: body.title.trim(),
    slug,
    description: body.description.trim(),
    category: body.category,
    club: clubId,
    venue: venueId,
    department: body.department ? body.department.trim() : 'all',
    status,
    startAt: new Date(body.startAt),
    endAt: new Date(body.endAt),
    registrationDeadline: new Date(body.registrationDeadline),
    capacity: body.capacity ?? null,
    bannerUrl: body.bannerUrl,
    rules: body.rules || [],
    tags: body.tags || [],
    isFeatured: Boolean(body.isFeatured),
    // Trusted values only - never from client input
    createdBy: user._id,
    organizers: [user._id],
  });

  return event;
}

const EDITABLE_FIELDS = [
  'title',
  'description',
  'category',
  'club',
  'venue',
  'department',
  'startAt',
  'endAt',
  'registrationDeadline',
  'capacity',
  'bannerUrl',
  'rules',
  'tags',
  'isFeatured',
];

async function updateEvent(user, event, body) {
  if (event.status === 'cancelled') {
    throw new ApiError(409, 'EVENT_ALREADY_CANCELLED', 'A cancelled event cannot be edited');
  }

  const errors = validateEventInput(body, { partial: true });
  if (errors.length > 0) {
    throw new ApiError(400, 'VALIDATION_ERROR', errors.join(', '));
  }

  if (body.club) {
    const clubId = toObjectId(body.club, 'club');
    await assertReferenceExists(Club, clubId, 'club');
  }
  if (body.venue) {
    const venueId = toObjectId(body.venue, 'venue');
    await assertReferenceExists(Venue, venueId, 'venue');
  }

  const updates = {};
  for (const field of EDITABLE_FIELDS) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }
  if (typeof updates.title === 'string') updates.title = updates.title.trim();
  if (typeof updates.description === 'string') updates.description = updates.description.trim();
  if (updates.startAt) updates.startAt = new Date(updates.startAt);
  if (updates.endAt) updates.endAt = new Date(updates.endAt);
  if (updates.registrationDeadline) updates.registrationDeadline = new Date(updates.registrationDeadline);

  // Non-admin edits send the event back for moderation
  if (user.role !== 'admin' && ['approved', 'rejected'].includes(event.status)) {
    updates.status = 'pending';
  }

  Object.assign(event, updates);
  await event.save();
  return event;
}

async function cancelEvent(event) {
  if (event.status === 'cancelled') {
    throw new ApiError(409, 'EVENT_ALREADY_CANCELLED', 'Event is already cancelled');
  }
  event.status = 'cancelled';
  await event.save();
  return event;
}

function assertTransition(event, target) {
  const allowed = { approve: ['pending'], reject: ['pending'] };
  if (event.status === 'cancelled') {
    throw new ApiError(409, 'EVENT_ALREADY_CANCELLED', 'A cancelled event cannot change status');
  }
  if (!allowed[target].includes(event.status)) {
    throw new ApiError(
      409,
      'INVALID_STATUS_TRANSITION',
      `Cannot ${target} an event with status '${event.status}'`
    );
  }
}

async function setApprovalStatus(event, target) {
  assertTransition(event, target);
  event.status = target === 'approve' ? 'approved' : 'rejected';
  await event.save();
  return event;
}

async function listEvents(query) {
  const filter = { status: 'approved' };

  // Reference filters resolved before building the query - no app-side filtering
  if (query.club) {
    const club = await Club.findOne({ slug: String(query.club).toLowerCase() }).lean();
    filter.club = club ? club._id : new mongoose.Types.ObjectId(0);
  }
  if (query.venue) {
    const venue = mongoose.isValidObjectId(query.venue)
      ? { _id: query.venue }
      : await Venue.findOne({ name: query.venue }).lean();
    filter.venue = venue ? venue._id : new mongoose.Types.ObjectId(0);
  }

  if (query.category) {
    if (!EVENT_CATEGORIES.includes(query.category)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'category is invalid');
    }
    filter.category = query.category;
  }
  if (query.department) {
    filter.department = query.department;
  }
  if (query.from || query.to) {
    filter.startAt = {};
    if (query.from && !Number.isNaN(new Date(query.from).getTime())) {
      filter.startAt.$gte = new Date(query.from);
    }
    if (query.to && !Number.isNaN(new Date(query.to).getTime())) {
      filter.startAt.$lte = new Date(query.to);
    }
  }

  let sort = SORT_WHITELIST[query.sort] || { startAt: 1 };
  if (query.search) {
    filter.$text = { $search: String(query.search) };
    // Relevance ranking unless an explicit sort overrides it
    if (!query.sort) sort = { score: { $meta: 'textScore' } };
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || LIST_DEFAULT_LIMIT, 1), LIST_MAX_LIMIT);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const [items, total] = await Promise.all([
    Event.find(filter, query.search ? { score: { $meta: 'textScore' } } : undefined)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('title slug category department startAt endAt capacity registeredCount bannerUrl tags isFeatured club venue')
      .populate('club', 'name slug logoUrl')
      .populate('venue', 'name')
      .lean(),
    Event.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

const DETAIL_MANAGER_STATUSES = ['pending', 'rejected', 'cancelled'];

async function getEventBySlug(slug, user) {
  const event = await Event.findOne({ slug: String(slug).toLowerCase() })
    .populate('club', 'name slug logoUrl description')
    .populate('venue', 'name building capacity facilities')
    .populate('organizers', 'name')
    .lean();

  if (!event) {
    throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found');
  }

  // Non-approved events are only visible to their managers (404 hides existence)
  if (DETAIL_MANAGER_STATUSES.includes(event.status)) {
    const { canManageEvent } = require('../utils/ownership');
    if (!canManageEvent(user, event)) {
      throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found');
    }
  }

  return { ...event, seatsRemaining: computeSeatsRemaining(event) };
}

async function getEventByIdOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found');
  }
  const event = await Event.findById(id);
  if (!event) {
    throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found');
  }
  return event;
}

const PARTICIPANT_DEFAULT_LIMIT = 20;
const PARTICIPANT_MAX_LIMIT = 100;
const REGISTRATION_STATUSES_FILTER = ['registered', 'cancelled', 'waitlisted'];

async function listParticipants(event, query) {
  const filter = { event: event._id };
  if (query.status && query.status !== 'all') {
    if (!REGISTRATION_STATUSES_FILTER.includes(query.status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'status filter is invalid');
    }
    filter.status = query.status;
  } else {
    filter.status = 'registered';
  }

  const limit = Math.min(
    Math.max(parseInt(query.limit, 10) || PARTICIPANT_DEFAULT_LIMIT, 1),
    PARTICIPANT_MAX_LIMIT
  );
  const page = Math.max(parseInt(query.page, 10) || 1, 1);

  const [items, total] = await Promise.all([
    Registration.find(filter)
      .sort({ registeredAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('student', 'name email profile.rollNo profile.department profile.year')
      .select('status registeredAt attendedAt student eventSnapshot')
      .lean(),
    Registration.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

async function addGalleryImage(event, file, caption) {
  if (!file) {
    throw new ApiError(400, 'INVALID_FILE', 'A supported image file is required (jpeg, png, webp)');
  }
  if (event.gallery.length >= 10) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'gallery cannot contain more than 10 images');
  }

  event.gallery.push({
    url: `/uploads/${file.filename}`,
    caption: caption ? String(caption).slice(0, 200) : undefined,
    uploadedAt: new Date(),
  });
  await event.save();
  return event;
}

module.exports = {
  createEvent,
  updateEvent,
  cancelEvent,
  setApprovalStatus,
  listEvents,
  getEventBySlug,
  getEventByIdOrThrow,
  listParticipants,
  addGalleryImage,
  computeSeatsRemaining,
};
