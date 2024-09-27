// @ts-ignore
import { Cobra } from '@picovoice/cobra-node';
import {
  ASSISTANT_ONLY_SILENCE_TIMEOUT,
  ASSISTANT_MAX_RECORDING_LENGTH,
  ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT,
  ASSISTANT_VOICEDETECTION_THRESHOLD,
  PICOVOICE_ACCESS_KEY,
} from './env';
import { SAMPLE_RATE } from './listener';
import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';
import { recognize } from './recognizer';
import { concatAudioBuffers, frameDuration } from './utils/audio';
import { askAssistant } from './ask';
import { speak } from './speak';

const logger = parentLogger.child({ filename: 'assistant' });

// instance of Voice Activity Detection library, used to detect voice vs silence
const vad = new Cobra(PICOVOICE_ACCESS_KEY);

/**
 * Assistant class that reacts to incoming audio data. Is a class
 * because it needs to maintain state across multiple frames of audio.
 */
export class Assistant {
  private static runningInstance: Assistant | null = null;

  id: number = Date.now();
  frames: AudioBuffer[];

  voiceDetected: boolean = false;
  silenceDuration: number = 0;
  totalAudioDuration: number = 0;
  isBusy: boolean = false; // when transcribing or speaking

  private constructor(initialFrame: AudioBuffer) {
    if (Assistant.runningInstance)
      throw new Error(
        'Assistant already running. Previous assistant must be stopped before starting a new one.',
      );
    Assistant.runningInstance = this;
    this.frames = [initialFrame];
  }

  static startNewAssistant(initialFrame: AudioBuffer) {
    return new Assistant(initialFrame);
  }

  static getRunninngInstance(): Assistant | null {
    return Assistant.runningInstance;
  }

  async handleAudioData(frame: AudioBuffer) {
    try {
      // if assistant is actively speaking or transcribing, ignore incoming audio data
      if (this.isBusy) return;

      this.frames.push(frame);

      const isSilence = this._detectSilenceOrNoise(frame);
      if (isSilence) {
        this.silenceDuration += frameDuration(frame, SAMPLE_RATE);
      } else {
        this.silenceDuration = 0;
        this.voiceDetected = true;
      }

      this.totalAudioDuration += frameDuration(frame, SAMPLE_RATE);

      // if silence detected for X seconds at the the beginning, stop
      const isStartingAudioOnlySilence =
        !this.voiceDetected &&
        this.silenceDuration >= ASSISTANT_ONLY_SILENCE_TIMEOUT;
      if (isStartingAudioOnlySilence) {
        logger.info('Stopping assistant loop due to silence.');
        this.stop();
        return;
      }

      // if silence detected for X seconds after voice detected, stop & transcribe
      const isSilenceAfterVoice =
        this.voiceDetected &&
        this.silenceDuration >= ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT;
      if (isSilenceAfterVoice) {
        logger.info('🎤️ Audio phrase detected!');
        this._transcribeAndSpeak();
        return;
      }

      // if speech has gone on long enough, stop & transcribe
      const isVoiceRecordingTooLong =
        this.voiceDetected &&
        this.totalAudioDuration >= ASSISTANT_MAX_RECORDING_LENGTH;
      if (isVoiceRecordingTooLong) {
        logger.info(
          '🎤️ Audio phrase detected! Audio recording limit reached.',
        );
        await this._transcribeAndSpeak();
        return;
      }

      // something weird happened that we haven't accounted for
      if (this.totalAudioDuration > ASSISTANT_MAX_RECORDING_LENGTH) {
        throw new Error('💢 Something weird happened. Stopping listening.');
      }
    } catch (error) {
      logger.error(error, 'Error ocurred handling audio data');
      this.stop();
    }
  }

  stop() {
    logger.info('🔚 Stopping assistant loop.');
    // remove reference to this assistant so it can be garbage collected
    if (Assistant.runningInstance?.id === this.id)
      Assistant.runningInstance = null;
  }

  reset() {
    this.frames = [];
    this.voiceDetected = false;
    this.silenceDuration = 0;
    this.totalAudioDuration = 0;
  }

  _detectSilenceOrNoise(frame: AudioBuffer) {
    const voiceProbability = vad.process(frame);
    return voiceProbability < ASSISTANT_VOICEDETECTION_THRESHOLD;
  }

  async _transcribeAndSpeak() {
    logger.info('✏️ Transcribing audio...');

    this.isBusy = true;

    // concat all frames and transcribe
    const audioBuffer = concatAudioBuffers(this.frames);
    const text = await recognize(audioBuffer);
    logger.debug(`💬 Heard text: ${text}`);

    // Ask assistant
    const response = await askAssistant(text);
    logger.debug(`↩️ Assistant response: ${response}`);

    // speak response
    await speak(response);

    this.reset();
    this.isBusy = false; // start listening again
  }
}
