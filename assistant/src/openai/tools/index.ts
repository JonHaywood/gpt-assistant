import { AutoParseableTool } from 'openai/lib/parser.mjs';
import { ChatCompletionMessageToolCall } from 'openai/resources/index.mjs';
import { parentLogger } from '../../logger';
import { calculate, calculateWithSubtitutes } from './calculate';
import { getHourlyWeatherForecast, getWeatherForecast } from './weather';

const logger = parentLogger.child({ filename: 'tools' });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allTools: AutoParseableTool<any>[] = [
  getHourlyWeatherForecast,
  getWeatherForecast,
  calculate,
  calculateWithSubtitutes,
];

export interface Tools {
  // never is used here because the type of the arguments is not known
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toolList: AutoParseableTool<any>[];
  runTool: (
    toolFunction: ChatCompletionMessageToolCall.Function,
  ) => Promise<string>;
}

export const tools: Tools = {
  toolList: allTools,
  /**
   * Runs the tool with the provided name.
   */
  async runTool({
    name: toolName,
    arguments: args,
  }: ChatCompletionMessageToolCall.Function): Promise<string> {
    try {
      const tool = allTools.find((t) => t.function.name === toolName);
      if (!tool) throw new Error(`Tool ${toolName} was not found.`);

      // parse the arguments to pass to the tool
      const parsedArgs = tool.$parseRaw(args);
      if (!tool.$callback)
        throw new Error(`Tool ${toolName} does not have a callback function.`);

      // run the tool and get the result
      const result = await tool.$callback(parsedArgs);

      if (!result) throw new Error(`Tool ${toolName} did not return a result.`);

      // if the result is already a string, return it
      if (typeof result === 'string') return result;

      return JSON.stringify(result);
    } catch (error) {
      logger.error(error, `❔ ChatGPT tool error`);
      return 'An error occurred while running the tool.';
    }
  },
};
