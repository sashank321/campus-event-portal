const mongoose = require('mongoose');
const { Event, Registration, Venue } = require('../models');
const ApiError = require('../utils/ApiError');

const MY_DEFAULT_LIMIT = 10;
const MY_MAX_LIMIT = 50;
const MY_SORTS = {
  newest: { registeredAt: -1 },
  upcoming: { 'eventSnapshot.startAt': 1 },
  past: { 'eventSnapshot.startAt': -1 },
};

function assertObjectId(id, errorCode, message) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, errorCode, message);
  }
}

// Classifies why the atomic registration update did not match.
// Runs as reads inside the aborted transaction - no writes here.
async function classifyRegistrationFailure(eventId, now, session) {
  const event = await Event.findById(eventId).session(session).lean();
  if (!event) throw new ApiError(404, 'EVENT_NOT_FOUND', 'Event not found');
  if (event.status !== 'approved') {
    throw new ApiError(409, 'EVENT_NOT_REGISTERABLE', 'This event is not open for registration');
  }
  if (!event.registrationDeadline || event.registrationDeadline <= now) {
    throw new ApiError(409, 'REGISTRATION_CLOSED', 'Registration deadline has passed');
  }
  if (event.capacity != null && (event.registeredCount || 0) >= event.capacity) {
    throw new ApiError(409, 'EVENT_FULL', 'This event is full');
  }
  throw new ApiError(409, 'EVENT_NOT_REGISTERABLE', 'This event is not open for registration');
}

async function registerForEvent(user, eventId) {
  assertObjectId(eventId, 'EVENT_NOT_FOUND', 'Event not found');

  const session = await mongoose.startSession();
  try {
    let registration;
    await session.withTransaction(async () => {
      const now = new Date();

      // Deterministic early error only; the unique partial index remains the
      // authoritative duplicate backstop when concurrent requests race.
      const existing = await Registration.exists({
        event: eventId, student: user._id, status: 'registered',
      }).session(session);
      if (existing) {
        throw new ApiError(409, 'ALREADY_REGISTERED', 'You are already registered for this event');
      }

      // Atomic seat reservation: approved + deadline + capacity checked inside
      // the update filter, counter incremented in the same write. Under races,
      // non-matching updates simply fail without side effects.
      const event = await Event.findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(eventId),
          status: 'approved',
          registrationDeadline: { $gt: now },
          $expr: {
            $or: [{ $eq: ['$capacity', null] }, { $lt: ['$registeredCount', '$capacity'] }],
          },
        },
        { $inc: { registeredCount: 1 } },
        { new: true, session }
      );

      if (!event) {
        // Throws -> aborts the transaction (counter state untouched)
        await classifyRegistrationFailure(eventId, now, session);
      }

      const venue = event.venue ? await Venue.findById(event.venue, 'name').session(session).lean() : null;

      try {
        const created = await Registration.create(
          [
            {
              event: event._id,
              student: user._id,
              status: 'registered',
              registeredAt: now,
              eventSnapshot: {
                title: event.title,
                startAt: event.startAt,
                venue: venue ? venue.name : undefined,
                bannerUrl: event.bannerUrl || undefined,
              },
            },
          ],
          { session }
        );
        registration = created[0];
      } catch (err) {
        if (err.code === 11000) {
          // Unique partial index backstop: aborts the transaction, which also
          // rolls back the counter increment
          throw new ApiError(409, 'ALREADY_REGISTERED', 'You are already registered for this event');
        }
        throw err;
      }
    });
    return registration;
  } finally {
    session.endSession();
  }
}

async function cancelRegistration(user, registrationId) {
  assertObjectId(registrationId, 'REGISTRATION_NOT_FOUND', 'Registration not found');

  const session = await mongoose.startSession();
  try {
    let registration;
    await session.withTransaction(async () => {
      const now = new Date();
      const reg = await Registration.findById(registrationId).session(session);
      if (!reg) throw new ApiError(404, 'REGISTRATION_NOT_FOUND', 'Registration not found');

      const isOwner = reg.student.toString() === user._id.toString();
      if (!isOwner && user.role !== 'admin') {
        throw new ApiError(403, 'REGISTRATION_NOT_OWNER', 'You are not authorized to cancel this registration');
      }
      if (reg.status === 'cancelled') {
        throw new ApiError(409, 'REGISTRATION_ALREADY_CANCELLED', 'Registration is already cancelled');
      }

      const event = await Event.findById(reg.event, 'startAt').session(session).lean();
      if (event && event.startAt && event.startAt <= now) {
        throw new ApiError(409, 'CANNOT_CANCEL_AFTER_START', 'Cannot cancel after the event has started');
      }

      // Guarded update: only an active registration can flip to cancelled
      const updated = await Registration.updateOne(
        { _id: reg._id, status: 'registered' },
        { $set: { status: 'cancelled', cancelledAt: now } },
        { session }
      );
      if (updated.matchedCount === 0) {
        throw new ApiError(409, 'REGISTRATION_ALREADY_CANCELLED', 'Registration is already cancelled');
      }

      // Decrement exactly once, never below zero. The conditional update must
      // match the event; otherwise the transaction aborts and the registration
      // status change above rolls back with it.
      const decrement = await Event.updateOne(
        { _id: reg.event, registeredCount: { $gt: 0 } },
        { $inc: { registeredCount: -1 } },
        { session }
      );
      if (decrement.matchedCount !== 1 || decrement.modifiedCount !== 1) {
        throw new ApiError(409, 'REGISTRATION_STATE_CONFLICT', 'Registration could not be cancelled due to an inconsistent event state');
      }

      reg.status = 'cancelled';
      reg.cancelledAt = now;
      registration = reg;
    });
    return registration;
  } finally {
    session.endSession();
  }
}

async function listMyRegistrations(user, query) {
  const filter = { student: user._id };
  if (query.status && query.status !== 'all') {
    if (!['registered', 'cancelled', 'waitlisted'].includes(query.status)) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'status filter is invalid');
    }
    filter.status = query.status;
  }

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || MY_DEFAULT_LIMIT, 1), MY_MAX_LIMIT);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const sort = MY_SORTS[query.sort] || MY_SORTS.newest;

  const [items, total] = await Promise.all([
    Registration.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('status registeredAt cancelledAt attendedAt eventSnapshot event')
      .lean(),
    Registration.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
  };
}

module.exports = { registerForEvent, cancelRegistration, listMyRegistrations };
