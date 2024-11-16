function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}`);
  }
  return value;
}

function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] ?? defaultValue;
}

export const PICOVOICE_ACCESS_KEY = getRequiredEnvVar('PICOVOICE_ACCESS_KEY');
export const VOLUME_CONTROL_DEVICE = getRequiredEnvVar('VOLUME_CONTROL_DEVICE');
export const VOLUME_CONTROL_DEVICE_INDEX = parseInt(
  getRequiredEnvVar('VOLUME_CONTROL_DEVICE_INDEX'),
);
export const OPENAI_MODEL = getEnvVar('OPENAI_MODEL', '4o');
export const DEVICE_INDEX = parseInt(getEnvVar('DEVICE_INDEX', '2'));
export const WAKEWORD_THRESHOLD = parseFloat(
  getEnvVar('WAKEWORD_THRESHOLD', '0.5'),
);
export const ASSISTANT_NAME = getEnvVar('ASSISTANT_NAME', 'Bailiwick');
export const ASSISTANT_NAME_IS_CUSTOM =
  getEnvVar('ASSISTANT_NAME_IS_CUSTOM', 'true') === 'true';
export const ASSISTANT_ONLY_SILENCE_TIMEOUT = parseInt(
  getEnvVar('ASSISTANT_LISTEN_TIMEOUT', '5000'),
);
export const ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT = parseInt(
  getEnvVar('ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT', '1500'),
);
export const ASSISTANT_MAX_RECORDING_LENGTH = parseInt(
  getEnvVar('ASSISTANT_MAX_RECORDING_LENGTH', '15000'),
);
export const ASSISTANT_VOICEDETECTION_THRESHOLD = parseFloat(
  getEnvVar('ASSISTANT_VOICEDETECTION_THRESHOLD', '0.1'),
);
export const ASK_HISTORY_SIZE = parseInt(getEnvVar('ASK_HISTORY_SIZE', '5'));
export const ADDRESS = getEnvVar('ADDRESS', '');
export const TIMEZONE = getEnvVar('TIMEZONE', '');
export const GEOCODIO_API_KEY = getEnvVar('GEOCODIO_API_KEY', '');
export const LOG_LEVEL = getEnvVar('LOG_LEVEL', 'trace');
export const LOGGING_WS_PORT = parseInt(getEnvVar('LOGGING_WS_PORT', '8080'));
