import { readFile } from "fs/promises";

export interface Config {
  OPENAI_API_KEY: string;
  PICOVOICE_ACCESS_KEY: string;
  VOLUME_CONTROL_DEVICE: string;
  VOLUME_CONTROL_DEVICE_INDEX: number;
  OPENAI_MODEL: string;
  DEVICE_INDEX: number;
  WAKEWORD_THRESHOLD: number;
  ASSISTANT_NAME: string;
  ASSISTANT_NAME_IS_CUSTOM: string;
  ASSISTANT_ONLY_SILENCE_TIMEOUT: number;
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT: number;
  ASSISTANT_MAX_RECORDING_LENGTH: number;
  ASSISTANT_VOICEDETECTION_THRESHOLD: number;
  ASK_HISTORY_SIZE: number;
  ADDRESS: string;
  TIMEZONE: string;
  GEOCODIO_API_KEY: string;
  LOG_LEVEL: string;
  GOOGLE_API_KEY: string;
  GOOGLE_SEARCH_ENGINE_ID: string;
}

const CONFIG_DEFAULTS: Partial<Config> = {
  OPENAI_MODEL: "4o",
  DEVICE_INDEX: 2,
  WAKEWORD_THRESHOLD: 0.05,
  ASSISTANT_NAME: "Bailiwick",
  ASSISTANT_NAME_IS_CUSTOM: "true",
  ASSISTANT_ONLY_SILENCE_TIMEOUT: 5000,
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT: 1500,
  ASSISTANT_MAX_RECORDING_LENGTH: 15000,
  ASSISTANT_VOICEDETECTION_THRESHOLD: 0.05,
  ASK_HISTORY_SIZE: 5,
  LOG_LEVEL: "trace",
};

export async function getConfig() {
  const file = await readFile(process.cwd() + "/config.json", "utf-8");
  const config = Object.assign(CONFIG_DEFAULTS, JSON.parse(file)) as Config;
  return config;
}
