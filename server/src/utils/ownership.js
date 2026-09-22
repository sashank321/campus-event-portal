// Central event ownership logic - reused by every event endpoint (Phase 4+).
// admin -> full access; organizer -> only when in organizers[] or createdBy.
function canManageEvent(user, event) {
  if (!user || !event) return false;
  if (user.role === 'admin') return true;
  if (user.role !== 'organizer') return false;

  const userId = user._id.toString();
  const createdBy = event.createdBy ? event.createdBy.toString() : null;
  const organizerIds = (event.organizers || []).map((o) =>
    o._id ? o._id.toString() : o.toString()
  );

  return createdBy === userId || organizerIds.includes(userId);
}

module.exports = { canManageEvent };
