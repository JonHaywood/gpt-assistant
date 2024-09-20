import OpenAI from 'openai';
import { listen } from './listener';
import { recognize } from './recognizer';
import fs from 'fs';

async function main() {
  console.log('Starting listening...');

  try {
    const audioBuffer = await listen({
      silenceDuration: 2,
      phraseTimeLimit: 5,
    });
    console.log(`Received audio buffer of length ${audioBuffer.length}`);
    //fs.writeFileSync('audio.raw', audioBuffer);

    const text = await recognize(audioBuffer);
    console.log('Transcription:', text);
  } catch (error) {
    console.error('Error listening:', error);
  }
}

main();
