import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/index';
import {
  askLLM,
  CONTENT_FILTER_ERROR_RESPONSE,
  GENERIC_ERROR_RESPONSE,
} from './ask';
import { openai } from './client';
import { addToChatHistory, getChatHistory } from './history';
import { tools } from './tools';
import { parentLogger } from '../logger';
import { AbortError } from '../utils/abort';

type Logger = ReturnType<typeof parentLogger.child>;

vi.mock('./client');
vi.mock('./history');
vi.mock('./prompt');
vi.mock('./tools');

const mockRefs = vi.hoisted(() => {
  return {
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
      trace: vi.fn(),
    } as unknown as Logger,
  };
});

vi.mock('../logger', () => ({
  parentLogger: {
    child: vi.fn().mockReturnValue(mockRefs.logger),
  },
}));

describe('askLLM', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a response from the LLM', async () => {
    const question = 'What is the weather today?';
    const response = 'The weather is sunny.';
    const completion = {
      choices: [
        {
          message: { content: response },
          finish_reason: 'stop',
        },
      ],
    } as ChatCompletion;

    vi.mocked(openai.chat.completions.create).mockResolvedValue(completion);
    vi.mocked(getChatHistory).mockReturnValue([]);

    const result = await askLLM(question);

    expect(result).toBe(response);
    expect(addToChatHistory).toHaveBeenCalledWith(question, response);
  });

  it('should include previous messages in the request', async () => {
    const question = 'What is the weather today?';
    const response = 'The weather is sunny.';
    const completion = {
      choices: [
        {
          message: { content: response },
          finish_reason: 'stop',
        },
      ],
    } as ChatCompletion;
    const chatHistory = [
      { role: 'system', content: 'Hello!' },
      { role: 'user', content: 'What is the weather today?' },
    ] as ChatCompletionMessageParam[];

    vi.mocked(openai.chat.completions.create).mockResolvedValue(completion);
    vi.mocked(getChatHistory).mockReturnValue(chatHistory);

    const result = await askLLM(question);

    expect(result).toBe(response);
    expect(addToChatHistory).toHaveBeenCalledWith(question, response);
    expect(openai.chat.completions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          ...chatHistory,
          { role: 'user', content: question },
        ]),
      }),
    );
  });

  it('should handle tool calls', async () => {
    const question = 'What is the weather today?';
    const toolResponse = 'The weather is sunny.';
    const completionWithToolCall = {
      choices: [
        {
          message: {
            content: '',
            tool_calls: [{ id: '1', function: 'getWeather' }],
          },
          finish_reason: 'tool_calls',
        },
      ],
    } as unknown as ChatCompletion;
    const completionWithResponse = {
      choices: [
        {
          message: { content: toolResponse },
          finish_reason: 'stop',
        },
      ],
    } as ChatCompletion;

    vi.mocked(openai.chat.completions.create)
      .mockResolvedValueOnce(completionWithToolCall)
      .mockResolvedValueOnce(completionWithResponse);
    vi.mocked(getChatHistory).mockReturnValue([]);
    vi.mocked(tools.runTool).mockResolvedValue(toolResponse);

    const result = await askLLM(question);

    expect(result).toBe(toolResponse);
    expect(tools.runTool).toHaveBeenCalledWith('getWeather');
    expect(addToChatHistory).toHaveBeenCalledWith(question, toolResponse);
  });

  it('should return a generic error response if an error occurs', async () => {
    const question = 'What is the weather today?';
    const error = new Error('mock error');

    vi.mocked(openai.chat.completions.create).mockRejectedValue(error);

    const result = await askLLM(question);

    expect(result).toBe(GENERIC_ERROR_RESPONSE);
    expect(mockRefs.logger.error).toHaveBeenCalledWith(
      error,
      'Error occurred while querying ChatGPT',
    );
  });

  it('should throw an AbortError if an AbortError occurs', async () => {
    const question = 'What is the weather today?';
    const error = new AbortError();

    vi.mocked(openai.chat.completions.create).mockRejectedValue(error);

    await expect(askLLM(question)).rejects.toThrow(error);
  });

  it('should handle OpenAI content filter response', async () => {
    const question = 'What is the weather today?';
    const completion = {
      choices: [
        {
          message: { content: '' },
          finish_reason: 'content_filter',
        },
      ],
    } as unknown as ChatCompletion;

    vi.mocked(openai.chat.completions.create).mockResolvedValue(completion);
    vi.mocked(getChatHistory).mockReturnValue([]);

    const result = await askLLM(question);

    expect(result).toBe(CONTENT_FILTER_ERROR_RESPONSE);
    expect(mockRefs.logger.error).toHaveBeenCalledWith(
      completion.choices[0],
      expect.any(String),
    );
  });

  it('should handle OpenAI refusal response', async () => {
    const question = 'What is the weather today?';
    const completion = {
      choices: [
        {
          message: { refusal: true },
        },
      ],
    } as unknown as ChatCompletion;

    vi.mocked(openai.chat.completions.create).mockResolvedValue(completion);
    vi.mocked(getChatHistory).mockReturnValue([]);

    const result = await askLLM(question);

    expect(result).toBe(GENERIC_ERROR_RESPONSE);
    expect(mockRefs.logger.error).toHaveBeenCalledWith(
      completion.choices[0],
      expect.any(String),
    );
  });

  it('should handle error in tool call', async () => {
    const question = 'What is the weather today?';
    const completion = {
      choices: [
        {
          message: {
            content: '',
            tool_calls: [{ id: '1', function: 'getWeather' }],
          },
          finish_reason: 'tool_calls',
        },
      ],
    } as unknown as ChatCompletion;
    const error = new Error('mock error');

    vi.mocked(openai.chat.completions.create).mockResolvedValue(completion);
    vi.mocked(getChatHistory).mockReturnValue([]);
    vi.mocked(tools.runTool).mockRejectedValue(error);

    const result = await askLLM(question);

    expect(result).toBe(GENERIC_ERROR_RESPONSE);
    expect(mockRefs.logger.error).toHaveBeenCalledWith(
      error,
      expect.any(String),
    );
  });
});
