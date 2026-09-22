const router = require('express').Router();
const { register, cancel, myRegistrations } = require('../controllers/registration.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.post('/events/:id/register', protect, authorize('student'), register);
router.delete('/registrations/:id', protect, cancel);
router.get('/my/registrations', protect, myRegistrations);

module.exports = router;
