import http, { ServerResponse } from 'http';
import { parentLogger } from '../logger';

const SSE_PORT = 8900;

/**
 * NOTE: this file is executed in a separate process than the main application,
 * so none of the context from the main application is available here. This file is
 * the entry point for this child process. See launch.ts for where it is spawned.
 */

const logger = parentLogger.child({ filename: 'sseServer/server' });

let httpServer: http.Server | null = null;

const connections = new Set<ServerResponse>();

/**
 * Stops the server and cleans up resources.
 */
function stopServer() {
  if (!httpServer) return;

  // stop listening for inter-process messages
  process.off('message', sendSseMessage);

  // stop accepting new connections - callback runs when
  // all existing connections are closed
  httpServer.close(() => {
    logger.info('🔌: SSE Server closed');
  });

  // Destroy all active connections
  connections.forEach((socket) => socket.destroy());

  // cleanup
  httpServer = null;
  connections.clear();
}

/**
 * Sets up signal handlers to gracefully shut down the process.
 */
function setupProcessShutdownHandlers(): void {
  process.on('SIGINT', () => {
    logger.info('🔌: Received SIGINT signal. Shutting down.');
    stopServer();
  });

  process.on('SIGTERM', () => {
    logger.info('🔌: Received SIGTERM signal. Shutting down.');
    stopServer();
  });
}

/**
 * Handles incoming HTTP requests.
 */
function requestHandler(req: http.IncomingMessage, res: http.ServerResponse) {
  const clientAddress = req.socket.remoteAddress;
  const clientPort = req.socket.remotePort;

  logger.info(`🔌: 🤝 Client connected from ${clientAddress}:${clientPort}`);

  // check if the request is coming from localhost
  const origin = req.headers.origin || '';
  let isLocalhost = false;
  try {
    const url = new URL(origin);
    isLocalhost = url.hostname === 'localhost';
  } catch {}

  // allow requests from localhost (for frontend dev)
  if (isLocalhost) res.setHeader('Access-Control-Allow-Origin', origin);

  // set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // start tracking this connection
  connections.add(res);

  // handle client connection close
  req.on('close', () => {
    logger.info('🔌: 🤙 Client disconnected');
    connections.delete(res);
  });
}

/**
 * Broadcasts incoming data to all connected clients.
 */
function sendSseMessage(data: string) {
  connections.forEach((response) => {
    response.write(`data: ${data}\n\n`);
  });
}

/**
 * Main function that starts the SSE server.
 */
async function main() {
  // first, set up the process shutdown handlers
  setupProcessShutdownHandlers();

  // create a new HTTP server
  httpServer = http.createServer(requestHandler);

  // handle server errors
  httpServer.on('error', (err) => {
    logger.error('🚨 SSE server error:', err);
    stopServer();
    process.exit(1);
  });

  // start the server
  httpServer.listen(SSE_PORT, () => {
    logger.info(`🚀 SSE server listening at http://localhost:${SSE_PORT}`);

    // notify the parent process that the server has started
    if (process.send) {
      process.send('sse-server-started');
    }

    // listen for inter-process messages and broadcast them to all clients
    process.on('message', sendSseMessage);
  });
}

main();
