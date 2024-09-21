import OpenAI from 'openai';

export const OpenAIModels = {
  '3': 'gpt-3.5-turbo',
  '4': 'gpt-4-turbo-preview',
  '4o': 'gpt-4o',
};

// instance of OpenAI API client
export const openai = new OpenAI();
