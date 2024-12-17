import { z } from "zod";

export const formSchema = z.object({
  // api keys form
  OPENAI_API_KEY: z.string(),
  PICOVOICE_ACCESS_KEY: z.string(),
  // assistant settings form
  OPENAI_MODEL: z.string().optional(),
  ASSISTANT_NAME: z.string().optional(),
  ASSISTANT_NAME_IS_CUSTOM: z.string().optional(),
  ASSISTANT_ONLY_SILENCE_TIMEOUT: z.number().min(0).max(300).optional(),
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT: z.number().min(0).max(300).optional(),
  ASSISTANT_MAX_RECORDING_LENGTH: z.number().min(0).max(300).optional(),
  ASSISTANT_VOICEDETECTION_THRESHOLD: z.number().min(0).max(1).optional(),
  ASK_HISTORY_SIZE: z.number().min(0).max(100).optional(),
  LOG_LEVEL: z.string().optional(),
  // audio settings form
  DEVICE_INDEX: z.number().min(0).max(10).optional(),
  VOLUME_CONTROL_DEVICE: z.string().optional(),
  VOLUME_CONTROL_DEVICE_INDEX: z.number().min(0).max(10).optional(),
});
