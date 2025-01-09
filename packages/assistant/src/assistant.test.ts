import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Assistant } from './assistant';
import { recognize } from './recognizer';
import { concatAudioBuffers } from './utils/audio';
import { type AudioBuffer } from './listener.types';
import { askLLM } from './openai/ask';
import { speak } from './speak';
import { vad } from './picovoice';
import { parentLogger } from './logger';
import { detectStopCommand } from './stopDetector';

type Logger = ReturnType<typeof parentLogger.child>;

// mocks are hoisted to the top of the file (before imports), so
// any local variables that are used in the mock functions must be
// defined in this block, because they are hoisted as well. This is
// only needed for variables that are referenced outside of the
// mock functions.
const mockConstants = vi.hoisted(() => {
  return {
    sampleRate: 16000,
    voiceDetectionThreshold: 0.5,
    postSpeechSilenceTimeoutInSec: 2, // 2 seconds
    maxRecordingLengthInSec: 3, // 3 seconds
    onlySilenceTimeoutInSec: 4, // 4 seconds
  };
});

// mocks used in module imports that need to be referenced in tests
// that can't be handled in a simple `vi.mocked` call.
const mockRefs = vi.hoisted(() => {
  return {
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger,
  };
});

vi.mock('./config', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('./config')>();
  return {
    ...originalModule,
    ASSISTANT_VOICEDETECTION_THRESHOLD: mockConstants.voiceDetectionThreshold,
    ASSISTANT_POST_SPEECH_SILENCE_TIMEOUT:
      mockConstants.postSpeechSilenceTimeoutInSec * 1000,
    ASSISTANT_MAX_RECORDING_LENGTH:
      mockConstants.maxRecordingLengthInSec * 1000,
    ASSISTANT_ONLY_SILENCE_TIMEOUT:
      mockConstants.onlySilenceTimeoutInSec * 1000,
  };
});

vi.mock('./logger', () => ({
  parentLogger: {
    child: vi.fn().mockReturnValue(mockRefs.logger),
  },
}));

vi.mock('./listener', () => ({
  SAMPLE_RATE: mockConstants.sampleRate,
}));

vi.mock('./picovoice', () => ({
  vad: {
    process: vi.fn(),
  },
}));

vi.mock('./stopDetector', () => ({
  detectStopCommand: vi.fn(),
}));

vi.mock('./recognizer', () => ({
  recognize: vi.fn(),
}));

vi.mock('./utils/audio', async (importOriginal) => {
  const originalModule = await importOriginal<typeof import('./utils/audio')>();
  return {
    ...originalModule,
    concatAudioBuffers: vi.fn(),
  };
});

vi.mock('./openai/ask', () => ({
  askLLM: vi.fn(),
}));

vi.mock('./speak', () => ({
  speak: vi.fn(),
}));

function createAudioBuffer(durationInSec: number = 1): AudioBuffer {
  return new Int16Array(
    durationInSec * mockConstants.sampleRate,
  ) as AudioBuffer;
}

