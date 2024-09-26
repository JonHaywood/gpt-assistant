// @ts-ignore
import { SAMPLE_RATE } from './listener';
import { type AudioBuffer } from './listener.types';
import { parentLogger } from './logger';
import { playEffect, SoundEffect } from './soundEffects';
import { detectWakeword } from './wakeword';
import {
  ASSISTANT_LISTEN_TIMEOUT,
  ASSISTANT_MAX_RECORDING_LENGTH,
  ASSISTANT_VOICE_TIMEOUT,
  ASSISTANT_VOICEDETECTION_THRESHOLD,
  PICOVOICE_ACCESS_KEY,
} from './env';
import { Cobra } from '@picovoice/cobra-node';

const logger = parentLogger.child({ filename: 'assistant' });

// instance of Voice Activity Detection library, used to detect voice vs silence
const vad = new Cobra(PICOVOICE_ACCESS_KEY);

let runningAssistant: Assistant | null = null;

/**
 * Function that is invoked for every chunk/frame of audio data
 * received from the microphone.
 */
export async function handleAudioData(frame: AudioBuffer) {
  const isWakeword = detectWakeword(frame);

  if (isWakeword) {
    logger.info('📶 Wake word detected!');

    // play sound effect to indicate wake word detection
    playEffect(SoundEffect.BEEP);

    // TODO: stop the current assistant if it's running

    // start a new assistant loop
    logger.info('🧠 Starting assistant loop...');
    runningAssistant = new Assistant(frame);
  } else if (runningAssistant) {
    await runningAssistant.handleAudioData(frame);
  }
}

class Assistant {
  id: number = Date.now();
  frames: AudioBuffer[];

  voiceDetected: boolean = false;
  silenceDuration: number = 0;
  totalAudioDuration: number = 0;
  isSpeaking: boolean = false;

  get isActive(): boolean {
    return runningAssistant?.id === this.id;
  }

  constructor(initialFrame: AudioBuffer) {
    this.frames = [initialFrame];
  }

  async handleAudioData(frame: AudioBuffer) {
    try {
      // if assistant is actively speaking, ignore incoming audio data
      if (this.isSpeaking) return;

      this.frames.push(frame);

      const isSilence = this._detectSilenceOrNoise(frame);
      if (isSilence) {
        this.silenceDuration += frameDuration(frame);
      } else {
        this.silenceDuration = 0;
        this.voiceDetected = true;
      }

      this.totalAudioDuration += frameDuration(frame);

      // if silence detected for X seconds at the the beginning, stop
      if (this._isStartingAudioOnlySilence()) {
        logger.info('Stopping assistant loop due to silence.');
        this.stop();
        return;
      }

      // if silence detected for X seconds after voice detected, stop & transcribe
      if (this._isSilenceAfterVoice() || this._isVoiceRecordingTooLong()) {
        logger.info('🎤️ Audio phrase detected!');
        this.stop();
        this._transcribeAndSpeak();
        return;
      }

      // if speech has gone on long enough, stop & transcribe
      if (this._isVoiceRecordingTooLong()) {
        logger.info(
          '🎤️ Audio phrase detected! Audio recording limit reached.',
        );
        this.stop();
        this._transcribeAndSpeak();
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
    if (this.isActive) runningAssistant = null;
    this.frames = [];
  }

  _detectSilenceOrNoise(frame: AudioBuffer) {
    const voiceProbability = vad.process(frame);
    return voiceProbability < ASSISTANT_VOICEDETECTION_THRESHOLD;
  }

  _isStartingAudioOnlySilence() {
    return (
      !this.voiceDetected && this.silenceDuration >= ASSISTANT_LISTEN_TIMEOUT
    );
  }

  _isSilenceAfterVoice() {
    return (
      this.voiceDetected && this.silenceDuration >= ASSISTANT_VOICE_TIMEOUT
    );
  }

  _isVoiceRecordingTooLong() {
    return (
      this.voiceDetected &&
      this.totalAudioDuration >= ASSISTANT_MAX_RECORDING_LENGTH
    );
  }

  _transcribeAndSpeak() {
    logger.info('✏️ Transcribing audio...');

    // TODO: streaming transcribe to audio. Once speaking begins, set
    // this.isSpeaking = true and clear this.frames, then resets this.isSpeaking
    // to false once speaking ends.
  }
}

// Returns the duration of the frame in milliseconds
function frameDuration(frame: AudioBuffer): number {
  return (frame.length / SAMPLE_RATE) * 1000;
}
