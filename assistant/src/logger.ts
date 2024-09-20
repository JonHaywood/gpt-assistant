import pino from 'pino';

// Define ANSI color escape codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

export const parentLogger = pino({
  level: 'trace',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'filename,hostname',
      messageFormat: `${colors.yellow}{filename}${colors.reset}: {msg}`,
    },
  },
});
