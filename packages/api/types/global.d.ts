import { App } from './app';
import { AppStorage } from './storage';
import { HttpClient } from './http';
import { Logger } from './logger';
import { Question } from './question';
import { Common } from './common';

declare global {
  const app: App;
  const storage: AppStorage;
  const http: HttpClient;
  const logger: Logger;
  const question: Question;
  const common: Common;

  const navigator: {
    appName: string;
    appVersion: string;
    platform: string;
  };
  const document: { cookie: string };
  const console: Console;
  const localStorage: Storage;
  const fetch: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Promise<Response>;
  const prompt: (message: string) => Promise<string>;
}
