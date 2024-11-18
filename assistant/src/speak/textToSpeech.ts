import { ChildProcessWithoutNullStreams, spawn } from 'child_process';
import { parentLogger } from '../logger';
import { getAppLevelAbortSignal } from '../shutdown';

const logger = parentLogger.child({ filename: 'textToSpeech' });

let isPiperShuttingDown = false;
let piperProcess: ChildProcessWithoutNullStreams;

export function getCurrentPiperTTSProcess() {
  return piperProcess;
}

/**
 * Starts a new Piper TTS process. Unless the stop function is called,
 * a new process will be started when the current one finishes. This
 * grealty reduces the time it takes to start speaking text, likely
 * because the tts model is already loaded into memory.
 */
export function startPiperTTSProcess() {
  const signal = getAppLevelAbortSignal();

  logger.info('Starting new Piper TTS process...');

  // Piper command with the necessary parameters to output raw audio
  // and stream it to aplay
  // prettier-ignore
  piperProcess = spawn('piper', [
    '--model',
    'assets/voice.onnx',
    '--config',
    'assets/voice.onnx.json',
    '--output-raw',
  ], { signal });

  // Handle errors from piper
  piperProcess.on('error', (error) => {
    if (error.name === 'AbortError') return;
    logger.error(`Error running Piper:: ${error.name}:${error.message}`);
  });

  piperProcess.stdout.on('error', (error) => {
    logger.error(`Error with Piper stdout: ${error.message}`);
  });

  // Log when Piper process finishes
  piperProcess.on('close', (code) => {
    if (isPiperShuttingDown) return;

    // restart the process, kill the current one, start a new one
    logger.debug(
      `Piper TTS process finished with exit code ${code}. Restarting...`,
    );
    startPiperTTSProcess();
  });
}

/**
 * Stops the current Piper TTS process and prevents a new one from starting.
 */
export function stopPiperTTSProcess() {
  logger.info('Stopping Piper TTS process.');
  isPiperShuttingDown = true;
  piperProcess.kill();
}
