type LogLevel = "info" | "warn" | "error";

function log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  const prefix = `[server:${level}]`;

  if (meta) {
    console[level](prefix, message, meta);
    return;
  }

  console[level](prefix, message);
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>): void {
    log("info", message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    log("warn", message, meta);
  },
  error(message: string, meta?: Record<string, unknown>): void {
    log("error", message, meta);
  }
};
