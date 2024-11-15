import { WebSocket, WebSocketServer } from 'ws';
import { Tail } from 'tail';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { parentLogger } from './logger';
import { IncomingMessage } from 'http';

const LOG_FILE_PATH = join(process.cwd(), 'logs/current.log');
const logger = parentLogger.child({ filename: 'server' });

let webSocketServer: WebSocketServer | null = null;
let logTail: Tail | null = null;

export async function startWebSocketServer(): Promise<void> {
  // create new server instance, no need attach to an HTTP server
  webSocketServer = new WebSocketServer({ noServer: true });

  // start watching the log file
  watchLogFile();

  // code that runs when any client connects
  webSocketServer.on(
    'connection',
    async (socket: WebSocket, request: IncomingMessage) => {
      const clientAddress = request.socket.remoteAddress;
      const clientPort = request.socket.remotePort;

      logger.info(`🤝 Client connected from ${clientAddress}:${clientPort}`);

      // send the initial log file content
      try {
        const logFileContent = await readFile(LOG_FILE_PATH, 'utf-8');
        socket.send(logFileContent);
      } catch (error) {
        logger.error(error, 'Error reading log file');
      }

      socket.on('close', () => {
        logger.info('🤙 Client disconnected');
      });
    },
  );

  logger.info('🚀 WebSocket server started');
}

export async function stopWebSocketServer(): Promise<void> {
  return new Promise((resolve) => {
    // stop watching the log file
    logTail?.unwatch();
    logTail = null;

    // just in case the server was never started successfully
    // or it was already stopped
    if (!webSocketServer) {
      logger.info('🔚 WebSocket server stopped (was already stopped).');
      resolve();
      return;
    }

    // close the server
    webSocketServer.close(() => {
      logger.info('🔚 WebSocket server stopped.');
      resolve();
    });

    webSocketServer = null;
  });
}

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
    logger.error(error, 'Error reading log file');
  });
}
