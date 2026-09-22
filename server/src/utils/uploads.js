const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const { env } = require('../config/env');

const ALLOWED_IMAGE_TYPES = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

const uploadDirPath = path.resolve(__dirname, '..', '..', env.uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDirPath),
  // Filename derived from mimetype + random bytes - never the client filename,
  // which prevents path traversal and collisions
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ALLOWED_IMAGE_TYPES[file.mimetype]}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE },
  // Rejected files yield req.file === undefined; controller returns INVALID_FILE
  fileFilter: (req, file, cb) => cb(null, Boolean(ALLOWED_IMAGE_TYPES[file.mimetype])),
});

module.exports = { imageUpload, uploadDirPath, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE };
