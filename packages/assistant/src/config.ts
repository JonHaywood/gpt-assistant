import { getValidatedConfig } from 'shared/src/server';

// when module is imported, read and validate the config file
const config = getValidatedConfig();

export const OPENAI_API_KEY = config.OPENAI_API_KEY;
export const PICOVOICE_ACCESS_KEY = config.PICOVOICE_ACCESS_KEY;
export const VOLUME_CONTROL_DEVICE = config.VOLUME_CONTROL_DEVICE;
export const VOLUME_CONTROL_DEVICE_INDEX = config.VOLUME_CONTROL_DEVICE_INDEX;
export const OPENAI_MODEL = config.OPENAI_MODEL;
export const MICROPHONE_DEVICE_INDEX = config.MICROPHONE_DEVICE_INDEX;
export const WAKEWORD_THRESHOLD = config.WAKEWORD_THRESHOLD;
export const ASSISTANT_NAME = config.ASSISTANT_NAME;
export const ASSISTANT_NAME_IS_CUSTOM = config.ASSISTANT_NAME_IS_CUSTOM;
export const ASSISTANT_ONLY_SILENCE_TIMEOUT =
  config.ASSISTANT_ONLY_SILENCE_TIMEOUT;
export const ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT =
  config.ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT;
export const ASSISTANT_MAX_RECORDING_LENGTH =
  config.ASSISTANT_MAX_RECORDING_LENGTH;
export const ASSISTANT_VOICEDETECTION_THRESHOLD =
  config.ASSISTANT_VOICEDETECTION_THRESHOLD;
export const ASK_HISTORY_SIZE = config.ASK_HISTORY_SIZE;
export const ADDRESS = config.ADDRESS;
export const TIMEZONE = config.TIMEZONE;
export const GEOCODIO_API_KEY = config.GEOCODIO_API_KEY;
export const LOG_LEVEL = config.LOG_LEVEL;
export const GOOGLE_API_KEY = config.GOOGLE_API_KEY;
export const GOOGLE_SEARCH_ENGINE_ID = config.GOOGLE_SEARCH_ENGINE_ID;
