const { EVENT_CATEGORIES } = require('../config/constants');

function isPositiveInt(v) {
  return Number.isInteger(v) && v >= 1;
}

function isValidDate(v) {
  return v instanceof Date && !Number.isNaN(v.getTime());
}

function toArray(v) {
  return Array.isArray(v) ? v : null;
}

// Validates present fields; when partial=false the core create fields are required.
// Reference existence (club/venue) is checked in the service against the DB.
function validateEventInput(body = {}, { partial = false } = {}) {
  const errors = [];
  const require = (cond, msg) => {
    if (!cond) errors.push(msg);
  };

  const { title, description, category, club, venue, startAt, endAt, registrationDeadline, capacity, department, tags, rules, bannerUrl, isFeatured } = body;

  if (title != null || !partial) {
    require(typeof title === 'string' && !!title.trim(), 'title is required');
    if (typeof title === 'string') require(title.trim().length <= 150, 'title must be at most 150 characters');
  }
  if (description != null || !partial) {
    require(typeof description === 'string' && !!description.trim(), 'description is required');
    if (typeof description === 'string') require(description.trim().length <= 5000, 'description must be at most 5000 characters');
  }
  if (category != null || !partial) {
    require(EVENT_CATEGORIES.includes(category), 'category is invalid');
  }
  if (club != null || !partial) {
    require(typeof club === 'string' && !!club, 'club is required');
  }
  if (venue != null) {
    require(typeof venue === 'string' && !!venue, 'venue must be an id');
  }

  for (const [field, value] of [['startAt', startAt], ['endAt', endAt], ['registrationDeadline', registrationDeadline]]) {
    if (value != null || !partial) {
      const date = value instanceof Date ? value : new Date(value);
      require(value != null && isValidDate(date), `${field} is required and must be a valid date`);
    }
  }

  if (capacity != null) {
    require(isPositiveInt(capacity), 'capacity must be a positive integer');
  }
  if (department != null) {
    require(typeof department === 'string' && department.length <= 80, 'department must be a string of at most 80 characters');
  }

  const tagList = toArray(tags);
  if (tags != null) {
    require(tagList !== null && tagList.every((t) => typeof t === 'string' && t.length <= 30), 'tags must be strings of at most 30 characters');
    require(!tagList || tagList.length <= 10, 'tags cannot contain more than 10 items');
  }
  const ruleList = toArray(rules);
  if (rules != null) {
    require(ruleList !== null && ruleList.every((r) => typeof r === 'string' && r.length <= 200), 'rules must be strings of at most 200 characters');
    require(!ruleList || ruleList.length <= 20, 'rules cannot contain more than 20 items');
  }
  if (bannerUrl != null) {
    require(typeof bannerUrl === 'string', 'bannerUrl must be a string');
  }
  if (isFeatured != null) {
    require(typeof isFeatured === 'boolean', 'isFeatured must be a boolean');
  }

  return errors;
}

module.exports = { validateEventInput };
