import OpenAI from 'openai';
// @ts-ignore
import * as recorder from 'node-record-lpcm16';
import { PassThrough } from 'stream';

//const apiKey = 'your-api-key'; // Replace with your actual API key
//const openai = new OpenAI({ apiKey });

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  // Create a stream to pass audio data
  const audioStream = new PassThrough();

  // To accumulate the size of the audio data
  let totalBytes = 0;

  // Listen to the 'data' event to track audio data flow
  audioStream.on('data', (chunk) => {
    totalBytes += chunk.length;
    console.log(
      `Received ${chunk.length} bytes of audio data. Total: ${totalBytes} bytes`,
    );
  });

  // Start recording audio and pipe it to the stream
  const recording = recorder
    .start({
      sampleRateHertz: 16000,
      threshold: 0.5, // Silence threshold (between 0 and 1)
      verbose: true,
      recordProgram: 'arecord', // Using arecord for ALSA
    })
    .pipe(audioStream);

  console.log('Recording started...');

  await wait(10000); // Wait for 10 seconds

  // Stop recording audio
  recorder.stop();

  console.log('Recording stopped.');
  console.log(`Total audio data captured: ${totalBytes} bytes`);
}

main();
