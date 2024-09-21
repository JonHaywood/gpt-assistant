import { openai } from './openai';

export async function askAssistant(question: string): Promise<string> {
  try {
    return 'Not implemented';
  } catch (error) {
    throw new Error(`Error occurred asking assistant: ${error}`);
  }
}
