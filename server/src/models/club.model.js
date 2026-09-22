const mongoose = require('mongoose');

const coordinatorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, trim: true, maxlength: 80 },
  },
  { _id: false }
);

const clubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    },
    description: { type: String, trim: true, maxlength: 2000 },
    logoUrl: { type: String, trim: true },
    coordinators: [coordinatorSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

clubSchema.index(
  { name: 'text', description: 'text' },
  { name: 'club_text_search', weights: { name: 3, description: 1 } }
);

module.exports = mongoose.model('Club', clubSchema);
