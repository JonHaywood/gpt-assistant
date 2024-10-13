import { flushLogger, parentLogger } from './logger';
import { combineAbortControllers } from './utils/abort';

const logger = parentLogger.child({ filename: 'shutdown' });

/**
 * Function to setup process shutdown handlers for graceful shutdown.
 */
export function setupProcessShutdownHandlers() {
  // listen for Ctrl+C signal to shutdown
  process.on('SIGINT', () => {
    console.log('\r');
    logger.info('⏹  Received SIGINT signal. Shutting down.');
    signalSystemShutdown();
  });

  // listen for when process is terminated (e.g. kill command or service manager)
  process.on('SIGTERM', () => {
    logger.info('⏹ Received SIGTERM signal. Shutting down.');
    signalSystemShutdown();
  });

  // this shouldn't happen since everything is in a try/catch block, but just in case
  process.on('uncaughtException', (error) => {
    logger.error(error, `🚨 Uncaught exception!`);
    logger.error('Shutting down.');
    signalSystemShutdown();
  });

  // listen for event before process exits, can still do async operations here
  process.on('beforeExit', async () => {
    await flushLogger();
  });

  // listen for exit event
  process.on('exit', (code) => {
    console.log(
      `👋 GPT-Assistant exited with code ${code ?? '<empty>'}. Goodbye!`,
    );
  });
}

/**
 * Manages the abort state of the entire application.
 */
const AppLevelAbortController = new AbortController();

/**
 * Create a new AbortController that will be aborted when the
 * main app controller is aborted.
 */
export function createChildAbortController() {
  return combineAbortControllers(
    AppLevelAbortController,
    new AbortController(),
  );
}

/**
 * Send signal to everything listening to abort signals to shutdown.
 * Note: since the controller is internal to this file, this is the only
 * way to signal a shutdown.
 */
export function signalSystemShutdown() {
  AppLevelAbortController.abort();
}

/**
 * Returns abort signal for app. Useful for logic that needs to react
 * to the app shutting down.
 */
export function getAppLevelAbortSignal() {
  return AppLevelAbortController.signal;
}
