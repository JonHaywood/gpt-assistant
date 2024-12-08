import { zodFunction } from 'openai/helpers/zod';
import { GOOGLE_API_KEY, GOOGLE_SEARCH_ENGINE_ID } from '../../config';
import { z } from 'zod';

const GoogleSearchParameters = z.object({
  query: z.string().describe('Query to do a google search for.'),
});

export const googleSearch = zodFunction({
  name: 'googleSearch',
  description:
    "Performs a google search, useful for current events, live data, or info you don't know.",
  parameters: GoogleSearchParameters,
  function: async ({ query }) => {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${
        GOOGLE_SEARCH_ENGINE_ID
      }&q=${encodeURIComponent(query)}&num=5`,
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
