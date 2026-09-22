const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120, unique: true },
  building: { type: String, trim: true, maxlength: 120 },
  capacity: { type: Number, min: 1 },
  facilities: { type: [String], default: [] },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Venue', venueSchema);
