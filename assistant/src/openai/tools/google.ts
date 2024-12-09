import { zodFunction } from 'openai/helpers/zod';
import { GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID } from '../../config';
import { z } from 'zod';
import { parentLogger } from '../../logger';

const logger = parentLogger.child({ filename: 'google' });

const GoogleSearchParameters = z.object({
  query: z.string().describe('Query to do a google search for.'),
  dateRestrict: z
    .string()
    .describe(
      "Restrict search results to a specific date range. 'd' for days, 'w' for weeks, 'm' for months, 'y' for years. Example: 'd7' for the past 7 days.",
    )
    .optional(),
});

export const googleSearch = zodFunction({
  name: 'googleSearch',
  description:
    "Performs a google search, useful for current events or info you don't know.",
  parameters: GoogleSearchParameters,
  function: async ({ query, dateRestrict }) => {
    // set up the query parameters
    const params = new URLSearchParams();
    params.append('key', GOOGLE_API_KEY);
    params.append('cx', GOOGLE_SEARCH_ENGINE_ID);
    params.append('q', query);
    params.append('num', '5');
    if (dateRestrict) {
      if (!dateRestrict.match(/^[dwmy]\d+$/)) {
        logger.error(`Invalid dateRestrict format: ${dateRestrict}`);
        return 'An error occurred.';
      }
      params.append('dateRestrict', dateRestrict);
    }

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    const json = await response.json();

    return JSON.stringify(json);
  },
});
