import { describe, it, expect, vi } from 'vitest';
import { recognize } from './recognizer';
import { convertRawAudioToWav } from './utils/audio';
import { openai } from './openai/client';
import { toFile } from 'openai';
import { SAMPLE_RATE } from './listener';
import { type AudioBuffer } from './listener.types';

vi.mock('./utils/audio', () => ({
  convertRawAudioToWav: vi.fn(),
}));

vi.mock('./openai/client', () => ({
  openai: {
    audio: {
      transcriptions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('./listener', () => ({
  SAMPLE_RATE: 16000,
}));

vi.mock('openai', () => ({
  toFile: vi.fn(),
}));

describe('recognize', () => {
  it('should return an empty string for an empty audio buffer', async () => {
    const result = await recognize({ length: 0 } as AudioBuffer);
    expect(result).toBe('');
  });

  it('should transcribe audio correctly', async () => {
    const mockAudioBuffer = { length: 10 } as AudioBuffer;
    const mockWavFile = new Uint8Array(new ArrayBuffer(8));
    const mockTranscription = { text: 'transcribed text' };

    vi.mocked(convertRawAudioToWav).mockReturnValue(mockWavFile);
    vi.mocked(toFile).mockResolvedValue(
      new File([mockWavFile], 'audio_buffer.wav'),
    );
    vi.mocked(openai.audio.transcriptions.create).mockResolvedValue(
      mockTranscription,
    );

    const result = await recognize(mockAudioBuffer);

    expect(convertRawAudioToWav).toHaveBeenCalledWith(
      mockAudioBuffer,
      SAMPLE_RATE,
    );
    expect(toFile).toHaveBeenCalledWith(mockWavFile, 'audio_buffer.wav');
    expect(openai.audio.transcriptions.create).toHaveBeenCalledWith({
      file: expect.any(File),
      model: 'whisper-1',
    });
    expect(result).toBe(mockTranscription.text);
  });
});
