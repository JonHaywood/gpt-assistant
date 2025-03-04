import { ListenerDataCallback } from './listener.types';
import { parentLogger } from './logger';
import { recorder } from './picovoice';
import { getAppLevelAbortSignal } from './shutdown';

const logger = parentLogger.child({ filename: 'listener' });

export const SAMPLE_RATE = recorder.sampleRate;

/**
 * Continuously listens for audio data and passes it to the given callback.
 * @param callback - function to process each frame of audio data.
 */
export async function listen(callback: ListenerDataCallback): Promise<void> {
  const signal = getAppLevelAbortSignal();
  if (signal.aborted) throw new Error('Signal is already aborted');

  // listen for abort signal
  const abortHandler = () => {
    logger.info('⛔ Received abort signal, stopping listening...');
  };
  // { once: true } removes listener after abort is called
  signal.addEventListener('abort', abortHandler, { once: true });

  try {
    logger.info('👂 Started listening for audio...');

    // actually start recording audio
    recorder.start();

    // listen until stopped
    while (!signal.aborted && recorder.isRecording) {
      const frame = await recorder.read();

      // pass frame to callback for processing. Is async but not awaited
      // to allow this loop to continue listening.
      callback(frame);
    }

    logger.debug('🔚 Listening ended.');
  } catch (error) {
    logger.error(error, 'Error occurred listening for audio.');
    throw error;
  } finally {
    // if abort is never called, still need to remove the listener to prevent memory leak
    signal.removeEventListener('abort', abortHandler);

    recorder.stop();
  }
}