describe('Assistant', () => {
  let assistant: Assistant;

  beforeEach(() => {
    const initialFrame = createAudioBuffer();
    Assistant.stopRunningAssistant(); // clear any running assistant
    assistant = Assistant.startNewAssistant(initialFrame); // start a new assistant

    vi.clearAllMocks();
  });

  it('should stop the assistant loop when requested', () => {
    Assistant.stopRunningAssistant();

    expect(Assistant.getRunninngInstance()).toBeNull();
  });

  it('should reset the assistant state when requested', () => {
    assistant.voiceDetected = true;
    assistant.silenceDuration = 1000; // can be any number
    assistant.totalAudioDuration = 5000; // can be any number

    assistant.reset();

    expect(assistant.frames).toEqual([]);
    expect(assistant.voiceDetected).toBe(false);
    expect(assistant.silenceDuration).toBe(0);
    expect(assistant.totalAudioDuration).toBe(0);
  });

  it('should ignore incoming audio data if assistant is busy', async () => {
    const mockFrame = createAudioBuffer();

    assistant.isBusy = true;

    await assistant.handleAudioData(mockFrame);

    expect(vad.process).not.toHaveBeenCalled();
    expect(recognize).not.toHaveBeenCalled();
    expect(askLLM).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('should detect stop command even if assistant is busy transcribing or speaking', async () => {
    const mockFrame = createAudioBuffer();

    assistant.isBusy = true;

    vi.mocked(detectStopCommand).mockReturnValue(true);

    await assistant.handleAudioData(mockFrame);

    expect(detectStopCommand).toHaveBeenCalledWith(mockFrame);
    expect(vad.process).not.toHaveBeenCalled();
    expect(recognize).not.toHaveBeenCalled();
    expect(askLLM).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('should stop assistant if only silence is detected', async () => {
    const mockFrame = createAudioBuffer(mockConstants.onlySilenceTimeoutInSec);
    const mockVoiceProbability = 0; // lower than voice threshold to indicate silence

    vi.mocked(vad.process).mockReturnValue(mockVoiceProbability);

    await assistant.handleAudioData(mockFrame);

    expect(vad.process).toHaveBeenCalledWith(mockFrame);
    expect(assistant.isBusy).toBe(false);
    expect(mockRefs.logger.info).toHaveBeenCalledWith(
      'Stopping assistant loop due to silence.',
    );
    expect(recognize).not.toHaveBeenCalled();
    expect(askLLM).not.toHaveBeenCalled();
    expect(speak).not.toHaveBeenCalled();
  });

  it('should transcribe and speak response after voice is detected', async () => {
    // create a buffer that is longer than the post-speech silence timeout
    const mockAudioBuffer = createAudioBuffer(
      mockConstants.postSpeechSilenceTimeoutInSec * 2,
    );
    const mockVoiceProbability = 0; // lower than voice threshold to indicate silence
    const mockText = 'transcribed text';
    const mockResponse = 'response text';

    assistant.isBusy = false;
    assistant.voiceDetected = true; // pretend voice was detected

    vi.mocked(vad.process).mockReturnValue(mockVoiceProbability);
    vi.mocked(concatAudioBuffers).mockReturnValue(mockAudioBuffer);
    vi.mocked(recognize).mockResolvedValue(mockText);
    vi.mocked(askLLM).mockResolvedValue(mockResponse);

    await assistant.handleAudioData(mockAudioBuffer);

    expect(recognize).toHaveBeenCalledWith(mockAudioBuffer);
    expect(askLLM).toHaveBeenCalledWith(mockText);
    expect(speak).toHaveBeenCalledWith(mockResponse);
    expect(assistant.isBusy).toBe(false);
    expect(mockRefs.logger.info).toHaveBeenCalledWith(
      '🎤️ Audio phrase detected!',
    );
  });

  it('should transcribe and speak response after voice is detected for longer than max recording length', async () => {
    // create a buffer that is longer than the max recording length
    const mockAudioBuffer = createAudioBuffer(
      mockConstants.maxRecordingLengthInSec + 1,
    );
    // higher than voice threshold to indicate voice
    const mockVoiceProbability = mockConstants.voiceDetectionThreshold + 0.1;
    const mockText = 'transcribed text';
    const mockResponse = 'response text';

    assistant.isBusy = false;
    assistant.voiceDetected = true;

    vi.mocked(vad.process).mockReturnValue(mockVoiceProbability);
    vi.mocked(concatAudioBuffers).mockReturnValue(mockAudioBuffer);
    vi.mocked(recognize).mockResolvedValue(mockText);
    vi.mocked(askLLM).mockResolvedValue(mockResponse);

    await assistant.handleAudioData(mockAudioBuffer);

    expect(recognize).toHaveBeenCalledWith(mockAudioBuffer);
    expect(askLLM).toHaveBeenCalledWith(mockText);
    expect(speak).toHaveBeenCalledWith(mockResponse);
    expect(assistant.isBusy).toBe(false);
    expect(mockRefs.logger.info).toHaveBeenCalledWith(
      '🎤️ Audio phrase detected! Audio recording limit reached.',
    );
  });

  it('should stop when assistant loop causes an error', async () => {
    const mockAudioBuffer = createAudioBuffer();

    vi.mocked(vad.process).mockImplementation(() => {
      throw new Error('something weird happened');
    });

    await assistant.handleAudioData(mockAudioBuffer);

    expect(assistant.isBusy).toBe(false);
    expect(mockRefs.logger.error).toHaveBeenCalled();
    expect(Assistant.getRunninngInstance()).toBeNull();
  });
});
