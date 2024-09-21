// @ts-ignore
import wavPlayer from 'node-wav-player';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'soundEffects' });

export enum SoundEffect {
  BEEP = 'beep',
}

export async function playEffect(effect: SoundEffect) {
  const filePath = `./assets/${effect}.wav`;
  try {
    logger.trace(`🔊 Playing sound effect: ${effect}`);
    await wavPlayer.play({ path: filePath });
  } catch (error) {
    logger.error(error, `Error playing sound effect: ${effect}`);
  }
}
