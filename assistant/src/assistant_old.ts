import { askAssistant } from './ask';
//import { listen } from './listener';
import { parentLogger } from './logger';
import { recognize } from './recognizer';
import { loadEffectsIntoMemory, playEffect, SoundEffect } from './soundEffects';
import { speak } from './speak';

const logger = parentLogger.child({ filename: 'assistant' });

// TODO: pull from settings
const wakeWord = 'computer';

function cleanText(text: string): string {
  if (text === '') return text;
  // convert to lowercase and strip all punctuation and trim starting and trailing spaces
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim();
}

export async function runAssistantLoop() {
  logger.info('Starting assistant loop...');

  while (true) {
    try {
      // load all sound effects into memory
      await loadEffectsIntoMemory();

      // 1. Listen for user input
      const audioBuffer = await listen();
      logger.debug(`Received audio buffer of length ${audioBuffer.length}`);

      // 2. Recognize speech
      const text = await recognize(audioBuffer);
      const cleanedText = cleanText(text);

      if (!cleanedText) continue;

      if (!cleanedText.includes(wakeWord)) {
        logger.debug(`Heard text: ${cleanedText}`);
        logger.info('No wake word detected. Listening again...');
        continue;
      }

      logger.info('📶 Wake word detected!');
      const actualText = cleanedText.split(wakeWord)[1].trim();
      logger.debug(`💬 Heard text: ${actualText}`);

      // play sound effect to indicate wake word detection, don't wait for it
      playEffect(SoundEffect.BEEP);

      // 3. Ask assistant
      const response = await askAssistant(actualText);
      logger.debug(`↩️ Assistant response: ${response}`);

      // 4. Speak response
      await speak(response);
    } catch (error) {
      // TODO: don't shut down for all errors, consider continueing or retrying
      logger.error(
        error,
        'Unexpected error occurred in assistant loop. Shutting down.',
      );
      break;
    }
  }

  logger.info('Assistant loop stopped.');
}
