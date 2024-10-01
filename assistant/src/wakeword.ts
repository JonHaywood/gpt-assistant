import { Porcupine, BuiltinKeyword } from '@picovoice/porcupine-node';
import {
  ASSISTANT_NAME,
  PICOVOICE_ACCESS_KEY,
  WAKEWORD_THRESHOLD,
} from './env';
import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'wakeword' });

// matchup assistant name to keyword
let builtInKeyword: string | undefined;
for (const keyword of Object.values(BuiltinKeyword)) {
  if (keyword.toLowerCase() === ASSISTANT_NAME.toLowerCase()) {
    builtInKeyword = keyword;
    break;
  }
}
if (!builtInKeyword)
  throw new Error(
    `No built-in keyword found for assistant name: ${ASSISTANT_NAME}`,
  );

// instance of porcupine wake word engine
const porcupine = new Porcupine(
  PICOVOICE_ACCESS_KEY,
  [builtInKeyword],
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
