type LogLevel = 'info' | 'warn' | 'error';

export interface Logger {
  info(message: string, details?: unknown): void;
  warn(message: string, details?: unknown): void;
  error(message: string, details?: unknown): void;
}

function write(level: LogLevel, message: string, details?: unknown): void {
  const prefix = `[server:${level}]`;
  if (details === undefined) {
    console[level](`${prefix} ${message}`);
    return;
  }
  console[level](`${prefix} ${message}`, details);
}

export const logger: Logger = {
  info(message, details) {
    write('info', message, details);
  },
  warn(message, details) {
    write('warn', message, details);
  },
  error(message, details) {
    write('error', message, details);
  },
};
