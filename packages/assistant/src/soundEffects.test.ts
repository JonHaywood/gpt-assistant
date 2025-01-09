import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadEffectsIntoMemory,
  playEffect,
  playSoundEffectFromFile,
  SoundEffect,
  FileSoundEffect,
} from './soundEffects';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import { parentLogger } from './logger';

type Logger = ReturnType<typeof parentLogger.child>;

const mockRefs = vi.hoisted(() => {
  return {
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    } as unknown as Logger,
  };
});

vi.mock('fs/promises');
vi.mock('child_process');
vi.mock('./logger', () => ({
  parentLogger: {
    child: vi.fn().mockReturnValue(mockRefs.logger),
  },
}));

describe('soundEffects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loadEffectsIntoMemory', () => {
    it.skip('should load sound effects into memory', async () => {
      const mockBuffer = Buffer.from('mock data');
      vi.mocked(fs.readFile).mockResolvedValue(mockBuffer);

      await loadEffectsIntoMemory();

      expect(fs.readFile).toHaveBeenCalledWith('./assets/beep.wav');
      expect(mockRefs.logger.info).toHaveBeenCalledWith(
        'Loading sound effects into memory...',
      );
      expect(mockRefs.logger.info).toHaveBeenCalledWith(
        'Sound effects loaded successfully.',
      );
    });

    it.skip('should log an error if loading a sound effect fails', async () => {
      const mockError = new Error('mock error');
      vi.mocked(fs.readFile).mockRejectedValue(mockError);

      await expect(loadEffectsIntoMemory()).rejects.toThrow(mockError);

      expect(mockRefs.logger.error).toHaveBeenCalledWith(
        mockError,
        'Error loading sound effect: beep',
      );
    });
  });

  describe('playEffect', () => {
    it.skip('should play a sound effect from memory', () => {
      const mockBuffer = Buffer.from('mock data');
      const mockSpawn = {
        stdin: {
          pipe: vi.fn(),
        },
        on: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(
        mockSpawn as unknown as ReturnType<typeof spawn>,
      );

      playEffect(SoundEffect.BEEP);

      expect(mockRefs.logger.trace).toHaveBeenCalledWith(
        '🔊 Playing sound effect: beep',
      );
      expect(mockSpawn.stdin.pipe).toHaveBeenCalled();
      expect(mockSpawn.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSpawn.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it.skip('should throw an error if the sound effect is not found in memory', () => {
      expect(() => playEffect(SoundEffect.BEEP)).toThrow(
        'Sound effect not found: beep. Ensure loadEffectsIntoMemory was called first.',
      );
    });

    it.skip('should log an error if playing the sound effect fails', () => {
      const mockBuffer = Buffer.from('mock data');
      const mockError = new Error('mock error');
      const mockSpawn = {
        stdin: {
          pipe: vi.fn(),
        },
        on: vi.fn((event, callback) => {
          if (event === 'error') callback(mockError);
        }),
      };
      vi.mocked(spawn).mockReturnValue(
        mockSpawn as unknown as ReturnType<typeof spawn>,
      );
      effectBufferMap.set(SoundEffect.BEEP, mockBuffer);

      playEffect(SoundEffect.BEEP);

      expect(mockRefs.logger.error).toHaveBeenCalledWith(
        mockError,
        'Error playing sound effect: beep',
      );
    });
  });

  describe('playSoundEffectFromFile', () => {
    it.skip('should play a sound effect from file', () => {
      const mockSpawn = {
        on: vi.fn(),
      };
      vi.mocked(spawn).mockReturnValue(
        mockSpawn as unknown as ReturnType<typeof spawn>,
      );

      playSoundEffectFromFile(FileSoundEffect.STARTUP);

      expect(logger.trace).toHaveBeenCalledWith(
        '🔊 Playing sound effect from file: ./assets/startup.wav',
      );
      expect(mockSpawn.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockSpawn.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it.skip('should log an error if playing the sound effect from file fails', () => {
      const mockError = new Error('mock error');
      const mockSpawn = {
        on: vi.fn((event, callback) => {
          if (event === 'error') callback(mockError);
        }),
      };
      vi.mocked(spawn).mockReturnValue(
        mockSpawn as unknown as ReturnType<typeof spawn>,
      );

      playSoundEffectFromFile(FileSoundEffect.STARTUP);

      expect(logger.error).toHaveBeenCalledWith(
        mockError,
        'Error playing sound effect: startup',
      );
    });
  });
});
