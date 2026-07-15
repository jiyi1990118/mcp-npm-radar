export interface RetryOptions {
  retries?: number;
  delay?: number;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  { retries = 3, delay = 1000 }: RetryOptions = {}
): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const status = err?.response?.status;
    const isClientError = typeof status === 'number' && status >= 400 && status < 500;
    if (retries <= 0 || isClientError) throw err;
    await new Promise((r) => setTimeout(r, delay));
    return retryWithBackoff(fn, { retries: retries - 1, delay: delay * 2 });
  }
}
