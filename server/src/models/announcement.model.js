const mongoose = require('mongoose');
const { ANNOUNCEMENT_SCOPES } = require('../config/constants');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    scope: { type: String, enum: ANNOUNCEMENT_SCOPES, required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isPinned: { type: Boolean, default: false },
  },
  { timestamps: true }
);

announcementSchema.pre('validate', function (next) {
  if (this.scope === 'event' && !this.event) {
    this.invalidate('event', 'an event-scoped announcement requires an event reference', this.event);
  }
  if (this.scope === 'club' && !this.club) {
    this.invalidate('club', 'a club-scoped announcement requires a club reference', this.club);
  }
  next();
});

announcementSchema.index({ scope: 1, createdAt: -1 }, { name: 'announcement_scope' });
announcementSchema.index({ event: 1, createdAt: -1 }, { name: 'announcement_event' });

module.exports = mongoose.model('Announcement', announcementSchema);
