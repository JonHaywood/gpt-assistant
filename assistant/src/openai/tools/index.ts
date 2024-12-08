import { AutoParseableTool } from 'openai/lib/parser.mjs';
import { ChatCompletionMessageToolCall } from 'openai/resources/index.mjs';
import { parentLogger } from '../../logger';
import { AbortError } from '../../utils/abort';
import { calculate, calculateWithSubtitutes } from './calculate';
import { clock } from './clock';
import { googleSearch } from './google';
import { triggerShutdown } from './system';
import { adjustVolume, getVolume, setVolume } from './volume';
import { getHourlyWeatherForecast, getWeatherForecast } from './weather';

const logger = parentLogger.child({ filename: 'tools' });

// TODO: in the future user should be able to toggle which tools are enabled
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const allTools: AutoParseableTool<any>[] = [
  // calculate tools
  calculate,
  calculateWithSubtitutes,
  // clock tools
  clock,
  // weather tools
  getHourlyWeatherForecast,
  getWeatherForecast,
  // volume tools
  getVolume,
  adjustVolume,
  setVolume,
  // system tools
  triggerShutdown,
  // google tools
  googleSearch,
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
      // allow the tool to throw an AbortError to stop execution
      if (error instanceof AbortError) throw error;

      logger.error(error, `❔ ChatGPT tool error`);
      return 'An error occurred while running the tool.';
    }
  },
};
