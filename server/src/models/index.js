const User = require('./user.model');
const Club = require('./club.model');
const Venue = require('./venue.model');
const Event = require('./event.model');
const Registration = require('./registration.model');
const Announcement = require('./announcement.model');

async function initModels() {
  // Waits for all auto-created indexes to finish building
  await Promise.all([
    User.init(),
    Club.init(),
    Venue.init(),
    Event.init(),
    Registration.init(),
    Announcement.init(),
  ]);
}

module.exports = { User, Club, Venue, Event, Registration, Announcement, initModels };
