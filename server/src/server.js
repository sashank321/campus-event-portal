const fs = require('fs');
const path = require('path');

const createApp = require('./app');
const { env, validateEnv } = require('./config/env');
const { connectDB } = require('./config/db');

async function main() {
  validateEnv();

  const uploadDir = path.resolve(__dirname, '..', env.uploadDir);
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  await connectDB();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`[server] API listening on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

main();
