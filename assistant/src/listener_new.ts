// @ts-ignore
import * as recorder from 'node-record-lpcm16';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'listener' });

const SAMPLE_RATE = 16000; // typical sample rate for speech recognition is 16kHz
const IGNORED_EXIT_CODES = [1, null]; // known exit codes to ignore

function isErrorWithIgnoredExitCode(err: any): boolean {
  return (
    typeof err === 'string' &&
    // arecord will exit with error code 1 or null even if recording is successful,
    // likely due to the way it is being killed
    IGNORED_EXIT_CODES.some((code) => err.includes(`error code ${code}`))
  );
}

export interface AudioDataBuffer extends Int16Array {}

export interface ListenerDataCallback {
  (data: AudioDataBuffer): void;
}

/**
 * Continuously listens for audio data and processes it with the given callback.
 * @param callback - function to process audio data. Note: this function *should not block*.
 * Any blocking operations should be done asynchronously and await to allow the main loop to
 * continue listening.
 * @param signal - AbortSignal to stop listening
 */
export function listen(
  callback: ListenerDataCallback,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) throw new Error('Signal is already aborted');

  return new Promise((resolve, reject) => {
    logger.info('👂 Started listening for audio...');

    const recording = recorder.record({
      audioType: 'raw',
      device: 'hw:1,0', // use hardware device at card 1, device 0. Found by running `arecord -l`
      recorder: 'arecord', // Using arecord for ALSA
      sampleRate: SAMPLE_RATE, // sample rate in kHz
    });

    // listen for abort signal
    const abortHandler = () => {
      logger.info('⛔ Received abort signal, stopping listening...');
      recording.stop();
    };
    // { once: true } removes listener after abort is called
    signal.addEventListener('abort', abortHandler, { once: true });

    try {
      // process each chunk of audio data
      recording
        .stream()
        .on('data', async (data: AudioDataBuffer) => {
          try {
            callback(data);
          } catch (error) {
            logger.error(error, `Error occurred processing audio data.`);
          }
        })
        .on('error', (err: any) => {
          // check for known exit codes and ignore them
          if (isErrorWithIgnoredExitCode(err)) {
            logger.debug('arecord finished with a known exit code, ignoring.');
            return;
          }
          logger.error(`arecord threw an error: "${JSON.stringify(err)}"`);
          reject(err);
        })
        .on('end', () => {
          logger.debug('🔚 Listening ended.');
          resolve();
        });
    } finally {
      // if abort is never called, still need to remove the listener to prevent memory leak
      signal.removeEventListener('abort', abortHandler);
    }
  });
}
