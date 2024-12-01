import { App } from './app';
import { AppStorage } from './storage';
import { AppHttp } from './http';
import { AppLogger } from './logger';

declare global {
  const app: App;
  const storage: AppStorage;
  const http: AppHttp;
  const logger: AppLogger;
}
