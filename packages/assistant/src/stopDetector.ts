import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';
import { stopWakeWord } from './picovoice';

const logger = parentLogger.child({ filename: 'stopDetector' });

/**
 * Returns true if the stop command is detected in the provided buffer, otherwise false.
 */
export function detectStopCommand(buffer: AudioBuffer) {
  const keywordIndex = stopWakeWord.process(buffer);
  if (keywordIndex === -1) return false;

  logger.info('✋ Stop command detected');
  return true;
}

export function shutdownStopDetector() {
  stopWakeWord.release();
}
