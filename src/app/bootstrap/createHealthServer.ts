import { createServer, type Server } from 'node:http';

type HealthServerOptions = {
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

    if (!isReady) {
      response.writeHead(503, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ok: false }));
      return;
    }

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ ok: true }));
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
