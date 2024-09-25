import { Porcupine, BuiltinKeyword } from '@picovoice/porcupine-node';
import { PICOVOICE_ACCESS_KEY } from './env';
import { type AudioBuffer } from './listener.types';
import { settings } from './settings';

// instance of porcupine wake word engine
const porcupine = new Porcupine(
  PICOVOICE_ACCESS_KEY,
  [BuiltinKeyword.COMPUTER],
  [settings.wakeworkThreshold],
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
