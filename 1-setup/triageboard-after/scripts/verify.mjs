import assert from 'node:assert/strict';

import { createAppServer } from '../src/server.mjs';

const server = createAppServer();

try {
  const baseUrl = await listen(server);

  const health = await getJson(`${baseUrl}/healthz`);
  assert.equal(health.status, 'ok');
  assert.equal(health.incidentCount, 8);

  const incidents = await getJson(`${baseUrl}/api/incidents`);
  assert.equal(Array.isArray(incidents.incidents), true);
  assert.equal(incidents.incidents[0].id, 'inc-1047');
  assert.equal(incidents.summary.openCount, 7);

  const html = await getText(`${baseUrl}/`);
  assert.equal(html.includes('TriageBoard'), true);
  assert.equal(html.includes('/app.mjs'), true);

  const asset = await getText(`${baseUrl}/assets/service-map.svg`);
  assert.equal(asset.includes('<svg'), true);

  console.log(`Verified TriageBoard at ${baseUrl}`);
} finally {
  await close(server);
}

function listen(httpServer) {
  return new Promise((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => {
      const address = httpServer.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      resolve(`http://127.0.0.1:${port}`);
    });
  });
}

async function getJson(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.json();
}

async function getText(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true, `${url} returned ${response.status}`);
  return response.text();
}

function close(httpServer) {
  return new Promise((resolve, reject) => {
    httpServer.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
