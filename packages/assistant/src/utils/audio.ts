import { WaveFile } from 'wavefile';
import { type AudioBuffer } from '../listener.types';

export function concatAudioBuffers(buffers: AudioBuffer[]): AudioBuffer {
  const totalLength = buffers.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Int16Array(totalLength);

  let offset = 0;
  for (const buffer of buffers) {
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

/**
 * Returns the duration of the frame in milliseconds.
 */
export function frameDuration(frame: AudioBuffer, sampleRate: number): number {
  return (frame.length / sampleRate) * 1000;
}

/**
 * Converts raw audio data to a WAV file buffer.
 */
export function convertRawAudioToWav(buffer: AudioBuffer, sampleRate: number) {
  const wav = new WaveFile();
  wav.fromScratch(1, sampleRate, '16', buffer);
  return wav.toBuffer();
}
