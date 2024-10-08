export const AbortErrorMessage = 'The operation was aborted';

/**
 * Manage the abort state of the entire application.
 */
export const AppLevelAbortController = new AbortController();

/**
 * Creates a new AbortController that will be aborted if any of the
 * provided controllers are aborted.
 */
export function combineAbortControllers(
  ...controllers: AbortController[]
): AbortController {
  const combined = new AbortController();

  for (const controller of controllers) {
    // If any controller is already aborted, immediately abort the combined one
    if (controller.signal.aborted) {
      combined.abort();
    } else {
      // Listen for the abort event and abort the combined controller
      controller.signal.addEventListener('abort', () => {
        combined.abort();
      });
    }
  }

  return combined;
}