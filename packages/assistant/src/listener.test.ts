import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listen } from './listener';
import { recorder } from './picovoice';
import { getAppLevelAbortSignal } from './shutdown';
import { ListenerDataCallback } from './listener.types';

vi.mock('./picovoice', () => ({
  recorder: {
    sampleRate: 16000,
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

vi.mock('./shutdown', () => ({
  getAppLevelAbortSignal: vi.fn(),
}));

describe('listen', () => {
  let mockCallback: ListenerDataCallback;
  let mockSignal: AbortSignal;
  let abortController: AbortController;

  beforeEach(() => {
    mockCallback = vi.fn();
    abortController = new AbortController();
    mockSignal = abortController.signal;
    vi.mocked(getAppLevelAbortSignal).mockReturnValue(mockSignal);
  });

  it('should throw an error if the signal is already aborted', async () => {
    abortController.abort();

    await expect(listen(mockCallback)).rejects.toThrow(
      'Signal is already aborted',
    );
  });

  it('should start recording and listen for abort signal', async () => {
    const promise = listen(mockCallback);

    expect(recorder.start).toHaveBeenCalled();

    abortController.abort();

    await promise;

    expect(recorder.stop).toHaveBeenCalled();
  });

  it('should log and stop recording on abort signal', async () => {
    const promise = listen(mockCallback);

    abortController.abort();

    await promise;

    expect(recorder.stop).toHaveBeenCalled();
  });
});
