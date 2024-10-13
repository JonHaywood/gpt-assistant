import { zodFunction } from 'openai/helpers/zod';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { VOLUME_CONTROL_DEVICE, VOLUME_CONTROL_DEVICE_INDEX } from '../../env';

// Promisify the exec function to use it with async/await
const execAsync = promisify(exec);

const VOLUME_MIN_PERCENT = 70;

async function getVolumePercent() {
  // Run the amixer command to get the PCM volume percentage
  const { stdout } = await execAsync(
    `amixer get '${VOLUME_CONTROL_DEVICE}' | grep -o '[0-9]*%' | head -1`,
  );
  return stdout.trim(); // Example output: 50%
}

const NoParameters = z.object({});

export const getVolume = zodFunction({
  name: 'getVolume',
  description: 'Get the current volume % of the device.',
  parameters: NoParameters,
  function: async (_args = {}) => {
    return await getVolumePercent();
  },
});

const SetVolumeParameters = z.object({
  percent: z
    .number()
    .describe('The number volume percentage to set, between 0 and 100.'),
});

export const setVolume = zodFunction({
  name: 'setVolume',
  description:
    'Set the volume to a specific percentage. Should be no lower than VOLUME_MIN_PERCENT%.',
  parameters: SetVolumeParameters,
  function: async (args) => {
    let { percent } = args;
    if (percent < VOLUME_MIN_PERCENT) percent = VOLUME_MIN_PERCENT;
    // Run the amixer command to set the volume
    await execAsync(
      `amixer cset numid=${VOLUME_CONTROL_DEVICE_INDEX} ${percent}%`,
    );
    return `Volume set to ${percent}%`; // Return confirmation
  },
});

const AdjustVolumeParameters = z.object({
  change: z.number().describe('Can be positive (up) or negative (down)'),
});

export const adjustVolume = zodFunction({
  name: 'adjustVolume',
  description: 'Increase or decrease the volume by a specified percentage.',
  parameters: AdjustVolumeParameters,
  function: async (args) => {
    const { change } = args;

    // First, get the current volume percentage
    const currentVolumeOutput = await getVolumePercent();
    const currentVolume = parseInt(
      currentVolumeOutput.trim().replace('%', ''),
      10,
    );

    // Calculate the new volume by adjusting the current volume
    let newVolume = currentVolume + change;
    if (newVolume > 100) newVolume = 100; // Cap at 100%
    if (newVolume < VOLUME_MIN_PERCENT) newVolume = VOLUME_MIN_PERCENT; // Ensure volume doesn't go below min %

    // Set the new volume
    await execAsync(
      `amixer cset numid=${VOLUME_CONTROL_DEVICE_INDEX} ${newVolume}%`,
    );
    return `Volume adjusted by ${change}%. New volume is ${newVolume}%`; // Return confirmation
  },
});
