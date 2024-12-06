import { spawn } from 'child_process';
import { parentLogger } from '../logger';
import { createChildAbortController } from '../shutdown';
import { sendMessageToSseServer } from '../sseServer/manager';
import { SseEvent } from '../sseServer/message';
import { AbortErrorMessage } from '../utils/abort';
import { getCurrentPiperTTSProcess } from './textToSpeech';

const logger = parentLogger.child({ filename: 'speak' });

let speakerAbortController: AbortController | null = null;

/**
 * Takes the provided text and converts it to audio using the
 * Piper TTS model and plays it using aplay.
 */
export function speak(text: string): Promise<void> {
  // stop any existing speaking
  stopCurrentSpeaking();

  // manages the abort signal for the child speaker process
  speakerAbortController = createChildAbortController();
  const { signal } = speakerAbortController;

  logger.info(`🔊 Speaking: ${text}`);

  return new Promise((resolve, reject) => {
    // aplay command with appropriate settings for playing raw audio
    // prettier-ignore
    const aplayProcess = spawn(
      'aplay',
      [
        '-r', '22050',  // Sets the sample rate to 22050 Hz (samples per second)
        '-f', 'S16_LE', // Specifies the audio format as 16-bit signed little-endian
        '-t', 'raw',    // Indicates that the input audio data is raw (no headers, plain PCM data)
        '-'],           // Specifies audio data comes from stdin, allowing piping of audio data directly into the command
      { signal },
    );

    // Handle errors from aplay
    aplayProcess.on('error', (error) => {
      if (error.message === AbortErrorMessage) return;
      logger.error(`Error running aplay: ${error.message}`);

      // Send a message to the SSE server that we are no longer speaking
      sendMessageToSseServer({ event: SseEvent.SPEAKING, data: false });

      reject(error);
    });

    // Log when aplay process finishes
    aplayProcess.on('close', (code) => {
      logger.debug(`aplay process finished with exit code ${code}`);
      logger.info('🔊 Speaking finished.');
      speakerAbortController = null;

      // Send a message to the SSE server that we are no longer speaking
      sendMessageToSseServer({ event: SseEvent.SPEAKING, data: false });

      resolve();
    });

    // get a reference to the current piper process
    const piperProcess = getCurrentPiperTTSProcess();

    // Pipe Piper's stdout (raw audio) into aplay's stdin
    piperProcess.stdout.pipe(aplayProcess.stdin).on('error', (error) => {
      // Ignore EPIPE errors, which occur when aplay is killed before finishing
      if ((error as NodeJS.ErrnoException).code === 'EPIPE') return;
      logger.error(`Error piping audio from Piper TTS to aplay: ${error}`);
      reject(error);
    });

    // Send a message to the SSE server that we are speaking
    sendMessageToSseServer({ event: SseEvent.SPEAKING, data: true });

    // Send the input text to Piper's stdin
    piperProcess.stdin.write(text);
    piperProcess.stdin.end(); // Signal end of input
  });
}

/**
 * If speaking, stops the current speaking process.
 */
export function stopCurrentSpeaking() {
  if (!speakerAbortController) return;

  logger.info('🔇 Stopping speaking...');
  speakerAbortController.abort();
}
