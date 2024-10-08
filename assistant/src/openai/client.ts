import OpenAI from 'openai';
import { OPENAI_MODEL } from '../env';

const OpenAIModels = {
  '3': 'gpt-3.5-turbo',
  '4': 'gpt-4-turbo-preview',
  '4o': 'gpt-4o',
};

// get the OpenAI model name from the environment variable
let model: string = '';
for (const [key, value] of Object.entries(OpenAIModels)) {
  if (key === OPENAI_MODEL) {
    model = value;
    break;
  }
}
if (!model) throw new Error(`No model found for OpenAI model: ${OPENAI_MODEL}`);
export const OpenAIModel = model;

// instance of OpenAI API client
export const openai = new OpenAI();
