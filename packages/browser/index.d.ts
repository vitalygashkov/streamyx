import type {
  Browser,
  BrowserLaunchArgumentOptions,
  Page,
} from 'puppeteer-core';

type LaunchBrowserOptions = BrowserLaunchArgumentOptions & {
  chromePath?: string;
  proxy?: string | null;
  onChromePathPrompt?: (message: string) => Promise<string>;
};

type LaunchBrowserResponse = {
  browser: Browser;
  page: Page;
  chromePath: string | null;
};

export function launchBrowser(
  options?: LaunchBrowserOptions,
): Promise<LaunchBrowserResponse>;

export function fetchViaBrowser(
  resource: string,
  options: RequestInit,
  browser?: Browser,
): Promise<{
  response: Response;
  cookies: Cookie[];
}>;
