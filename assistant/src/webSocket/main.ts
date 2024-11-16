import { fork } from 'child_process';
import path from 'path';
import { parentLogger } from '../logger';

const logger = parentLogger.child({ filename: 'webSocket/main' });

let websocketServerProcess: ReturnType<typeof fork> | null = null;

// Determine environment
const isDev = process.env.NODE_ENV !== 'production';

// Path to the WebSocket server's entry point
const websocketScriptPath = isDev
  ? path.resolve('src/webSocket/server.ts') // Development: .ts file
  : path.resolve('dist/webSocket/server.js'); // Production: .js file

/**
 * Starts the WebSocket server in a child process.
 */
export function startWebSocketServer() {
  // pass the current environment variables to the child process
  const env = process.env;

  const options = isDev
    ? { execArgv: ['-r', 'ts-node/register'], env } // Use ts-node for TypeScript in dev
    : { env }; // No special options for production

  // spawn a new child process for the WebSocket server
  logger.trace('Creating server process...');
  websocketServerProcess = fork(websocketScriptPath, [], options);

  // handle child process exit and error events
  websocketServerProcess.on('exit', (code, signal) => {
    logger.trace(`Server exited with code ${code}, signal ${signal}`);
    websocketServerProcess = null;

    // server exited normally, do not restart
    if (signal === 'SIGINT' || signal === 'SIGTERM' || code === 0) {
      logger.info('Server process stopped.');
      return;
    }

    logger.info('Restarting server...');
    startWebSocketServer();
  });

  websocketServerProcess.on('error', (error) => {
    console.error('Server encountered an error:', error);
  });

  logger.info('Server process successfully created.');
}

/**
 * Stops the WebSocket server process.
 * @returns Promise that resolves when the process has stopped.
 */
export async function stopWebSocketServer() {
  return new Promise<void>((resolve) => {
    if (!websocketServerProcess) {
      logger.trace('Server process is already stopped.');
      resolve();
      return;
    }

    logger.trace('Stopping server process...');

    // handle the edge case where the process somehow is already killed
    if (websocketServerProcess.killed) {
      websocketServerProcess = null;
      logger.info('Server process already exited.');
      resolve();
      return;
    }

    // register a one-time exit event listener
    websocketServerProcess.once('exit', () => {
      websocketServerProcess = null;
      resolve();
    });

    // send SIGINT to gracefully shutdown
    websocketServerProcess.kill('SIGINT');
  });
}
