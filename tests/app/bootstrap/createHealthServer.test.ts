import assert from 'node:assert/strict';
import test from 'node:test';
import { createHealthServer } from '../../../src/app/bootstrap/createHealthServer';

const TEST_PORT = 34567;

async function fetchHealth() {
  const response = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
  return { body: await response.json(), status: response.status };
}

test('health server reports not ready before setReady(true) is called', async () => {
  const server = createHealthServer({
    checkDatabase: async () => {},
    port: TEST_PORT,
  });

  await server.listen();

  try {
    const { body, status } = await fetchHealth();
    assert.equal(status, 503);
    assert.deepEqual(body, { database: false, ok: false, ready: false });
  } finally {
    await server.close();
  }
});

test('health server reports healthy once ready and the database check passes', async () => {
  const server = createHealthServer({
    checkDatabase: async () => {},
    port: TEST_PORT,
  });

  await server.listen();
  server.setReady(true);

  try {
    const { body, status } = await fetchHealth();
    assert.equal(status, 200);
    assert.deepEqual(body, { database: true, ok: true, ready: true });
  } finally {
    await server.close();
  }
});

test('health server reports unhealthy when ready but the database check fails', async () => {
  const server = createHealthServer({
    checkDatabase: async () => {
      throw new Error('connection refused');
    },
    port: TEST_PORT,
  });

  await server.listen();
  server.setReady(true);

  try {
    const { body, status } = await fetchHealth();
    assert.equal(status, 503);
    assert.deepEqual(body, { database: false, ok: false, ready: true });
  } finally {
    await server.close();
  }
});

test('health server returns 404 for other paths', async () => {
  const server = createHealthServer({
    checkDatabase: async () => {},
    port: TEST_PORT,
  });

  await server.listen();
  server.setReady(true);

  try {
    const response = await fetch(`http://127.0.0.1:${TEST_PORT}/other`);
    assert.equal(response.status, 404);
  } finally {
    await server.close();
  }
});
