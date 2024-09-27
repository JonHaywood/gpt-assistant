import { toFile } from 'openai';
import { parentLogger } from './logger';
import { openai } from './openai';
import { type AudioBuffer } from './listener.types';
import { SAMPLE_RATE } from './listener';
import { convertRawAudioToWav } from './utils/audio';

const logger = parentLogger.child({ filename: 'recognizer' });

export async function recognize(audioBuffer: AudioBuffer): Promise<string> {
  try {
    if (audioBuffer.length === 0) {
      logger.debug(
        'Empty buffer (only silence or noise recorded), skipping transcription.',
      );
      return '';
    }

    logger.info('Transcribing audio...');

    // open AI requires audio to be in WAV format
    const wavFile = convertRawAudioToWav(audioBuffer, SAMPLE_RATE);

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(wavFile, 'audio_buffer.wav'), // convert to file like object
      model: 'whisper-1',
    });

    logger.info('Transcription complete.');
    return transcription.text;
  } catch (error) {
    logger.error(error, `Error occurred transcribing audio`);
    throw new Error(`Error occurred transcribing audio: ${error}`);
  }
}
