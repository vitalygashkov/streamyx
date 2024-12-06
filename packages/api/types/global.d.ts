import { App } from './app';
import { AppStorage } from './storage';
import { HttpClient } from './http';
import { Logger } from './logger';
import { Question } from './question';
import { Common } from './common';

type NavigatorUABrandVersion = {
  brand: string;
  version: string;
};

type UADataValues = {
  architecture: string;
  fullVersionList: NavigatorUABrandVersion[];
  mobile: boolean;
  platform: string;
  platformVersion: string;
};

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
    userAgentData: {
      mobile: boolean;
      platform: string;
      getHighEntropyValues(hints: string[]): Promise<UADataValues>;
    };
  };
  const document: { cookie: string };
  const console: Console;
  const localStorage: Storage;

  function eval(x: string): any;
  function fetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response>;

  function prompt(message: string): Promise<string>;
}
