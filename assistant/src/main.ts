import { runAssistantLoop } from './assistant';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'main' });

async function main() {
  // listen for Ctrl+C signal to shutdown
  process.on('SIGINT', () => {
    console.log('\n🔚 Received SIGINT signal. Shutting down.');
    process.stdin.setRawMode(false); // Restore terminal mode if set
    process.exit();
  });

  // listen for shutdown and log the exit code
  process.on('exit', async (code) => {
    console.log('🛑 Assistant exited with code:', code);
  });

  try {
    logger.info('🤖 GPT-Assistant starting up!');
    await runAssistantLoop();
    logger.info('🤖 GPT-Assistant shutting down.');
  } catch (error) {
    logger.error(
      error,
      "⚠️ That's bad. Unexpected error caused GPT-Assistant to shutdown.",
    );
    // return non-zero exit code to indicate failure
    process.exit(1);
  }
}

main();
