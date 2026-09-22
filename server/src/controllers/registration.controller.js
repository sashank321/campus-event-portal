const registrationService = require('../services/registration.service');
const { safeUser } = require('../utils/serializers');

async function register(req, res, next) {
  try {
    const registration = await registrationService.registerForEvent(req.user, req.params.id);
    res.status(201).json({ data: { registration, message: 'Registration confirmed' } });
  } catch (err) {
    next(err);
  }
}

async function cancel(req, res, next) {
  try {
    const registration = await registrationService.cancelRegistration(req.user, req.params.id);
    res.status(200).json({ data: { registration, message: 'Registration cancelled' } });
  } catch (err) {
    next(err);
  }
}

async function myRegistrations(req, res, next) {
  try {
    const { items, meta } = await registrationService.listMyRegistrations(req.user, req.query || {});
    res.status(200).json({ data: items, meta });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, cancel, myRegistrations };
