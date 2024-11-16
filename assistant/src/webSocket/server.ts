import { readFile } from 'fs/promises';
import { IncomingMessage } from 'http';
import { resolve } from 'path';
import { Tail } from 'tail';
import { WebSocket, WebSocketServer } from 'ws';
import { LOGGING_WS_PORT } from '../env';
import { parentLogger } from '../logger';

/**
 * NOTE: this file is executed in a separate process than the main application,
 * so none of the context from the main application is available here. This file is
 * the entry point for this child process. See main.ts for where it is spawned.
 */

const LOG_FILE_PATH = resolve('logs/current.log');
const logger = parentLogger.child({ filename: 'webSocket/server' });

let webSocketServer: WebSocketServer | null = null;
let logTail: Tail | null = null;

/**
 * Watches the log file for new lines and broadcasts them to all connected clients.
 */
function watchLogFile(): void {
  logTail = new Tail(LOG_FILE_PATH);

  logTail.on('line', (line: string) => {
    // broadcast the new log line to all connected clients
    webSocketServer?.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(line);
      }
    });
  });

  logTail.on('error', (error: unknown) => {
    logger.error(error, '🔌: Error reading log file');
  });
}

/**
 * Cleans up resources (WebSocket server and log tail).
 */
function cleanUp(): void {
  if (logTail) {
    logTail.unwatch();
    logTail = null;
    logger.trace('🔌: Log tailing stopped.');
  }

  if (webSocketServer) {
    webSocketServer.close();
    webSocketServer = null;
    logger.trace('🔌: WebSocket server stopped.');
  }
}

/**
 * Sets up signal handlers to gracefully shut down the process.
 */
function setupProcessShutdownHandlers(): void {
  process.on('SIGINT', () => {
    logger.info('🔌: Received SIGINT signal. Shutting down.');
    cleanUp();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    logger.info('🔌: Received SIGTERM signal. Shutting down.');
    cleanUp();
    process.exit(0);
  });
}

/**
 * Main function that starts the WebSocket server.
 */
async function main() {
  // first, set up the process shutdown handlers
  setupProcessShutdownHandlers();

  // create new server instance, no need attach to an HTTP server
  webSocketServer = new WebSocketServer({ port: LOGGING_WS_PORT });

  // code that runs when any client connects
  webSocketServer.on(
    'connection',
    async (socket: WebSocket, request: IncomingMessage) => {
      const clientAddress = request.socket.remoteAddress;
      const clientPort = request.socket.remotePort;

      logger.info(
        `🔌: 🤝 Client connected from ${clientAddress}:${clientPort}`,
      );

      // send the initial log file content
      try {
        const logFileContent = await readFile(LOG_FILE_PATH, 'utf-8');
        socket.send(logFileContent);
      } catch (error) {
        logger.error(error, 'Error reading log file');
      }

      socket.on('close', () => {
        logger.info('🔌: 🤙 Client disconnected');
      });
    },
  );

  // start watching the log file
  watchLogFile();

  logger.info(
    `🚀 Web socket server listening at ws://localhost:${LOGGING_WS_PORT}`,
  );
}

main();
