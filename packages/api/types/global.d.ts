import { App } from './app';
import { AppStorage } from './storage';

declare global {
  const app: App;
  const storage: AppStorage;
}
