const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

const routes = require('./routes');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { env } = require('./config/env');
const { uploadDirPath } = require('./utils/uploads');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  app.use(requestLogger);

  // Uploaded event images (local disk for dev/MVP; storage abstraction swappable later)
  app.use('/uploads', express.static(uploadDirPath));

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
