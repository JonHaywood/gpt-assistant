import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'speak' });

// manages killing the aplay command
let speakerAbortController: AbortController | null = null;

let isPiperShuttingDown = false;
let piperProcess: ChildProcessWithoutNullStreams;

/**
 * Starts a new Piper TTS process. Unless the stop function is called,
 * a new process will be started when the current one finishes. This
 * grealty reduces the time it takes to start speaking text, likely
 * because the tts model is already loaded into memory.
 */
export function startPiperTTSProcess() {
  logger.info('Starting new Piper TTS process...');

  // Piper command with the necessary parameters to output raw audio
  // and stream it to aplay
  piperProcess = spawn('piper', [
    '--model',
    'assets/voice.onnx',
    '--config',
    'assets/voice.onnx.json',
    '--output-raw',
  ]);

  // Handle errors from piper
  piperProcess.on('error', (error) => {
    logger.error(`Error running Piper: ${error.message}`);
  });

  // Log when Piper process finishes
  piperProcess.on('close', (code) => {
    if (isPiperShuttingDown) return;

    // restart the process, kill the current one, start a new one
    logger.debug(
      `Piper TTS process finished with exit code ${code}. Restarting...`,
    );
    piperProcess.kill();
    startPiperTTSProcess();
  });
}

export function stopPiperTTSProcess() {
  logger.info('Stopping Piper TTS process.');
  isPiperShuttingDown = true;
  piperProcess.kill();
}

/**
 * Function that uses piper tts to speak the given text.
 * It does the equivalent of running:
 *
 * echo 'Speak this text.' | \
 * ./piper --model voice.onnx --output-raw | \
 * aplay -r 22050 -f S16_LE -t raw -
 *
 * Which will stream raw audio from piper to stdout as its produced
 * and use aplay to play it.
 */
export function speak(text: string): Promise<void> {
  // stop existing speaking
  if (speakerAbortController) {
    logger.info('🔇 Stopping previous speaking...');
    speakerAbortController.abort();
  }

  // manages the abort signal for the child speaker processes
  speakerAbortController = new AbortController();
  const { signal } = speakerAbortController;

  logger.info(`🔊 Speaking: ${text}`);

  return new Promise((resolve, reject) => {
    try {
      // aplay command with appropriate settings for playing raw audio
      const aplayProcess = spawn(
        'aplay',
        ['-r', '22050', '-f', 'S16_LE', '-t', 'raw', '-'],
        { signal },
      );

      // Handle errors from aplay
      aplayProcess.on('error', (error) => {
        logger.error(`Error running aplay: ${error.message}`);
      });

      // Log when aplay process finishes
      aplayProcess.on('close', (code) => {
        logger.debug(`aplay process finished with exit code ${code}`);
        logger.info('🔊 Speaking finished.');
        speakerAbortController = null;
        resolve();
      });

      // Pipe Piper's stdout (raw audio) into aplay's stdin
      piperProcess.stdout.pipe(aplayProcess.stdin);

      // Send the input text to Piper's stdin
      piperProcess.stdin.write(text);
      piperProcess.stdin.end(); // Signal end of input
    } catch (error) {
      logger.error(error, 'Error occurred during TTS processing.');
      reject(error);
    }
  });
}
