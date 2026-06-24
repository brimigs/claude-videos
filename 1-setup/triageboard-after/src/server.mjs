import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { INCIDENTS } from './data/incidents.mjs';
import { sortIncidentsForQueue, summarizeIncidents } from './triage/rules.mjs';

const PUBLIC_DIR = fileURLToPath(new URL('./public/', import.meta.url));

const MIME_TYPES = Object.freeze({
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
});

/**
 * Create the TriageBoard HTTP server.
 *
 * @param {object} [options] - Server options.
 * @param {readonly object[]} [options.incidents] - Incident data source.
 * @returns {import('node:http').Server} Configured HTTP server.
 */
export function createAppServer({ incidents = INCIDENTS } = {}) {
  return createServer(async (request, response) => {
    const requestUrl = new URL(request.url ?? '/', 'http://localhost');

    try {
      if (requestUrl.pathname === '/healthz') {
        sendJson(response, 200, { status: 'ok', incidentCount: incidents.length });
        return;
      }

      if (requestUrl.pathname === '/api/incidents') {
        sendJson(response, 200, {
          incidents: sortIncidentsForQueue(incidents),
          summary: summarizeIncidents(incidents),
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      await serveStatic(requestUrl.pathname, response);
    } catch (error) {
      sendJson(response, 500, {
        error: 'InternalServerError',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}

async function serveStatic(pathname, response) {
  const filePath = getStaticPath(pathname);

  if (!filePath) {
    sendJson(response, 404, { error: 'NotFound' });
    return;
  }

  const fileStat = await stat(filePath).catch(() => undefined);

  if (!fileStat?.isFile()) {
    sendJson(response, 404, { error: 'NotFound' });
    return;
  }

  const contentType = MIME_TYPES[path.extname(filePath)] ?? 'application/octet-stream';
  response.writeHead(200, { 'content-type': contentType });
  createReadStream(filePath).pipe(response);
}

function getStaticPath(pathname) {
  const staticPath = pathname === '/' ? 'index.html' : decodeURIComponent(pathname.slice(1));
  const filePath = path.normalize(path.join(PUBLIC_DIR, staticPath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    return undefined;
  }

  return filePath;
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(`${JSON.stringify(payload, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 4173);
  const server = createAppServer();

  server.listen(port, host, () => {
    const address = server.address();
    const actualPort = typeof address === 'object' && address ? address.port : port;
    console.log(`TriageBoard running at http://localhost:${actualPort}`);
  });
}
