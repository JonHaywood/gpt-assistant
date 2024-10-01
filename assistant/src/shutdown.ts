import { flushLogger, parentLogger } from './logger';
import { AppLevelAbortController } from './utils/abort';

const logger = parentLogger.child({ filename: 'shutdown' });

/**
 * Function to setup process shutdown handlers for graceful shutdown.
 */
export function setupProcessShutdownHandlers() {
  // listen for Ctrl+C signal to shutdown
  process.on('SIGINT', () => {
    console.log('\r');
    logger.info('⏹  Received SIGINT signal. Shutting down.');
    handleExternalShutdown();
  });

  // listen for when process is terminated (e.g. kill command or service manager)
  process.on('SIGTERM', () => {
    logger.info('⏹ Received SIGTERM signal. Shutting down.');
    handleExternalShutdown();
  });

  // this shouldn't happen since everything is in a try/catch block, but just in case
  process.on('uncaughtException', (error) => {
    logger.error(error, `🚨 Uncaught exception!`);
    logger.error('Shutting down.');
    handleExternalShutdown();
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

function handleExternalShutdown() {
  const abortController = AppLevelAbortController;
  abortController.abort(); // tell listener to stop
}
