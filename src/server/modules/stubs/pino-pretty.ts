/**
 * Stub for pino-pretty module
 * This file replaces the pino-pretty module in web/Edge Runtime environments
 */

export default function pinoPretty() {
  return {
    write: (msg: string) => console.log(msg),
  };
}
