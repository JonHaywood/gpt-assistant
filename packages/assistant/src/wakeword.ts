import { Porcupine } from '@picovoice/porcupine-node';
import path from 'path';
import {
  ASSISTANT_NAME,
  ASSISTANT_NAME_IS_CUSTOM,
  PICOVOICE_ACCESS_KEY,
  WAKEWORD_THRESHOLD,
} from './config';
import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'wakeword' });

// instance of porcupine wake word engine
const porcupine = new Porcupine(
  PICOVOICE_ACCESS_KEY,
  [
    ASSISTANT_NAME_IS_CUSTOM
      ? path.resolve(`assets/${ASSISTANT_NAME.toLowerCase()}.ppn`)
      : ASSISTANT_NAME, // NOTE: if string is not a built-in keyword this will fail
  ],
  [WAKEWORD_THRESHOLD],
);

export const FRAME_LENGTH = porcupine.frameLength; // should be 512

export function detectWakeword(frame: AudioBuffer): boolean {
  // see: https://picovoice.ai/docs/api/porcupine-nodejs/#porcupineprocess
  // process a single frame of audio
  // NOTE: this IS blocking, but should be very fast
  const keywordIndex = porcupine.process(frame);

  // only using one keyword, so if the index is not -1, then the keyword was detected
  return keywordIndex !== -1;
}

export function shutdownWakewordEngine() {
  logger.info(' Shutting down wakeword engine.');
  porcupine.release();
}
