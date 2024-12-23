import { Parser } from 'expr-eval';
import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod';

const parser = new Parser();

const CalculateParameters = z.object({
  expression: z.string().describe('Mathematical expression to evaluate.'),
});

export const calculate = zodFunction({
  name: 'calculate',
  description: 'Calculate a mathematical expression.',
  parameters: CalculateParameters,
  function: ({ expression }) => {
    const result = parser.parse(expression).evaluate();
    return result.toString();
  },
});

const CalculateWithSubstitutesParameters = z.object({
  expression: z.string().describe('Mathematical expression to evaluate.'),
  values: z
    .object({})
    .describe('Values to substitute into the expression. Example: {"x": 5}'),
});

export const calculateWithSubtitutes = zodFunction({
  name: 'calculateWithSubtitutes',
  description: 'Calculate a mathematical expression with substitutes.',
  parameters: CalculateWithSubstitutesParameters,
  function: ({ expression, values }) => {
    const result = parser.parse(expression).evaluate(values);
    return result.toString();
  },
});
