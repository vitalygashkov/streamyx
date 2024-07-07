import { Browser, BrowserLaunchArgumentOptions, Page, Cookie } from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger';
import { prompt } from './prompt';
import { getSettings, saveSettings } from './settings';
import { getAnyValidPath } from './bin';

puppeteer.use(StealthPlugin());

const findChromePath = async () => {
  const paths = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (Arm)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return getAnyValidPath(paths);
};

export const launchBrowser = async (
  options: BrowserLaunchArgumentOptions = {},
  proxy?: string | null
) => {
  const { chromePath } = getSettings();
  let executablePath: string | null = chromePath || (await findChromePath());
  if (!chromePath && executablePath) await saveSettings({ chromePath: executablePath });
  let browser: Browser | null = null;
  let page: Page | null = null;
  const args = ['--no-sandbox', '--start-maximized', '--lang=ru'];
  if (proxy) args.push(`--proxy-server=${proxy}`);
  const mainOptions: BrowserLaunchArgumentOptions = {
    headless: true,
    args,
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
  await page.setBypassCSP(true);
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

  return { browser, page, chromePath: executablePath };
};

export const browserCookiesToList = (cookies: Cookie[]) => {
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
