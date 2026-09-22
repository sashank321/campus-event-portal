const { assertSafeTestUri, createTestDatabase } = require('./testDb');

const name = 'campus_portal_test_unit_123';
const testUri = `mongodb://127.0.0.1:27018/${name}?replicaSet=rs0`;
const mongoUri = 'mongodb://127.0.0.1:27018/campus_portal?replicaSet=rs0';

function fixture() {
  const config = { testUri, mongoUri };
  const client = {};
  const connection = {
    readyState: 0,
    name,
    db: { databaseName: name },
    getClient: () => client,
    dropDatabase: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockImplementation(async () => { connection.readyState = 0; }),
  };
  const mongoose = {
    connection,
    connect: jest.fn().mockImplementation(async () => { connection.readyState = 1; }),
  };
  return { config, connection, mongoose, helper: createTestDatabase(mongoose, { getConfig: () => config }) };
}

describe('test database URI guards (no network connections)', () => {
  it.each([
    undefined, '', 'mongodb://localhost', 'mongodb://localhost/',
    'mongodb://localhost/campus_portal', 'mongodb://localhost/campus_portal_test',
    'mongodb://localhost/campus_portal_test_',
    'mongodb://localhost/campus_portal_test_bad%20name',
    'https://localhost/campus_portal_test_unit',
    `mongodb://localhost/campus_portal_test_${'x'.repeat(64)}`,
  ])('rejects missing, implicit or unsafe target %s', (uri) => {
    expect(() => assertSafeTestUri(uri, mongoUri)).toThrow();
  });

  it('accepts explicitly named disposable replica-set and SRV targets', () => {
    expect(assertSafeTestUri(testUri, mongoUri)).toBe(name);
    expect(assertSafeTestUri(`mongodb+srv://example.invalid/${name}`, mongoUri)).toBe(name);
    expect(assertSafeTestUri(`mongodb://localhost:27017,localhost:27018/${name}`, mongoUri)).toBe(name);
  });

  it('rejects matching MONGO_URI names regardless of hosts or casing', () => {
    expect(() => assertSafeTestUri(testUri, `mongodb://other/${name}`)).toThrow(/same name/);
    expect(() => assertSafeTestUri(testUri, `mongodb://other/${name.toUpperCase()}`)).toThrow(/same name/);
  });

  it('uses effective query dbName overrides for both URIs', () => {
    expect(() => assertSafeTestUri(`${testUri}&dbName=campus_portal`, mongoUri)).toThrow();
    expect(() => assertSafeTestUri(testUri, `${mongoUri}&dbName=${name}`)).toThrow(/same name/);
    expect(() => assertSafeTestUri(testUri, `${testUri}&dbName=other`)).toThrow(/same name/);
    expect(assertSafeTestUri(`mongodb://localhost/ignored?dbName=${name}`, mongoUri)).toBe(name);
    expect(() => assertSafeTestUri(`mongodb://localhost/ignored?dbName=${name}`, `mongodb://other/${name}`)).toThrow(/same name/);
    expect(() => assertSafeTestUri(`${testUri}&dbName=${name}&DBNAME=other`, mongoUri)).toThrow();
    expect(() => assertSafeTestUri(`${testUri}&dbName=`, mongoUri)).toThrow();
  });

  it('decodes names and fails closed on malformed development configuration', () => {
    expect(() => assertSafeTestUri(testUri, `mongodb://other/${name.replace('unit', '%75nit')}`)).toThrow(/same name/);
    expect(() => assertSafeTestUri(testUri, 'invalid')).toThrow(/MONGO_URI/);
    expect(() => assertSafeTestUri('mongodb://user:secret@/bad', mongoUri)).not.toThrow(/secret/);
  });
});

describe('test database lifecycle guards (mocked connections only)', () => {
  it('rejects unsafe configuration before connect, and teardown does nothing', async () => {
    const f = fixture();
    f.config.testUri = mongoUri;
    await expect(f.helper.setup()).rejects.toThrow();
    await f.helper.teardown();
    expect(f.mongoose.connect).not.toHaveBeenCalled();
    expect(f.connection.dropDatabase).not.toHaveBeenCalled();
    expect(f.connection.close).not.toHaveBeenCalled();
  });

  it('refuses to reuse or close a pre-existing connection', async () => {
    const f = fixture();
    f.connection.readyState = 1;
    await expect(f.helper.setup()).rejects.toThrow(/existing/);
    await f.helper.teardown();
    expect(f.mongoose.connect).not.toHaveBeenCalled();
    expect(f.connection.close).not.toHaveBeenCalled();
  });

  it('pins the validated database, drops once, and closes once', async () => {
    const f = fixture();
    await f.helper.setup();
    expect(f.mongoose.connect).toHaveBeenCalledWith(testUri, { dbName: name, serverSelectionTimeoutMS: 8000 });
    await f.helper.teardown();
    await f.helper.teardown();
    expect(f.connection.dropDatabase).toHaveBeenCalledTimes(1);
    expect(f.connection.close).toHaveBeenCalledTimes(1);
  });

  it.each(['connect', 'name', 'db'])('closes failed setup without ever dropping (%s)', async (failure) => {
    const f = fixture();
    if (failure === 'connect') f.mongoose.connect.mockRejectedValue(new Error('offline'));
    if (failure === 'name') f.connection.name = 'campus_portal';
    if (failure === 'db') f.connection.db.databaseName = 'campus_portal';
    await expect(f.helper.setup()).rejects.toThrow();
    await f.helper.teardown();
    expect(f.connection.close).toHaveBeenCalledTimes(1);
    expect(f.connection.dropDatabase).not.toHaveBeenCalled();
  });

  it.each(['name', 'db', 'client', 'development', 'target'])('guards before drop and still closes (%s changed)', async (changed) => {
    const f = fixture();
    await f.helper.setup();
    if (changed === 'name') f.connection.name = 'campus_portal';
    if (changed === 'db') f.connection.db = { databaseName: name };
    if (changed === 'client') f.connection.getClient = () => ({});
    if (changed === 'development') f.config.mongoUri = testUri;
    if (changed === 'target') f.config.testUri = testUri.replace('unit_123', 'other_456');
    await expect(f.helper.teardown()).rejects.toThrow();
    expect(f.connection.dropDatabase).not.toHaveBeenCalled();
    expect(f.connection.close).toHaveBeenCalledTimes(1);
  });

  it('closes even if drop fails and preserves the failure', async () => {
    const f = fixture();
    await f.helper.setup();
    f.connection.dropDatabase.mockRejectedValue(new Error('drop failed'));
    await expect(f.helper.teardown()).rejects.toThrow('drop failed');
    expect(f.connection.close).toHaveBeenCalledTimes(1);
  });

  it('reports close failures instead of silently leaking a connection', async () => {
    const f = fixture();
    await f.helper.setup();
    f.connection.close.mockRejectedValue(new Error('close failed'));
    await expect(f.helper.teardown()).rejects.toThrow('close failed');
  });
});
