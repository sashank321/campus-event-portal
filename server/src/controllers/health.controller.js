const { env } = require('../config/env');

function getHealth(req, res) {
  const dbState = require('../config/db').getDbState();
  res.status(200).json({
    data: {
      status: 'ok',
      db: dbState.state,
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
}

module.exports = { getHealth };
