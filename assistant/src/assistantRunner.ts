// @ts-ignore
import { Assistant } from './assistant';
import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';
import { playEffect, SoundEffect } from './soundEffects';
import { detectWakeword } from './wakeword';

const logger = parentLogger.child({ filename: 'assistantRunner' });

/**
 * Function that is invoked for every chunk/frame of audio data
 * received from the microphone.
 */
export async function handleAudioData(frame: AudioBuffer) {
  const isWakeword = detectWakeword(frame);

  if (isWakeword) {
    logger.info('📶 Wake word detected!');

    // play sound effect to indicate wake word detection
    playEffect(SoundEffect.BEEP);

    // TODO: stop the current assistant if it's running

    // start a new assistant loop
    logger.info('🧠 Starting assistant loop...');
    Assistant.startNewAssistant(frame);
    return;
  }

  // pass audio data to the currently running assistant
  const runningAssistant = Assistant.getRunninngInstance();
  if (!runningAssistant) return;

  await runningAssistant.handleAudioData(frame);
}
