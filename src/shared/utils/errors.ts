export type ErrorWithMetadata = Error & {
  code?: string;
  request_id?: string;
  status?: number;
  type?: string;
};

export function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function getErrorDetails(error: unknown) {
  if (error instanceof Error) {
    const errorWithMetadata = error as ErrorWithMetadata;

    return {
      code: errorWithMetadata.code,
      message: error.message,
      name: error.name,
      requestId: errorWithMetadata.request_id,
      stack: error.stack,
      status: errorWithMetadata.status,
      type: errorWithMetadata.type,
    };
  }

  return { value: error };
}

export function isMissingFileError(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as ErrorWithMetadata).code === 'ENOENT'
  );
}
