import Meyda from 'meyda';
import { Transform } from 'stream';
import { parentLogger } from '../logger';
import { sendMessageToSseServer } from '../sseServer/launch';

const logger = parentLogger.child({ module: 'visualizationProcessor' });

// PCM to Float32 conversion
function pcmToFloat32(input: Buffer): Float32Array {
  const output = new Float32Array(input.length);
  for (let i = 0; i < input.length; i++) {
    output[i] = input[i] / 32768; // Normalize to [-1.0, 1.0]
  }
  return output;
}

// Adjust buffer to the nearest power of 2 for Meyda
function adjustBufferToPowerOfTwo(buffer: Float32Array): Float32Array {
  const length = buffer.length;
  const powerOfTwo = Math.pow(2, Math.floor(Math.log2(length)));

  // Trim if the buffer is larger than the nearest power of 2
  if (length > powerOfTwo) {
    return buffer.slice(0, powerOfTwo);
  }

  // Pad with zeros if the buffer is smaller
  const adjustedBuffer = new Float32Array(powerOfTwo);
  adjustedBuffer.set(buffer); // Copy existing data
  return adjustedBuffer;
}

// downsample to specified frequency bands
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
    // const averagedFrequencies = frequencyBuffer
    //   .reduce((acc, freqs) => {
    //     return acc.map((val, i) => val + freqs[i]);
    //   }, new Array(16).fill(0))
    //   .map((val) => val / frequencyBuffer.length);

    // send to the SSE server
    sendMessageToSseServer(JSON.stringify(frequencyBuffer));

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

/**
 * Extracts frequency data from the audio chunk and adds it to the aggregation buffer.
 */
function extractFrequencyData(chunk: Buffer) {
  try {
    // convert PCM to Float32 and calculate frequency data
    let floatData = pcmToFloat32(chunk);
    floatData = adjustBufferToPowerOfTwo(floatData);

    // Calculate amplitude spectrum using Meyda
    const amplitudeSpectrum = Meyda.extract(
      'amplitudeSpectrum',
      floatData,
    ) as number[];
    //const frequencies = downsampleFrequencies(amplitudeSpectrum, 32); // Downsample to 32 bands

    // add to aggregation buffer
    frequencyBuffer.push(amplitudeSpectrum);
  } catch (e) {
    logger.error(e, 'Error extracting frequency data:');
  }
}

/**
 * Transform stream to process audio data for visualization.
 * Note: creates a new instance for each audio chunk because transforms are stateful.
 */
export function createVisualizationProcessor() {
  return new Transform({
    transform(chunk, _encoding, callback) {
      // extract frequency data from the audio chunk
      extractFrequencyData(chunk);

      this.push(chunk); // pass the audio chunk unchanged to the next process
      callback();
    },
  });
}
