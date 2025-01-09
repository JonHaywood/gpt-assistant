import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';
import { assistantWakeWord } from './picovoice';

const logger = parentLogger.child({ filename: 'wakeword' });

export function detectWakeword(frame: AudioBuffer): boolean {
  // see: https://picovoice.ai/docs/api/porcupine-nodejs/#porcupineprocess
  // process a single frame of audio
  // NOTE: this IS blocking, but should be very fast
  const keywordIndex = assistantWakeWord.process(frame);

  // only using one keyword, so if the index is not -1, then the keyword was detected
  return keywordIndex !== -1;
}

export function shutdownWakewordEngine() {
  logger.info(' Shutting down wakeword engine.');
  assistantWakeWord.release();
}
