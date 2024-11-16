import { handleAudioData } from './assistantRunner';
import { listen } from './listener';
import { parentLogger } from './logger';
import { setupProcessShutdownHandlers } from './shutdown';
import { loadEffectsIntoMemory } from './soundEffects';
import { startPiperTTSProcess, stopPiperTTSProcess } from './speak';
import { shutdownStopDetector } from './stopDetector';
import { shutdownWakewordEngine } from './wakeword';
import { startWebSocketServer, stopWebSocketServer } from './webSocket/main';

const logger = parentLogger.child({ filename: 'main' });

async function main() {
  try {
    logger.info('🤖 GPT-Assistant starting up!');

    // gracefully handle app/process shutdown
    setupProcessShutdownHandlers();

    // start the WebSocket server for log streaming
    await startWebSocketServer();

    // load all sound effects into memory
    await loadEffectsIntoMemory();

    // start the first TTS process
    startPiperTTSProcess();

    // start the listening loop
    await listen(handleAudioData);

    // stop the TTS process
    stopPiperTTSProcess();

    // stop the WebSocket server
    await stopWebSocketServer();

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
