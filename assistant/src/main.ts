import { handleAudioData } from './assistantRunner';
import { listen } from './listener';
import { parentLogger } from './logger';
import { setupProcessShutdownHandlers } from './shutdown';
import { loadEffectsIntoMemory } from './soundEffects';

const logger = parentLogger.child({ filename: 'main' });

async function main() {
  // used to signal to listener to stop listening
  const abortController = new AbortController();

  try {
    logger.info('🤖 GPT-Assistant starting up!');

    // gracefully handle process shutdown
    setupProcessShutdownHandlers(abortController);

    // load all sound effects into memory
    await loadEffectsIntoMemory();

    // start the listening loop
    await listen(handleAudioData, abortController.signal);

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
