import { existsSync, readFileSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { ZodError } from "zod";
import { configSchema, Config } from "./config";

/**
 * Config file is located in the root of the project.
 */
const CONFIG_PATH = process.cwd() + "/config.json";

/**
 * Default values for all configuration items.
 */
const CONFIG_DEFAULTS: Config = {
  ADDRESS: "",
  ASK_HISTORY_SIZE: 5,
  ASSISTANT_MAX_RECORDING_LENGTH: 15000,
  ASSISTANT_NAME: "",
  ASSISTANT_NAME_IS_CUSTOM: false,
  ASSISTANT_ONLY_SILENCE_TIMEOUT: 5000,
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT: 1500,
  ASSISTANT_VOICEDETECTION_THRESHOLD: 0.05,
  GEOCODIO_API_KEY: "",
  GOOGLE_API_KEY: "",
  GOOGLE_SEARCH_ENGINE_ID: "",
  LOG_LEVEL: "trace",
  MICROPHONE_DEVICE_INDEX: 0,
  OPENAI_API_KEY: "",
  OPENAI_MODEL: "4o",
  PICOVOICE_ACCESS_KEY: "",
  TIMEZONE: "",
  VOLUME_CONTROL_DEVICE: "",
  VOLUME_CONTROL_DEVICE_INDEX: 0,
  WAKEWORD_THRESHOLD: 0.05,
};

function parseConfigContents(contents: string) {
  const config = Object.assign(
    {},
    CONFIG_DEFAULTS,
    JSON.parse(contents)
  ) as Config;
  return config;
}

/**
 * Class for config-related errors.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

/**
 * Function that returns a config object. If one does not exist, a basic config
 * will be created.
 * @returns a config object. May or may not be valid.
 */
export async function getConfig() {
  // if config.json does not exist, create it with defaults
  if (!existsSync(CONFIG_PATH)) {
    try {
      await writeFile(CONFIG_PATH, JSON.stringify(CONFIG_DEFAULTS, null, 2));
    } catch (e) {
      throw new ConfigError("Error occurred creating default config.json");
    }
  }

  try {
    const file = await readFile(CONFIG_PATH, "utf-8");
    const config = parseConfigContents(file);
    return config;
  } catch (e) {
    throw new ConfigError("Error occurred reading config.json");
  }
}

/**
 * Function that returns a valid, completed config object. If one does not exist,
 * a basic but incomplete config will be created.
 * @throws ConfigError if the config is invalid or cannot be read
 * @returns a valid config object
 */
export function getValidatedConfig() {
  // if config.json does not exist, create it with defaults
  if (!existsSync(CONFIG_PATH)) {
    try {
      writeFile(CONFIG_PATH, JSON.stringify(CONFIG_DEFAULTS, null, 2));
    } catch (e) {
      throw new ConfigError("Error occurred creating default config.json");
    }

    // the defaults aren't enough to run the app with, so throw an error
    throw new ConfigError("Valid config.json not found");
  }

  // read and parse the file
  let config: Config;
  try {
    const fileContents = readFileSync(CONFIG_PATH, "utf-8");
    config = parseConfigContents(fileContents);
  } catch (e) {
    throw new ConfigError("Error occurred reading config.json");
  }

  // validate config, throw error if invalid
  try {
    configSchema.parse(config);
  } catch (e: unknown) {
    let issues: string = "";
    if (e instanceof ZodError)
      issues = e.errors.map((err) => err.message).join(", ");
    throw new ConfigError(`Invalid config.json${issues ? `: ${issues}` : ""}`);
  }

  return config;
}
