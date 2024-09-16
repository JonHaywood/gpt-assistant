import OpenAI from 'openai';
// @ts-ignore
import * as recorder from 'node-record-lpcm16';
import { PassThrough } from 'stream';
import { createWriteStream } from 'fs';

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const file = createWriteStream('test.wav', { encoding: 'binary' });

  // Start recording audio and pipe it to the stream
  const recording = recorder.record({
    device: 'hw:1,0',
    recorder: 'arecord', // Using arecord for ALSA
  });

  recording
    .stream()
    .on('error', (err: any) => {
      console.error('recorder threw an error:', err);
    })
    .pipe(file);

  console.log('Recording started...');

  await wait(5000); // Wait for 5 seconds

  // Stop recording audio
  recording.stop();

  console.log('Recording stopped.');
}

main();
