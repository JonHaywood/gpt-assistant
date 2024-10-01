import { ASK_HISTORY_SIZE, ASSISTANT_NAME, OPENAI_MODEL } from './env';
import { parentLogger } from './logger';
import { openai, OpenAIModels } from './openai';

const logger = parentLogger.child({ filename: 'ask' });

const SYSTEM_PROMPT = `
  You are a british helpful home assistant named ${ASSISTANT_NAME}. Provide short, concise
  responses to user questions that can easily be converted from text to speech, with minimal
  punctuation and abbreviations. Aim for a friendly, conversational tone that is upbeat and
  engaging.
`;

// get the OpenAI model name from the environment variable
let model: string = '';
for (const [key, value] of Object.entries(OpenAIModels)) {
  if (key === OPENAI_MODEL) {
    model = value;
    break;
  }
}
if (!model) throw new Error(`No model found for OpenAI model: ${OPENAI_MODEL}`);

// history of chat messages.
const chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];

export async function askAssistant(question: string): Promise<string> {
  try {
    logger.trace(`❔ ChatGPT request: ${question}`);

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        ...chatHistory,
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

    // add the user question and assistant response to the chat history
    chatHistory.push({ role: 'user', content: question });
    chatHistory.push({ role: 'assistant', content: response });

    // keep chat history within the limit
    if (chatHistory.length > ASK_HISTORY_SIZE * 2) chatHistory.shift();

    return response;
  } catch (error) {
    throw new Error(`Error occurred querying ChatGPT: ${error}`);
  }
}
