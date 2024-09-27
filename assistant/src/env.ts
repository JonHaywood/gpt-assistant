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
export const DEVICE_INDEX = parseInt(getEnvVar('DEVICE_INDEX', '2'));
export const WAKEWORD_THRESHOLD = parseFloat(
  getEnvVar('WAKEWORD_THRESHOLD', '0.5'),
);
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
  getEnvVar('ASSISTANT_VOICEDETECTION_THRESHOLD', '0.5'),
);
