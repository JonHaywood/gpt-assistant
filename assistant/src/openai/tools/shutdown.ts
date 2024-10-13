import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod';
import { parentLogger } from '../../logger';
import { speak } from '../../speak';
import { AppLevelAbortController } from '../../utils/abort';

const logger = parentLogger.child({ filename: 'shutdown' });

const NoParameters = z.object({});

export const shutdown = zodFunction({
  name: 'shutdown',
  description: 'Shuts down the assistant.',
  parameters: NoParameters,
  function: async (_args = {}) => {
    await speak('Of course. Shutting down now.');
    logger.info(
      'Received shutdown command from user. Shutting down assistant.',
    );
    AppLevelAbortController.abort();
  },
});
