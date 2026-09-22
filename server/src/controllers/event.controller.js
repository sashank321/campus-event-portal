const eventService = require('../services/event.service');
const { canManageEvent } = require('../utils/ownership');
const { toCsv } = require('../utils/csv');
const ApiError = require('../utils/ApiError');

async function create(req, res, next) {
  try {
    const event = await eventService.createEvent(req.user, req.body || {});
    res.status(201).json({ data: { event } });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { items, meta } = await eventService.listEvents(req.query || {});
    res.status(200).json({ data: items, meta });
  } catch (err) {
    next(err);
  }
}

async function getBySlug(req, res, next) {
  try {
    const event = await eventService.getEventBySlug(req.params.slug, req.user);
    res.status(200).json({ data: { event } });
  } catch (err) {
    next(err);
  }
}

function assertCanManage(req, event) {
  if (!canManageEvent(req.user, event)) {
    throw new ApiError(403, 'EVENT_NOT_OWNER', 'You are not authorized to manage this event');
  }
}

async function update(req, res, next) {
  try {
    const event = await eventService.getEventByIdOrThrow(req.params.id);
    assertCanManage(req, event);
    const updated = await eventService.updateEvent(req.user, event, req.body || {});
    res.status(200).json({ data: { event: updated } });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const event = await eventService.getEventByIdOrThrow(req.params.id);
    assertCanManage(req, event);
    const cancelled = await eventService.cancelEvent(event);
    res.status(200).json({ data: { event: cancelled } });
  } catch (err) {
    next(err);
  }
}

async function approve(req, res, next) {
  try {
    const event = await eventService.getEventByIdOrThrow(req.params.id);
    const updated = await eventService.setApprovalStatus(event, 'approve');
    res.status(200).json({ data: { event: updated } });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const event = await eventService.getEventByIdOrThrow(req.params.id);
    const updated = await eventService.setApprovalStatus(event, 'reject');
    res.status(200).json({ data: { event: updated } });
  } catch (err) {
    next(err);
  }
}

async function participants(req, res, next) {
  try {
    const event = await eventService.getEventByIdOrThrow(req.params.id);
    assertCanManage(req, event);

    if (req.query.format === 'csv') {
      const rows = await eventService.listParticipants(event, { ...req.query, limit: 100000, page: 1 });
      const csv = toCsv(
        ['Name', 'Email', 'Roll No', 'Department', 'Year', 'Status', 'Registered At', 'Attended'],
        rows.items.map((r) => [
          r.student?.name,
          r.student?.email,
          r.student?.profile?.rollNo,
          r.student?.profile?.department,
          r.student?.profile?.year,
          r.status,
          r.registeredAt ? new Date(r.registeredAt).toISOString() : '',
          r.attendedAt ? new Date(r.attendedAt).toISOString() : 'no',
        ])
      );
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="participants-${event.slug}.csv"`);
      return res.status(200).send(csv);
    }

    const { items, meta } = await eventService.listParticipants(event, req.query || {});
    res.status(200).json({ data: items, meta });
  } catch (err) {
    next(err);
  }
}

async function uploadGallery(req, res, next) {
  try {
    const event = await eventService.getEventByIdOrThrow(req.params.id);
    assertCanManage(req, event);
    const updated = await eventService.addGalleryImage(event, req.file, req.body ? req.body.caption : undefined);
    res.status(201).json({ data: { event: updated } });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getBySlug, update, cancel, approve, reject, participants, uploadGallery };
