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
}
