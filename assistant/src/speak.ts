import { spawn } from 'child_process';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'speak' });

// manages killing the piper and aplay commands
let abortController: AbortController | null = null;

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
  // stop any existing TTS processes
  if (abortController) {
    logger.info('🔇 Stopping previous speaking...');
    abortController.abort();
  }

  // manages the abort signal for the child processes
  abortController = new AbortController();
  const { signal } = abortController;

  logger.info(`🔊 Speaking: ${text}`);

  return new Promise((resolve, reject) => {
    try {
      // Piper command with the necessary parameters to output raw audio
      const piperProcess = spawn(
        'piper',
        [
          '--model',
          'assets/voice.onnx',
          '--config',
          'assets/voice.onnx.json',
          '--output-raw',
        ],
        { signal },
      );

      // aplay command with appropriate settings for playing raw audio
      const aplayProcess = spawn(
        'aplay',
        ['-r', '22050', '-f', 'S16_LE', '-t', 'raw', '-'],
        { signal },
      );

      // Pipe Piper's stdout (raw audio) into aplay's stdin
      piperProcess.stdout.pipe(aplayProcess.stdin);

      // Handle errors from piper
      piperProcess.on('error', (error) => {
        logger.error(`Error running Piper: ${error.message}`);
      });

      // Handle errors from aplay
      aplayProcess.on('error', (error) => {
        logger.error(`Error running aplay: ${error.message}`);
      });

      // Send the input text to Piper's stdin
      piperProcess.stdin.write(text);
      piperProcess.stdin.end(); // Signal end of input

      // Log when Piper process finishes
      piperProcess.on('close', (code) => {
        logger.debug(`Piper TTS process finished with exit code ${code}`);
      });

      // Log when aplay process finishes
      aplayProcess.on('close', (code) => {
        logger.debug(`aplay process finished with exit code ${code}`);
        logger.info('🔊 Speaking finished.');
        abortController = null;
        resolve();
      });
    } catch (error) {
      logger.error(error, 'Error occurred during TTS processing.');
      reject(error);
    }
  });
}
