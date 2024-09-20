import OpenAI from 'openai';
import * as Recognizer from './recognizer';
import fs from 'fs';

async function main() {
  console.log('Starting listening...');

  try {
    const audioBuffer = await Recognizer.listen({
      silenceDuration: 2,
      phraseTimeLimit: 5,
    });
    console.log(`Received audio buffer of length ${audioBuffer.length}`);
    fs.writeFileSync('audio.raw', audioBuffer);
  } catch (error) {
    console.error('Error listening:', error);
  }
}

main();
