import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

interface Config {
  [key: string]: string;
}

let config: Config = {};

// load config.json when this module is imported
loadConfigJson();

/**
 * Load config.json from the app root.
 */
function loadConfigJson() {
  const configPath = join(process.cwd(), 'config.json');
  // check that config.json exists
  if (!existsSync(configPath)) throw new Error('config.json does not exist');

  try {
    // read contents of config.json from app root
    const configFile = readFileSync(configPath, 'utf-8');
    config = JSON.parse(configFile);
  } catch (e) {
    throw new Error('Error occurred reading config.json', { cause: e });
  }
}

function getRequiredConfigVar(name: string): string {
  const value = config[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function getConfigVar(name: string, defaultValue: string): string {
  return config[name] ?? defaultValue;
}

export const OPENAI_API_KEY = getRequiredConfigVar('OPENAI_API_KEY');
export const PICOVOICE_ACCESS_KEY = getRequiredConfigVar(
  'PICOVOICE_ACCESS_KEY',
);
export const VOLUME_CONTROL_DEVICE = getRequiredConfigVar(
  'VOLUME_CONTROL_DEVICE',
);
export const VOLUME_CONTROL_DEVICE_INDEX = parseInt(
  getRequiredConfigVar('VOLUME_CONTROL_DEVICE_INDEX'),
);
export const OPENAI_MODEL = getConfigVar('OPENAI_MODEL', '4o');
export const DEVICE_INDEX = parseInt(getConfigVar('DEVICE_INDEX', '2'));
export const WAKEWORD_THRESHOLD = parseFloat(
  getConfigVar('WAKEWORD_THRESHOLD', '0.5'),
);
export const ASSISTANT_NAME = getConfigVar('ASSISTANT_NAME', 'Bailiwick');
export const ASSISTANT_NAME_IS_CUSTOM =
  getConfigVar('ASSISTANT_NAME_IS_CUSTOM', 'true') === 'true';
export const ASSISTANT_ONLY_SILENCE_TIMEOUT = parseInt(
  getConfigVar('ASSISTANT_LISTEN_TIMEOUT', '5000'),
);
export const ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT = parseInt(
  getConfigVar('ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT', '1500'),
);
export const ASSISTANT_MAX_RECORDING_LENGTH = parseInt(
  getConfigVar('ASSISTANT_MAX_RECORDING_LENGTH', '15000'),
);
export const ASSISTANT_VOICEDETECTION_THRESHOLD = parseFloat(
  getConfigVar('ASSISTANT_VOICEDETECTION_THRESHOLD', '0.1'),
);
export const ASK_HISTORY_SIZE = parseInt(getConfigVar('ASK_HISTORY_SIZE', '5'));
export const ADDRESS = getConfigVar('ADDRESS', '');
export const TIMEZONE = getConfigVar('TIMEZONE', '');
export const GEOCODIO_API_KEY = getConfigVar('GEOCODIO_API_KEY', '');
export const LOG_LEVEL = getConfigVar('LOG_LEVEL', 'trace');
export const LOGGING_WS_PORT = parseInt(
  getConfigVar('LOGGING_WS_PORT', '8800'),
);
