import {
  ChatCompletion,
  ChatCompletionMessageParam,
} from 'openai/resources/index';
import { ASSISTANT_NAME } from '../env';
import { parentLogger } from '../logger';
import { openai, OpenAIModel } from './client';
import { addToChatHistory, getChatHistory } from './history';
import { tools } from './tools';

const logger = parentLogger.child({ filename: 'ask' });

const SYSTEM_PROMPT = `
  You are a british helpful home assistant named ${ASSISTANT_NAME}. Provide short, concise
  responses to user questions that can easily be converted from text to speech, with minimal
  punctuation and abbreviations. Aim for a friendly, conversational tone that is upbeat and
  engaging.
`;

const GENERIC_ERROR_RESPONSE =
  "I'm sorry, I ran into an issue. Please try again.";

/**
 * Queries the ChatGPT model with the given question and returns the response.
 */
export async function askLLM(question: string): Promise<string> {
  try {
    logger.trace('❔ ChatGPT sending request...');

    // messages just for the current "run", that is, all messages needed to
    // complete the current user question
    const messagesForRun: ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: question,
      },
    ];
    let response: string | null = null;

    // wait for assistant to complete (there may be tool calls to execute)
    while (true) {
      const completion = await openai.chat.completions.create({
        model: OpenAIModel,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          ...getChatHistory(),
          ...messagesForRun,
        ],
        tools: tools.toolList,
      });

      // first check for errors or other reasons to stop
      const { isFinished, terminatingMessage } =
        handleTerminatingFinishReason(completion);
      if (isFinished) {
        response = terminatingMessage;
        break;
      }

      // next, check for tools, if there are any then completion is not done
      const toolCallExists = hasToolCall(completion);

      // if no tool call, the completion is done
      if (!toolCallExists) {
        response = completion.choices[0].message.content;
        break;
      }

      // a tool call is needed, add message for completion context
      const toolMessage = completion.choices[0].message;
      messagesForRun.push(toolMessage);
      logger.trace(
        `🛠️ ChatGPT received tool message: ${JSON.stringify(toolMessage)}`,
      );

      // run the tool
      const toolCall = toolMessage.tool_calls![0];
      logger.trace(`🛠️ ChatGPT running tool: ${toolCall.function.name}`);
      const toolResponse = await tools.runTool(toolCall.function);
      logger.trace(
        `🛠️ ChatGPT tool response: ${toolResponse.length > 200 ? toolResponse.slice(0, 200) + '...' : toolResponse}`,
      );

      // provide the tool response back to the LLM
      messagesForRun.push({
        role: 'tool',
        content: toolResponse,
        tool_call_id: toolCall.id,
      });
    }

    logger.trace(`❔ ChatGPT response: ${JSON.stringify(response)}`);

    // if no response something went wrong
    if (!response) {
      logger.error('No response from ChatGPT.');
      response = GENERIC_ERROR_RESPONSE;
      return response;
    }

    // add the user question and assistant response to the chat history
    addToChatHistory(question, response);

    return response;
  } catch (error) {
    logger.error(error, 'Error occurred while querying ChatGPT');
    return GENERIC_ERROR_RESPONSE;
  }
}

function hasToolCall(completion: ChatCompletion) {
  return (
    completion.choices[0].finish_reason === 'tool_calls' &&
    !!completion.choices[0].message.tool_calls?.length
  );
}

function handleTerminatingFinishReason(completion: ChatCompletion): {
  isFinished: boolean;
  terminatingMessage: string;
} {
  const choice = completion.choices[0];

  if (choice.finish_reason === 'stop') {
    logger.trace('OpenAI ended the content output.');
    return {
      isFinished: true,
      terminatingMessage: choice.message.content ?? GENERIC_ERROR_RESPONSE,
    };
  }

  if (choice.finish_reason === 'length') {
    logger.error(
      choice,
      'OpenAI conversation was too long for the context window.',
    );
    return {
      isFinished: true,
      terminatingMessage: GENERIC_ERROR_RESPONSE,
    };
  }

  if (choice.finish_reason === 'content_filter') {
    logger.error(
      choice,
      'OpenAI content was filtered due to policy violations (copyright material, inappropriate, etc).',
    );
    return {
      isFinished: true,
      terminatingMessage: "I'm sorry, I can't respond to that.",
    };
  }

  if (choice.message.refusal) {
    logger.error(choice, 'OpenAI refused to fulfill the request.');
    return {
      isFinished: true,
      terminatingMessage: GENERIC_ERROR_RESPONSE,
    };
  }

  return { isFinished: false, terminatingMessage: '' };
}
