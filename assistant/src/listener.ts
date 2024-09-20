// @ts-ignore
import * as recorder from 'node-record-lpcm16';
// @ts-ignore
import VAD from 'node-vad';
import { logger } from './logger';

export class WaitTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WaitTimeoutError';
  }
}

export interface AudioSettings {
  silenceDuration?: number; // how long to wait (in seconds) in silence before stopping
  phraseTimeLimit?: number; // maximum time (in seconds) to record after audio starts
}

const DEFAULT_AUDIO_SETTINGS = {
  silenceDuration: 2,
  phraseTimeLimit: 15,
};
const SAMPLE_RATE = 16000; // typical sample rate for speech recognition is 16kHz
const IGNORED_EXIT_CODES = [1, null]; // known exit codes to ignore

// instance of Voice Activity Detection library, used to detect voice vs silence
const vad = new VAD(VAD.Mode.NORMAL);

/**
 * Returns true if the audioBuffer contains silence or noise, false if it contains voice.
 */
async function detectSilenceOrNoise(audioBuffer: Buffer): Promise<boolean> {
  const voiceResult = await vad.processAudio(audioBuffer, SAMPLE_RATE);
  if (voiceResult === VAD.Event.SILENCE || voiceResult === VAD.Event.NOISE) {
    return true;
  } else if (voiceResult === VAD.Event.VOICE) {
    return false;
  } else if (voiceResult === VAD.Event.ERROR) {
    throw new Error(
      'VAD processing error: error occurred detecting silcence or noise',
    );
  } else {
    throw new Error(`VAD processing error: unknown result: ${voiceResult}`);
  }
}

function hasTooMuchSilence(
  silenceStartTime: number,
  silenceDuration: number,
): boolean {
  const silenceDurationMs = Date.now() - silenceStartTime;
  return silenceDurationMs >= silenceDuration * 1000;
}

function isErrorWithIgnoredExitCode(err: any): boolean {
  return (
    typeof err === 'string' &&
    // arecord will exit with error code 1 or null even if recording is successful,
    // likely due to the way it is being killed
    IGNORED_EXIT_CODES.some((code) => err.includes(`error code ${code}`))
  );
}

export function listen(settings: AudioSettings = {}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    // configure defaults
    let { silenceDuration, phraseTimeLimit } = settings;
    silenceDuration = silenceDuration ?? DEFAULT_AUDIO_SETTINGS.silenceDuration;
    phraseTimeLimit = phraseTimeLimit ?? DEFAULT_AUDIO_SETTINGS.phraseTimeLimit;

    const audioBuffer: Buffer[] = [];
    let voiceDataStarted = false;
    let silenceStartTime: number | null = null;
    let isResolvedOrRejected = false; // flag to prevent multiple resolve or reject calls
    let phraseTimeoutId: NodeJS.Timeout;

    logger.info('Started recording audio...');

    // start recording audio
    const recording = recorder.record({
      device: 'hw:1,0', // use hardware device at card 1, device 0. Found by running `arecord -l`
      recorder: 'arecord', // Using arecord for ALSA
      sampleRate: SAMPLE_RATE, // sample rate in kHz
    });

    // process each chunk of audio data
    recording
      .stream()
      .on('data', async (data: Buffer) => {
        // spinning down, stop recording
        if (isResolvedOrRejected) return;

        // accumulate audio chunks
        audioBuffer.push(data);

        // first step, check if the audio is silence or noise
        const isSilence = await detectSilenceOrNoise(data);
        if (isSilence) {
          // check if it has been long enough to stop recording
          if (silenceStartTime) {
            if (hasTooMuchSilence(silenceStartTime, silenceDuration)) {
              logger.info('Silence detected, stopping recording.');
              recording.stop();
              resolve(Buffer.concat(audioBuffer));
              isResolvedOrRejected = true;
            }
          } else {
            silenceStartTime = Date.now(); // mark the start of the silence
          }

          return;
        }

        // reset silence detection if voice is detected
        silenceStartTime = null;

        // if voice data has already started, just continue
        if (voiceDataStarted) return;

        // if here then voice was newly detected, clear the phrase timeout
        clearTimeout(phraseTimeoutId);
        voiceDataStarted = true;
        logger.info('Audio detected!');

        // set phrase time limit to stop recording
        phraseTimeoutId = setTimeout(() => {
          logger.info('Phrase time limit reached, stopping recording.');
          recording.stop();
          resolve(Buffer.concat(audioBuffer));
          isResolvedOrRejected = true;
        }, phraseTimeLimit * 1000);
      })
      .on('error', (err: any) => {
        // check for known exit codes and ignore them
        if (isErrorWithIgnoredExitCode(err)) {
          logger.info('arecord finished with a known exit code, ignoring.');
          return;
        }

        logger.error(`recorder threw an error: "${JSON.stringify(err)}"`);
        if (phraseTimeoutId) clearTimeout(phraseTimeoutId);
        reject(err);
        isResolvedOrRejected = true;
      })
      .on('end', () => {
        logger.info('Recording ended.');
      });

    // stop the recording manually after phrase time limit
    setTimeout(() => {
      if (!voiceDataStarted) return;

      logger.info('Manual stop after phrase time limit.');
      recording.stop();
      resolve(Buffer.concat(audioBuffer));
      isResolvedOrRejected = true;
    }, phraseTimeLimit * 1000);
  });
}
