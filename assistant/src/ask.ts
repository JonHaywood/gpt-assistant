import { parentLogger } from './logger';
import { openai, OpenAIModels } from './openai';

const logger = parentLogger.child({ filename: 'ask' });

// TODO: pull from settings
const SYSTEM_PROMPT = `
  You are a helpful home assistant. Provide short friendly responses to user questions
  that can easily be converted from text to speech, with minimal punctuation and abbreviations.`;

export async function askAssistant(question: string): Promise<string> {
  try {
    logger.trace(`❔ Asking ChatGPT: ${question}`);
    const completion = await openai.chat.completions.create({
      model: OpenAIModels['4o'], // TODO: pull from settings
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: question,
        },
      ],
    });
    const response = completion.choices[0].message.content;
    logger.trace(
      `❔ ChatGPT response: ${JSON.stringify(completion.choices[0].message)}`,
    );

    // if no response something went wrong
    if (!response) throw new Error('No response from ChatGPT.');

    return response;
  } catch (error) {
    throw new Error(`Error occurred querying ChatGPT: ${error}`);
  }
}
