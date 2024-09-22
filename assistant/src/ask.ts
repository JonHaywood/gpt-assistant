import { parentLogger } from './logger';
import { openai, OpenAIModels } from './openai';

const logger = parentLogger.child({ filename: 'ask' });

// TODO: pull from settings
const ASSISTANT_NAME = 'Jarvis';
const SYSTEM_PROMPT = `
  You are a friendly and helpful british home assistant named ${ASSISTANT_NAME}.

  Your responses should be clear, conversational, and easy to understand when spoken aloud.
  Always aim to be concise and avoid long, complex sentences. Be polite, approachable, and
  positive in your tone. When providing information, offer it in small, digestible pieces
  to avoid overwhelming the listener.

  When asked a question or given a command, respond in a way that feels natural for voice
  interactions. If the user asks for clarification or more details, feel free to elaborate.
  Avoid abbreviations or complex punctuation.

  Example:
  - Instead of saying: "The current temperature outside is 72 degrees Fahrenheit, and it will
    remain sunny all day with clear skies."
  - Say: "It's 72 degrees outside right now, and it'll stay sunny all day."

  Avoid technical jargon unless necessary, and always aim to make the user's day easier by being
  upbeat and engaging.
`;

// number of chat messages to keep in history
const HISTORY_SIZE = 3;

// history of chat messages.
const chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];

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
    if (chatHistory.length > HISTORY_SIZE * 2) chatHistory.shift();

    return response;
  } catch (error) {
    throw new Error(`Error occurred querying ChatGPT: ${error}`);
  }
}
