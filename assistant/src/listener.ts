// @ts-nocheck
import { BuiltinKeyword, Porcupine } from '@picovoice/porcupine-node';
import { PvRecorder } from '@picovoice/pvrecorder-node';
import { handleAudioData } from './assistant';
import { PICOVOICE_ACCESS_KEY } from './env';
import { type AudioBuffer, ListenerDataCallback } from './listener.types';
import { parentLogger } from './logger';
import { playEffect, SoundEffect } from './soundEffects';
import { FRAME_LENGTH } from './wakeword';
import { settings } from './settings';

const logger = parentLogger.child({ filename: 'listener' });

/**
 * Continuously listens for audio data and passes it to the given callback.
 * @param callback - function to process each frame of audio data.
 * @param signal - AbortSignal to stop listening
 */
export async function listen(
  callback: ListenerDataCallback,
  signal: AbortSignal,
): Promise<void> {
  if (signal.aborted) throw new Error('Signal is already aborted');

  // create a new recorder instance
  const recorder = new PvRecorder(FRAME_LENGTH, settings.deviceIndex);

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
      handleAudioData(frame);
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
