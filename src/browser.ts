import { Browser, BrowserLaunchArgumentOptions, Page, Protocol } from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger';
import { prompt } from './utils';
import { getSettings, saveSettings } from './settings';

puppeteer.use(StealthPlugin());

export const launchBrowser = async (options: BrowserLaunchArgumentOptions = {}) => {
  const { chromePath } = getSettings();
  let executablePath: string | null = chromePath;
  let browser: Browser | null = null;
  let page: Page | null = null;
  const mainOptions: BrowserLaunchArgumentOptions = {
    headless: true,
    args: ['--no-sandbox', '--start-maximized', '--lang=ru'],
    userDataDir: './config/chrome',
    ...options,
  };
  while (!browser || !page) {
    try {
      const launchOptions = executablePath
        ? { executablePath, ...mainOptions }
        : { channel: 'chrome', ...mainOptions };
      browser = await puppeteer.launch(launchOptions);
      page = (await browser?.newPage()) ?? null;
    } catch (e) {
      logger.error((e as Error).message);
      executablePath = await prompt.waitForInput('Enter valid Chrome executable path');
    }
  }
  if (executablePath !== chromePath) saveSettings({ chromePath: executablePath });
  const aboutBlankPage = (await browser.pages())[0];
  if (aboutBlankPage) await aboutBlankPage.close();

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'language', {
      get: function () {
        return 'ru';
      },
    });
    Object.defineProperty(navigator, 'languages', {
      get: function () {
        return ['ru'];
      },
    });
  });
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ru' });

  return { browser, page };
};

export const browserCookiesToList = (cookies: Protocol.Network.Cookie[]) => {
  return cookies.map((cookie) => {
    let row = `${cookie.name}=${cookie.value}`;
    if (cookie.domain) row += `; Domain=${cookie.domain}`;
    if (cookie.expires) row += `; Expires=${cookie.expires}`;
    if (cookie.path) row += `; Path=${cookie.path}`;
    if (cookie.sameSite) row += `; SameSite=${cookie.sameSite}`;
    if (cookie.secure) row += `; Secure`;
    if (cookie.httpOnly) row += `; HttpOnly`;
    return row;
  });
};
