import { ChatCompletionMessageParam } from 'openai/resources/index';
import { ASK_HISTORY_SIZE } from '../env';

const chatHistory: Array<ChatCompletionMessageParam> = [];

export function getChatHistory() {
  return chatHistory;
}

export function addToChatHistory(question: string, response: string) {
  chatHistory.push({ role: 'user', content: question });
  chatHistory.push({ role: 'assistant', content: response });

  // keep chat history within the limit
  if (chatHistory.length > ASK_HISTORY_SIZE * 2) {
    chatHistory.shift(); // remove the oldest user question and response
    chatHistory.shift();
  }
}
