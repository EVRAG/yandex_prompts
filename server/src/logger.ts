type LogLevel = 'info' | 'warn' | 'error';

interface LogFields {
  event?: string;
  [key: string]: unknown;
}

export function log(level: LogLevel, message: string, fields: LogFields = {}): void {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...fields,
  };
  const serialized = JSON.stringify(payload);
  if (level === 'error') {
    console.error(serialized);
  } else if (level === 'warn') {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}
