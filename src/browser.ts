import { Browser, LaunchOptions, Page, Protocol } from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger';
import { prompt } from './utils';

puppeteer.use(StealthPlugin());

export const launchBrowser = async (options: LaunchOptions = {}) => {
  let executablePath: string | null = null;
  let browser: Browser | null = null;
  let page: Page | null = null;
  const mainOptions = { headless: true, args: ['--no-sandbox'], ...options };
  while (!browser || !page) {
    try {
      const launchOptions = executablePath
        ? { executablePath, ...mainOptions }
        : { channel: 'chrome', ...mainOptions };
      browser = await puppeteer.launch(launchOptions);
      page = (await browser?.newPage()) ?? null;
    } catch (e) {
      logger.error((e as Error).message);
      executablePath = await prompt('Enter valid Chrome executable path');
    }
  }
  const aboutBlankPage = (await browser.pages())[0];
  if (aboutBlankPage) await aboutBlankPage.close();
  return { browser, page, executablePath };
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
