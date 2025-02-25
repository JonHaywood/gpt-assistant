import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getChatHistory, addToChatHistory } from './history';
import { ASK_HISTORY_SIZE } from '../config';

vi.mock('../config', () => ({
  ASK_HISTORY_SIZE: 5,
}));

describe('history', () => {
  beforeEach(() => {
    // Clear the chat history before each test
    const chatHistory = getChatHistory();
    chatHistory.length = 0;
  });

  it('should return an empty chat history initially', () => {
    const chatHistory = getChatHistory();
    expect(chatHistory).toEqual([]);
  });

  it('should add a question and response to the chat history', () => {
    const question = 'What is the weather today?';
    const response = 'The weather is sunny.';

    addToChatHistory(question, response);

    const chatHistory = getChatHistory();
    expect(chatHistory).toEqual([
      { role: 'user', content: question },
      { role: 'assistant', content: response },
    ]);
  });

  it('should keep the chat history within the limit', () => {
    for (let i = 0; i < ASK_HISTORY_SIZE + 1; i++) {
      addToChatHistory(`Question ${i}`, `Response ${i}`);
    }

    const chatHistory = getChatHistory();
    expect(chatHistory.length).toBe(ASK_HISTORY_SIZE * 2);
    expect(chatHistory[0]).toEqual({ role: 'user', content: 'Question 1' });
    expect(chatHistory[1]).toEqual({
      role: 'assistant',
      content: 'Response 1',
    });
  });

  it('should remove the oldest question and response when the limit is exceeded', () => {
    for (let i = 0; i < ASK_HISTORY_SIZE + 1; i++) {
      addToChatHistory(`Question ${i}`, `Response ${i}`);
    }

    const chatHistory = getChatHistory();
    expect(chatHistory.length).toBe(ASK_HISTORY_SIZE * 2);
    expect(chatHistory[0]).toEqual({ role: 'user', content: 'Question 1' });
    expect(chatHistory[1]).toEqual({
      role: 'assistant',
      content: 'Response 1',
    });
    expect(chatHistory[chatHistory.length - 2]).toEqual({
      role: 'user',
      content: `Question ${ASK_HISTORY_SIZE}`,
    });
    expect(chatHistory[chatHistory.length - 1]).toEqual({
      role: 'assistant',
      content: `Response ${ASK_HISTORY_SIZE}`,
    });
  });
});
