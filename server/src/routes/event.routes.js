const router = require('express').Router();
const { create, list, getBySlug, update, cancel, approve, reject, participants, uploadGallery } = require('../controllers/event.controller');
const { protect, authorize, optionalAuth } = require('../middleware/auth.middleware');
const { imageUpload } = require('../utils/uploads');

// Public
router.get('/', list);
router.get('/:slug', optionalAuth, getBySlug);

// Organizer/admin only
router.post('/', protect, authorize('organizer', 'admin'), create);
router.patch('/:id', protect, authorize('organizer', 'admin'), update);
router.delete('/:id', protect, authorize('organizer', 'admin'), cancel);
router.patch('/:id/approve', protect, authorize('admin'), approve);
router.patch('/:id/reject', protect, authorize('admin'), reject);
router.get('/:id/participants', protect, authorize('organizer', 'admin'), participants);
router.post('/:id/gallery', protect, authorize('organizer', 'admin'), imageUpload.single('image'), uploadGallery);

module.exports = router;
