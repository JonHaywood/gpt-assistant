import { flushLogger, parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'shutdown' });

/**
 * Function to setup process shutdown handlers for graceful shutdown.
 * @param abortController - AbortController to signal to stop listening
 */
export function setupProcessShutdownHandlers(abortController: AbortController) {
  // listen for Ctrl+C signal to shutdown
  process.on('SIGINT', () => {
    console.log('\r');
    logger.info('⏹  Received SIGINT signal. Shutting down.');
    handleExternalShutdown(abortController);
  });

  // listen for when process is terminated (e.g. kill command or service manager)
  process.on('SIGTERM', () => {
    logger.info('⏹ Received SIGTERM signal. Shutting down.');
    handleExternalShutdown(abortController);
  });

  // this shouldn't happen since everything is in a try/catch block, but just in case
  process.on('uncaughtException', (error) => {
    logger.error('🚨 Uncaught exception:', error);
    logger.error('Shutting down.');
    handleExternalShutdown(abortController);
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

function handleExternalShutdown(abortController: AbortController) {
  abortController.abort(); // tell listener to stop
}
