import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createChildAbortController,
  getAppLevelAbortSignal,
  _resetAppLevelAbortSignal,
  setupProcessShutdownHandlers,
  signalSystemShutdown,
} from './shutdown';

vi.mock('console');

describe('shutdown', () => {
  let appLevelAbortSignal: AbortSignal;

  beforeEach(() => {
    _resetAppLevelAbortSignal();
    appLevelAbortSignal = getAppLevelAbortSignal();
  });

  it('should return the same app-level abort signal over multiple calls', () => {
    const otherSignal = getAppLevelAbortSignal();
    expect(appLevelAbortSignal).toBe(otherSignal);
  });

  it('should abort the app-level abort signal when shutting down', () => {
    signalSystemShutdown();
    expect(appLevelAbortSignal.aborted).toBe(true);
  });

  describe('createChildAbortController', () => {
    it('should not abort app-level signal when child signal is aborted', () => {
      const child = createChildAbortController();
      child.abort();
      expect(getAppLevelAbortSignal().aborted).toBe(false);
    });

    it('should abort child signal when app-level signal is aborted', () => {
      const child = createChildAbortController();
      signalSystemShutdown();
      expect(child.signal.aborted).toBe(true);
    });
  });

  describe('setupProcessShutdownHandlers', () => {
    it.each([['SIGINT'], ['SIGTERM'], ['uncaughtException']])(
      'should abort when %s process event is triggered',
      (event) => {
        const mockProcess = {
          handlers: {} as Record<string, () => void>,
          on: vi.fn().mockImplementation((event, handler) => {
            mockProcess.handlers[event] = handler;
          }),
          trigger: (event: string) => {
            mockProcess.handlers[event]();
          },
        };
        vi.stubGlobal('process', mockProcess);

        // wire up process handlers
        setupProcessShutdownHandlers();

        // trigger the specified event
        mockProcess.trigger(event);

        expect(appLevelAbortSignal.aborted).toBe(true);
      },
    );
  });
});
