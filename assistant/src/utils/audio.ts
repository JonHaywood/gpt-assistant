import { type AudioBuffer } from 'src/listener.types';

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
