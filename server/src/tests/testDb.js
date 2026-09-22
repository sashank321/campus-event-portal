const { mongo } = require('mongoose');
const { env } = require('../config/env');

const DISPOSABLE_NAME = /^campus_portal_test_[A-Za-z0-9][A-Za-z0-9_-]*$/;

// MongoClient construction parses options but does not open a connection.
// Pin the test dbName explicitly and check both development-name candidates;
// driver versions differ in how they interpret URI dbName query options.
function parseDatabase(uri, label) {
  if (typeof uri !== 'string' || !uri || uri !== uri.trim()) {
    throw new Error(`[testDb] ${label} must be an explicit MongoDB URI.`);
  }
  let client;
  try {
    client = new mongo.MongoClient(uri);
  } catch {
    // Never include a URI (which may contain credentials) in guard errors.
    throw new Error(`[testDb] ${label} is not a valid MongoDB URI.`);
  }
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/[^/?#]+(?:\/([^?#]*))?(?:\?([^#]*))?$/);
  if (!match) throw new Error(`[testDb] ${label} is not a valid MongoDB URI.`);
  const overrides = [...new URLSearchParams(match[2] || '')]
    .filter(([key]) => key.toLowerCase() === 'dbname');
  if (overrides.length > 1 || overrides.some(([, value]) => !value)) {
    throw new Error(`[testDb] ${label} has an ambiguous or empty dbName override.`);
  }
  return {
    name: overrides.length ? overrides[0][1] : client.options.dbName,
    candidates: [client.options.dbName, ...overrides.map(([, value]) => value)],
    explicit: Boolean(match[1] || overrides.length),
  };
}

function assertSafeTestUri(testUri, mongoUri) {
  const target = parseDatabase(testUri, 'TEST_MONGO_URI');
  if (!target.explicit || !DISPOSABLE_NAME.test(target.name) || target.name.length > 63) {
    throw new Error(
      '[testDb] TEST_MONGO_URI must explicitly name a disposable database matching ' +
      'campus_portal_test_<unique suffix> (at most 63 characters). No default is allowed.'
    );
  }
  if (mongoUri) {
    const development = parseDatabase(mongoUri, 'MONGO_URI');
    // Reject identical names even on different hosts; host aliases are not isolation.
    if (development.candidates.some((name) => target.name.toLowerCase() === name.toLowerCase())) {
      throw new Error('[testDb] Test database must not have the same name as MONGO_URI.');
    }
  }
  return target.name;
}

function createTestDatabase(mongoose, {
  getConfig = () => ({
    testUri: process.env.TEST_MONGO_URI,
    mongoUri: process.env.MONGO_URI || env.mongoUri,
  }),
} = {}) {
  let owned;

  function validate(config) {
    return assertSafeTestUri(config.testUri, config.mongoUri);
  }

  function assertConnection(connection, name) {
    if (connection.readyState !== 1 || connection.name !== name ||
        !connection.db || connection.db.databaseName !== name) {
      throw new Error('[testDb] Connected database does not match the validated disposable database.');
    }
  }

  async function setup() {
    const config = getConfig();
    const name = validate(config); // Must run before any connection attempt.
    const connection = mongoose.connection;
    if (owned || connection.readyState !== 0) {
      throw new Error('[testDb] Refusing to reuse an existing Mongoose connection.');
    }
    try {
      await mongoose.connect(config.testUri, { dbName: name, serverSelectionTimeoutMS: 8000 });
      if (mongoose.connection !== connection) {
        throw new Error('[testDb] Mongoose connection changed during setup.');
      }
      assertConnection(connection, name);
      owned = { connection, name, config: { ...config }, client: connection.getClient(), db: connection.db };
    } catch (error) {
      // A failed/partial setup must never arm teardown to drop a database.
      try {
        await connection.close();
      } catch (closeError) {
        throw new AggregateError([error, closeError], '[testDb] Setup and connection cleanup failed.');
      }
      throw error;
    }
  }

  async function teardown() {
    if (!owned) return; // Includes setup rejected before connect or a repeated teardown.
    const { connection, name, config, client, db } = owned;
    owned = undefined;
    let failure;
    try {
      // Recheck both the original and current configuration immediately before drop.
      if (validate(config) !== name || validate(getConfig()) !== name) {
        throw new Error('[testDb] Test database configuration changed before teardown.');
      }
      if (mongoose.connection !== connection || connection.getClient() !== client || connection.db !== db) {
        throw new Error('[testDb] Refusing to drop a replaced connection or database.');
      }
      assertConnection(connection, name);
      await connection.dropDatabase();
    } catch (error) {
      failure = error;
    } finally {
      // Close only the connection this helper opened, including guard/drop failures.
      try {
        await connection.close();
      } catch (closeError) {
        if (failure) throw new AggregateError([failure, closeError], '[testDb] Teardown and connection cleanup failed.');
        throw closeError;
      }
    }
    if (failure) throw failure;
  }

  return { setup, teardown };
}

module.exports = { assertSafeTestUri, createTestDatabase };
