import fs from 'fs/promises';
// @ts-ignore
import { parentLogger } from './logger';
import { Readable } from 'stream';
import { spawn } from 'child_process';

const logger = parentLogger.child({ filename: 'soundEffects' });

// cache sound effects in memory so they can be played quickly
const effectBufferMap = new Map<SoundEffect, Buffer>();

export enum SoundEffect {
  BEEP = 'beep',
}

export async function loadEffectsIntoMemory() {
  for (const effect of Object.values(SoundEffect)) {
    const filePath = `./assets/${effect}.wav`;
    try {
      const buffer = await fs.readFile(filePath);
      effectBufferMap.set(effect, buffer);
    } catch (error) {
      logger.error(error, `Error loading sound effect: ${effect}`);
      throw error;
    }
  }
}

export async function playEffect(effect: SoundEffect) {
  const audioBuffer = effectBufferMap.get(effect);
  if (!audioBuffer)
    throw new Error(
      `Sound effect not found: ${effect}. Ensure loadEffectsIntoMemory was called first.`,
    );

  logger.trace(`🔊 Playing sound effect: ${effect}`);

  // use aplay OS command to play audio
  const aplay = spawn('aplay', ['-']);

  // Pipe audio buffer directly into aplay stdin. This is faster than
  // reading from the file each time.
  Readable.from(audioBuffer).pipe(aplay.stdin);

  aplay.on('error', (error: any) => {
    logger.error(error, `Error playing sound effect: ${effect}`);
  });

  aplay.on('close', (code) => {
    if (code === 0) return;
    logger.debug(`aplay process exited with code ${code}`);
  });
}
