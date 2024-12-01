export type LogFn = (msg: string, ...args: any[]) => void;

export type Logger = {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  debug: LogFn;
};
