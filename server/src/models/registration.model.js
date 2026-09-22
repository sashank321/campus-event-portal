const mongoose = require('mongoose');
const { REGISTRATION_STATUSES } = require('../config/constants');

const eventSnapshotSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 150 },
    startAt: { type: Date },
    venue: { type: String, trim: true, maxlength: 120 },
    bannerUrl: { type: String, trim: true },
  },
  { _id: false }
);

const registrationSchema = new mongoose.Schema(
  {
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: REGISTRATION_STATUSES, default: 'registered' },
    attendedAt: { type: Date, default: null },
    checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
    eventSnapshot: eventSnapshotSchema,
  }
);

// Backstop against duplicate active registrations (even under races) while
// still allowing re-registration after a cancellation
registrationSchema.index(
  { event: 1, student: 1 },
  {
    unique: true,
    name: 'unique_active_registration',
    partialFilterExpression: { status: 'registered' },
  }
);
registrationSchema.index({ student: 1, status: 1 }, { name: 'registration_student_status' });
registrationSchema.index({ event: 1, status: 1 }, { name: 'registration_event_status' });
registrationSchema.index({ event: 1, attendedAt: 1 }, { name: 'registration_event_attendance' });

module.exports = mongoose.model('Registration', registrationSchema);
