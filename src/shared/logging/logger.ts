export interface Logger {
  error(message: string, payload?: unknown): void;
  info(message: string, payload?: unknown): void;
  warn(message: string, payload?: unknown): void;
}

interface CreateLoggerParams {
  infoEnabled?: boolean;
  scope: string;
  warnEnabled?: boolean;
}

export function createLogger({
  infoEnabled = false,
  scope,
  warnEnabled = true,
}: CreateLoggerParams): Logger {
  return {
    error(message, payload) {
      log('error', scope, message, payload);
    },
    info(message, payload) {
      if (!infoEnabled) {
        return;
      }

      log('info', scope, message, payload);
    },
    warn(message, payload) {
      if (!warnEnabled) {
        return;
      }

      log('warn', scope, message, payload);
    },
  };
}

function log(
  level: 'error' | 'info' | 'warn',
  scope: string,
  message: string,
  payload?: unknown,
) {
  const line = `[${scope}] ${message}`;

  if (payload === undefined) {
    console[level](line);
    return;
  }

  console[level](line, payload);
}
