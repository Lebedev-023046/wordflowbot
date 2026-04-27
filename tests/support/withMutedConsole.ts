export async function withMutedConsole<T>(run: () => Promise<T> | T): Promise<T> {
  const originalError = console.error;
  const originalInfo = console.info;
  const originalWarn = console.warn;

  console.error = () => {};
  console.info = () => {};
  console.warn = () => {};

  try {
    return await run();
  } finally {
    console.error = originalError;
    console.info = originalInfo;
    console.warn = originalWarn;
  }
}
