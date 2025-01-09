import { Cobra } from '@picovoice/cobra-node';
import { Porcupine } from '@picovoice/porcupine-node';
import path from 'path';
import {
  ASSISTANT_NAME,
  ASSISTANT_NAME_IS_CUSTOM,
  ASSISTANT_PPN_FILENAME,
  MICROPHONE_DEVICE_INDEX,
  PICOVOICE_ACCESS_KEY,
  WAKEWORD_THRESHOLD,
} from './config';
// @ts-expect-error - no types available for the pvrecorder-node package
import { PvRecorder } from '@picovoice/pvrecorder-node';

/**
 * @fileoverview
 * All Picovoice related functionality is encapsulated in this module.
 */

// instance of porcupine wake word engine for the assistant
export const assistantWakeWord = new Porcupine(
  PICOVOICE_ACCESS_KEY,
  [
    ASSISTANT_NAME_IS_CUSTOM && ASSISTANT_PPN_FILENAME
      ? path.resolve(`assets/${ASSISTANT_PPN_FILENAME.toLowerCase()}.ppn`)
      : ASSISTANT_NAME, // NOTE: if string is not a built-in keyword this will fail
  ],
  [WAKEWORD_THRESHOLD],
);

// instance of porcupine wake word engine for the stop command
export const stopWakeWord = new Porcupine(
  PICOVOICE_ACCESS_KEY,
  [path.resolve('assets/cancel.ppn')],
  [0.5],
);

// instance of Voice Activity Detection library, used to detect voice vs silence
export const vad = new Cobra(PICOVOICE_ACCESS_KEY);

// create a new recorder instance
export const recorder = new PvRecorder(
  assistantWakeWord.frameLength,
  MICROPHONE_DEVICE_INDEX,
);
