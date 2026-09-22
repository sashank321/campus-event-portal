const mongoose = require('mongoose');
const { EVENT_CATEGORIES, EVENT_STATUSES } = require('../config/constants');

const gallerySchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    caption: { type: String, trim: true, maxlength: 200 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    club: { type: mongoose.Schema.Types.ObjectId, ref: 'Club', required: true },
    organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue' },
    department: { type: String, trim: true, maxlength: 80, default: 'all' },
    status: { type: String, enum: EVENT_STATUSES, default: 'pending' },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },
    capacity: { type: Number, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    bannerUrl: { type: String, trim: true },
    gallery: {
      type: [gallerySchema],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'gallery cannot contain more than 10 images',
      },
    },
    rules: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Cross-field date invariants checked together so single-field updates are still validated
eventSchema.pre('validate', function (next) {
  const { startAt, endAt, registrationDeadline } = this;
  if (startAt && endAt && endAt <= startAt) {
    this.invalidate('endAt', 'endAt must be after startAt', endAt);
  }
  if (registrationDeadline && startAt && registrationDeadline > startAt) {
    this.invalidate(
      'registrationDeadline',
      'registrationDeadline must be on or before startAt',
      registrationDeadline
    );
  }
  next();
});

eventSchema.index({ status: 1, startAt: 1 }, { name: 'event_status_start' });
eventSchema.index({ club: 1, startAt: 1 }, { name: 'event_club_start' });
eventSchema.index({ category: 1, startAt: 1 }, { name: 'event_category_start' });
eventSchema.index({ registrationDeadline: 1 }, { name: 'event_registration_deadline' });
eventSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { name: 'event_text_search', weights: { title: 3, tags: 2, description: 1 } }
);

module.exports = mongoose.model('Event', eventSchema);
