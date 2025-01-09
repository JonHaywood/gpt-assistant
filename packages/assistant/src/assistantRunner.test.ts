import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAudioData } from './assistantRunner';
import { Assistant } from './assistant';
import { playEffect, SoundEffect } from './soundEffects';
import { detectWakeword } from './wakeword';
import { type AudioBuffer } from './listener.types';

vi.mock('./assistant', () => ({
  Assistant: {
    stopRunningAssistant: vi.fn(),
    startNewAssistant: vi.fn(),
    getRunninngInstance: vi.fn(),
  },
}));

vi.mock('./soundEffects', () => ({
  playEffect: vi.fn(),
  SoundEffect: {
    BEEP: 'beep',
  },
}));

vi.mock('./wakeword', () => ({
  detectWakeword: vi.fn(),
}));

describe('handleAudioData', () => {
  let mockFrame: AudioBuffer;

  beforeEach(() => {
    mockFrame = new Int16Array(16000) as AudioBuffer;
    vi.clearAllMocks();
  });

  it('should start a new assistant loop if wake word is detected', async () => {
    vi.mocked(detectWakeword).mockReturnValue(true);

    await handleAudioData(mockFrame);

    expect(detectWakeword).toHaveBeenCalledWith(mockFrame);
    expect(playEffect).toHaveBeenCalledWith(SoundEffect.BEEP);
    expect(Assistant.stopRunningAssistant).toHaveBeenCalled();
    expect(Assistant.startNewAssistant).toHaveBeenCalledWith(mockFrame);
    expect(Assistant.getRunninngInstance).not.toHaveBeenCalled();
  });

  it("should pass incoming audio data to the running assistant as long as it's not a wake word", async () => {
    const mockRunningAssistant = {
      handleAudioData: vi.fn(),
    } as unknown as Assistant;
    vi.mocked(detectWakeword).mockReturnValue(false);
    vi.mocked(Assistant.getRunninngInstance).mockReturnValue(
      mockRunningAssistant,
    );

    await handleAudioData(mockFrame);

    expect(detectWakeword).toHaveBeenCalledWith(mockFrame);
    expect(mockRunningAssistant.handleAudioData).toHaveBeenCalledWith(
      mockFrame,
    );
  });

  it('should do nothing if no wake word is detected and no assistant is running', async () => {
    vi.mocked(detectWakeword).mockReturnValue(false);
    vi.mocked(Assistant.getRunninngInstance).mockReturnValue(null);

    await handleAudioData(mockFrame);

    expect(detectWakeword).toHaveBeenCalledWith(mockFrame);
    expect(playEffect).not.toHaveBeenCalled();
    expect(Assistant.stopRunningAssistant).not.toHaveBeenCalled();
    expect(Assistant.startNewAssistant).not.toHaveBeenCalled();
  });
});
