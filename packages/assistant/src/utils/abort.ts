export const AbortErrorMessage = 'The operation was aborted';

export class AbortError extends Error {
  constructor() {
    super(AbortErrorMessage);
    this.name = 'AbortError';
  }
}

/**
 * Creates a new child AbortController that will be aborted if the
 * parent AbortController is aborted.
 */
export function spawnAbortController(
  parentController: AbortController,
): AbortController {
  const child = new AbortController();

  // If any parent is already aborted, immediately abort the child
  if (parentController.signal.aborted) {
    child.abort();
    return child;
  }

  // Listen for the abort event and abort the child controller
  parentController.signal.addEventListener('abort', () => {
    child.abort();
  });

  return child;
}
