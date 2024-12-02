import { Transform } from 'stream';
import Meyda from 'meyda';
import { sendMessageToSseServer } from '../sseServer/launch';

// PCM to Float32 conversion
function pcmToFloat32(buffer: Buffer): Float32Array {
  const int16 = new Int16Array(
    buffer.buffer,
    buffer.byteOffset,
    buffer.byteLength / Int16Array.BYTES_PER_ELEMENT,
  );
  return Float32Array.from(int16).map((sample) => sample / 32768); // normalize to [-1, 1]
}

// downsample to 16 frequency bands
function downsampleFrequencies(data: number[], bands: number): number[] {
  const factor = Math.floor(data.length / bands);
  const reduced = new Array(bands).fill(0);
  for (let i = 0; i < bands; i++) {
    reduced[i] =
      data
        .slice(i * factor, (i + 1) * factor)
        .reduce((sum, val) => sum + val, 0) / factor;
  }
  return reduced;
}

// aggregation buffer for frequency data
let frequencyBuffer: number[][] = [];
let intervalHandle: NodeJS.Timeout | null = null;
const UPDATE_INTERVAL_MS = 100; // send data every 100ms

/**
 * Periodically sends aggregated frequency data to the SSE server
 * to push to the frontend for visualization.
 */
export function startSendingVisualizationData(): void {
  intervalHandle = setInterval(() => {
    if (frequencyBuffer.length === 0) return;

    // average the frequency data so that the visualization is smoother
    // and less janky b/c different chunks may vary significantly
    const averagedFrequencies = frequencyBuffer
      .reduce((acc, freqs) => {
        return acc.map((val, i) => val + freqs[i]);
      }, new Array(16).fill(0))
      .map((val) => val / frequencyBuffer.length);

    // send to the SSE server
    sendMessageToSseServer(JSON.stringify(averagedFrequencies));

    frequencyBuffer = []; // clear the buffer
  }, UPDATE_INTERVAL_MS);
}

/**
 * Stops sending visualization data.
 */
export function stopSendingVisualizationData(): void {
  if (!intervalHandle) return;
  clearInterval(intervalHandle);
  intervalHandle = null;
  frequencyBuffer = [];
}

// transform stream to process audio data for visualization
export const visualizationProcessor = new Transform({
  transform(chunk, _encoding, callback) {
    // convert PCM to Float32 and calculate frequency data
    const floatData = pcmToFloat32(chunk);

    // Calculate amplitude spectrum using Meyda
    const amplitudeSpectrum = Meyda.extract(
      'amplitudeSpectrum',
      floatData,
    ) as number[];
    const frequencies = downsampleFrequencies(amplitudeSpectrum, 16); // Downsample to 16 bands

    // add to aggregation buffer
    frequencyBuffer.push(frequencies);

    this.push(chunk); // pass the audio chunk unchanged to the next process
    callback();
  },
});
