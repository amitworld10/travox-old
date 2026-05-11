import "server-only";
import type { LoggerPort } from "@/shared/application/ports/logger-port";

export class ConsoleLogger implements LoggerPort {
  info(message: string, context?: Record<string, unknown>) {
    console.info(message, context ?? {});
  }

  warn(message: string, context?: Record<string, unknown>) {
    console.warn(message, context ?? {});
  }

  error(message: string, context?: Record<string, unknown>) {
    console.error(message, context ?? {});
  }
}
