import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';
import { playEffect, SoundEffect } from './soundEffects';
import { detectWakeword } from './wakeword';

const logger = parentLogger.child({ filename: 'assistant' });

/**
 * Function that is invoked for every chunk/frame of audio data
 * received from the microphone.
 */
export async function handleAudioData(frame: AudioBuffer) {
  const isWakeword = detectWakeword(frame);

  // TODO: instead of returning, handle assistant logic here
  if (!isWakeword) return;

  logger.info('📶 Wake word detected!');

  // play sound effect to indicate wake word detection
  playEffect(SoundEffect.BEEP);
}

class Assistant {
  audioBuffers: AudioBuffer[];

  constructor(initialAudioBuffer: AudioBuffer) {
    this.audioBuffers = [initialAudioBuffer];
  }

  start() {
    logger.info('🧠 Starting assistant loop...');
  }
}
