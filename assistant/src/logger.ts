import pino from 'pino';
import path from 'path';
import { LOG_LEVEL } from './config';

// Define ANSI color escape codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

// create console transport
const consoleTransport = pino.transport({
  target: 'pino-pretty',
  options: {
    colorize: true,
    ignore: 'filename,hostname',
    messageFormat: `${colors.yellow}{filename}${colors.reset}: {msg}`,
  },
});

// Create the file transport using `pino-roll`
const fileTransport = pino.transport({
  target: 'pino-roll',
  options: {
    file: path.join('logs', 'app.log'), // Log file location
    frequency: 'daily', // Rotate logs daily
    size: '10M', // Rotate when file size exceeds 10MB
    mkdir: true, // Create directory if it doesn't exist
    symlink: true, // Create a symlink to the latest log file
  },
});

export const parentLogger = pino(
  {
    level: LOG_LEVEL,
  },
  // multistream is used to direct logs to multiple destinations
  pino.multistream([
    { level: LOG_LEVEL, stream: consoleTransport },
    { level: LOG_LEVEL, stream: fileTransport },
  ]),
);

/**
 * Flushes any buffered logs to the output stream.
 */
export function flushLogger(): Promise<void> {
  return new Promise((resolve) => {
    parentLogger.flush(() => resolve());
  });
}
