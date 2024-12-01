export type LogFn = (msg: string, ...args: any[]) => void;

export type AppLogger = {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
};
