import { App } from './app';
import { AppStorage } from './storage';
import { AppHttp } from './http';

declare global {
  const app: App;
  const storage: AppStorage;
  const http: AppHttp;
}
