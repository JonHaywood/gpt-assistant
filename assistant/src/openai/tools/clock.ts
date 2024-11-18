import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod';
import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '../../config';

const NoParameters = z.object({});

export const clock = zodFunction({
  name: 'clock',
  description:
    "Getting the current date and time, Format is 'YYYY-MM-DD HH:mm:ss Z'.",
  parameters: NoParameters,
  function: (_args = {}) => {
    if (TIMEZONE) {
      const formatted = formatInTimeZone(
        new Date(),
        TIMEZONE,
        'yyyy-MM-dd HH:mm:ss XXX',
      );
      return formatted;
    } else {
      return 'Timezone has not been configured.';
    }
  },
});
