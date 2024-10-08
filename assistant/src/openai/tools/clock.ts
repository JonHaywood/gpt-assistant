import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod';
import { formatInTimeZone } from 'date-fns-tz';
import { TIMEZONE } from '../../env';

const NoParameters = z.object({});

export const clock = zodFunction({
  name: 'clock',
  description:
    "Useful for getting the current Date and time, Format is 'YYYY-MM-DD HH:mm:ss Z', if you don't know the time now, you can use this tool to get the current time.",
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
