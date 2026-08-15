import { createServer, type Server, type ServerResponse } from 'node:http';

type HealthServerOptions = {
  checkDatabase: () => Promise<void>;
  port: number;
};

type HealthServer = {
  close(): Promise<void>;
  listen(): Promise<void>;
  setReady(ready: boolean): void;
};

export function createHealthServer(options: HealthServerOptions): HealthServer {
  let isReady = false;

  const server = createServer((request, response) => {
    if (request.url !== '/health') {
      response.writeHead(404);
      response.end('Not Found');
      return;
    }

    void respondToHealthCheck(response, isReady, options.checkDatabase);
  });

  return {
    close: () => closeServer(server),
    listen: () =>
      new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(options.port, () => {
          server.off('error', reject);
          resolve();
        });
      }),
    setReady(ready) {
      isReady = ready;
    },
  };
}

async function respondToHealthCheck(
  response: ServerResponse,
  isReady: boolean,
  checkDatabase: () => Promise<void>,
): Promise<void> {
  if (!isReady) {
    writeHealthResponse(response, 503, {
      database: false,
      ok: false,
      ready: false,
    });
    return;
  }

  const databaseOk = await checkDatabase().then(
    () => true,
    () => false,
  );

  writeHealthResponse(response, databaseOk ? 200 : 503, {
    database: databaseOk,
    ok: databaseOk,
    ready: true,
  });
}

function writeHealthResponse(
  response: ServerResponse,
  status: number,
  body: Record<string, boolean>,
): void {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
}

function closeServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}
