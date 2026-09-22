const router = require('express').Router();
const { getHealth } = require('../controllers/health.controller');
const authRoutes = require('./auth.routes');
const eventRoutes = require('./event.routes');
const registrationRoutes = require('./registration.routes');

router.get('/health', getHealth);
router.use('/v1/auth', authRoutes);
router.use('/v1/events', eventRoutes);
router.use('/v1', registrationRoutes);

module.exports = router;
