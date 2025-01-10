import fs from 'fs/promises';
import { parentLogger } from './logger';
import { Readable } from 'stream';
import { spawn } from 'child_process';

const logger = parentLogger.child({ filename: 'soundEffects' });

// cache sound effects in memory so they can be played quickly
const effectBufferMap = new Map<InMemorySoundEffect, Buffer>();

export enum InMemorySoundEffect {
  BEEP = 'beep',
}

export enum FileSoundEffect {
  STARTUP = 'startup',
}

export async function loadEffectsIntoMemory() {
  logger.info('Loading sound effects into memory...');

  for (const effect of Object.values(InMemorySoundEffect)) {
    const filePath = `./assets/${effect}.wav`;
    try {
      const buffer = await fs.readFile(filePath);
      effectBufferMap.set(effect, buffer);
    } catch (error) {
      logger.error(error, `Error loading sound effect: ${effect}`);
      throw error;
    }
  }

  logger.info('Sound effects loaded successfully.');
}

export function playEffect(effect: InMemorySoundEffect): void;
export function playEffect(effect: FileSoundEffect): void;

export function playEffect(
  effect: InMemorySoundEffect | FileSoundEffect,
): void {
  if (
    Object.values(InMemorySoundEffect).includes(effect as InMemorySoundEffect)
  ) {
    playEffectFromMemory(effect as InMemorySoundEffect);
  } else {
    playEffectFromFile(effect as FileSoundEffect);
  }
}

/**
 * Spawns aplay OS command to asynchronously play the given sound effect.
 */
function playEffectFromMemory(effect: InMemorySoundEffect) {
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

  aplay.on('error', (error) => {
    logger.error(error, `Error playing sound effect: ${effect}`);
  });

  aplay.on('close', (code) => {
    if (code === 0) return;
    logger.debug(`aplay process exited with code ${code}`);
  });
}

/**
 * Spawns aplay OS command to asynchronously play the given sound effect
 * directly from the specified file.
 */
function playEffectFromFile(effect: FileSoundEffect) {
  const filePath = `./assets/${effect}.wav`;
  logger.trace(`🔊 Playing sound effect from file: ${filePath}`);

  // use aplay OS command to play audio
  const aplay = spawn('aplay', [filePath]);

  aplay.on('error', (error) => {
    logger.error(error, `Error playing sound effect: ${effect}`);
  });

  aplay.on('close', (code) => {
    if (code === 0) return;
    logger.debug(`aplay process exited with code ${code}`);
  });
}
