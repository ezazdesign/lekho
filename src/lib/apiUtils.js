/**
 * Utility to wrap any promise with a timeout.
 * If the promise takes longer than timeoutMs, it rejects with a Timeout Error.
 */
export const withTimeout = (promise, timeoutMs = 15000, message = 'Network request timed out') => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(message)), timeoutMs)
  );

  return Promise.race([promise, timeoutPromise]);
};
