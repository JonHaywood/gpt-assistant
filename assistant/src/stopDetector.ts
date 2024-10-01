import { Porcupine } from '@picovoice/porcupine-node';
import path from 'path';
import { PICOVOICE_ACCESS_KEY } from './env';
import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'stopDetector' });

// instance of porcupine wake word engine
const porcupine = new Porcupine(
  PICOVOICE_ACCESS_KEY,
  [path.resolve('assets/cancel.ppn')],
  [0.5],
);

/**
 * Returns true if the stop command is detected in the provided buffer, otherwise false.
 */
export function detectStopCommand(buffer: AudioBuffer) {
  const keywordIndex = porcupine.process(buffer);
  if (keywordIndex === -1) return false;

  logger.info('✋ Stop command detected');
  return true;
}

export function shutdownStopDetector() {
  porcupine.release();
}
