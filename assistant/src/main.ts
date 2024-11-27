import { handleAudioData } from './assistantRunner';
import { ASSISTANT_GREETING } from './config';
import { listen } from './listener';
import { parentLogger } from './logger';
import { setupProcessShutdownHandlers } from './shutdown';
import { loadEffectsIntoMemory } from './soundEffects';
import { speak, startPiperTTSProcess, stopPiperTTSProcess } from './speak';
import { shutdownStopDetector } from './stopDetector';
import { shutdownWakewordEngine } from './wakeword';

const logger = parentLogger.child({ filename: 'main' });

async function main() {
  try {
    logger.info('🤖 GPT-Assistant starting up!');

    // gracefully handle app/process shutdown
    setupProcessShutdownHandlers();

    // load all sound effects into memory
    await loadEffectsIntoMemory();

    // start the first TTS process
    startPiperTTSProcess();

    // greet the user
    await speak(ASSISTANT_GREETING);

    // start the listening loop
    await listen(handleAudioData);

    // stop the TTS process
    stopPiperTTSProcess();

    // shutdown all other services
    shutdownStopDetector();
    shutdownWakewordEngine();

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
