import OpenAI, { toFile } from 'openai';
import { parentLogger } from './logger';

const logger = parentLogger.child({ filename: 'recognizer' });

// instance of OpenAI API client
const openai = new OpenAI();

export async function recognize(audioBuffer: Buffer): Promise<string> {
  try {
    logger.info('Transcribing audio...');
    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'audio_buffer.wav'), // convert audio buffer to file like object
      model: 'whisper-1',
    });
    logger.info('Transcription complete.');
    return transcription.text;
  } catch (error) {
    logger.error(error, `Error occurred transcribing audio`);
    throw new Error(`Error occurred transcribing audio: ${error}`);
  }
}
