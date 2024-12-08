import { fork } from 'child_process';
import path from 'path';
import { parentLogger } from '../logger';
import { SseMessage } from './message';

const logger = parentLogger.child({ filename: 'sseServer/manager' });

let serverProcess: ReturnType<typeof fork> | null = null;

// Determine environment
const isDev = process.env.NODE_ENV !== 'production';

// Path to the SSE server's entry point
const serverScriptPath = isDev
  ? path.resolve('src/sseServer/server.ts') // Development: .ts file
  : path.resolve('dist/sseServer/server.js'); // Production: .js file

/**
 * Starts the SSE server in a child process.
 */
export function startSseServer(): Promise<void> {
  return new Promise((resolve) => {
    // pass the current environment variables to the child process
    const env = process.env;

    if (isDev && !require.resolve('ts-node')) {
      throw new Error(
        'ts-node is required to run the SSE server in development mode.',
      );
    }

    const options = isDev
      ? { execArgv: ['-r', 'ts-node/register'], env } // Use ts-node for TypeScript in dev
      : { env }; // No special options for production

    // spawn a new child process for the SSE server
    logger.info('Creating SSE server process...');
    serverProcess = fork(serverScriptPath, [], options);

    // the server will signal it's started by sending a message,
    // this is the only message it will send.
    serverProcess.once('message', () => {
      resolve();
    });

    // handle child process exit and error events
    serverProcess.on('exit', (code, signal) => {
      serverProcess = null;
      logger.info(
        `SSE server process exited with code ${code} and signal ${signal}`,
      );
    });

    serverProcess.on('error', (error) => {
      logger.error(error, 'SSE server encountered an error');
    });
  });
}

/**
 * Stops the SSE server process.
 * @returns Promise that resolves when the process has stopped.
 */
export function stopSseServer() {
  return new Promise<void>((resolve) => {
    if (!serverProcess) {
      logger.trace('SSE server process is already stopped.');
      resolve();
      return;
    }

    // handle the edge case where the process somehow is already killed
    if (serverProcess.killed) {
      serverProcess = null;
      logger.info('SSE server process already exited.');
      resolve();
      return;
    }

    // register a one-time exit event listener
    serverProcess.once('exit', () => {
      serverProcess = null;
      resolve();
    });

    // send SIGINT to gracefully shutdown
    serverProcess.kill('SIGINT');
  });
}

/**
 * Sends message to the SSE server process using inter-process communication.
 */
export function sendMessageToSseServer(message: SseMessage) {
  if (!serverProcess) {
    logger.error('SSE server process is not running, unable to send message.');
    return;
  }

  serverProcess.send(message);
}
