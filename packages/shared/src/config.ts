import { z } from "zod";

/**
 * Represents all the configuration items that the app uses.
 */
export interface Config {
  ADDRESS?: string;
  ASK_HISTORY_SIZE: number;
  ASSISTANT_MAX_RECORDING_LENGTH: number;
  ASSISTANT_NAME: string;
  ASSISTANT_NAME_IS_CUSTOM: boolean;
  ASSISTANT_ONLY_SILENCE_TIMEOUT: number;
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT: number;
  ASSISTANT_VOICEDETECTION_THRESHOLD: number;
  GEOCODIO_API_KEY?: string;
  GOOGLE_API_KEY?: string;
  GOOGLE_SEARCH_ENGINE_ID?: string;
  LOG_LEVEL: string;
  MICROPHONE_DEVICE_INDEX: number;
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  PICOVOICE_ACCESS_KEY: string;
  TIMEZONE?: string;
  VOLUME_CONTROL_DEVICE: string;
  VOLUME_CONTROL_DEVICE_INDEX: number;
  WAKEWORD_THRESHOLD: number;
}

/**
 * Validation schema for the configuration object.
 */
export const configSchema = z.object({
  ASK_HISTORY_SIZE: z.number().min(0).max(100),
  ASSISTANT_MAX_RECORDING_LENGTH: z.number().min(0).max(30000),
  ASSISTANT_NAME: z.string(),
  ASSISTANT_NAME_IS_CUSTOM: z.boolean(),
  ASSISTANT_ONLY_SILENCE_TIMEOUT: z.number().min(0).max(30000),
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT: z.number().min(0).max(30000),
  ASSISTANT_VOICEDETECTION_THRESHOLD: z.number().min(0).max(1),
  LOG_LEVEL: z.string(),
  MICROPHONE_DEVICE_INDEX: z.number().min(0).max(10),
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string(),
  PICOVOICE_ACCESS_KEY: z.string(),
  VOLUME_CONTROL_DEVICE: z.string(),
  VOLUME_CONTROL_DEVICE_INDEX: z.number().min(0).max(10),
});
