import { Browser, BrowserLaunchArgumentOptions, Page } from 'puppeteer-core';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger';
import { prompt } from './prompt';
import { getSettings, saveSettings } from './settings';
import { getAnyValidPath } from './bin';
import { parseUrlFromResource } from './utils';
import { browserCookiesToList } from './cookies';

puppeteer.use(StealthPlugin());

const findChromePath = async () => {
  const paths = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (Arm)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  return getAnyValidPath(paths);
};

export const launchBrowser = async (options: BrowserLaunchArgumentOptions = {}, proxy?: string | null) => {
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
      const launchOptions = executablePath ? { executablePath, ...mainOptions } : { channel: 'chrome', ...mainOptions };
      browser = await puppeteer.launch(launchOptions);
      page = (await browser?.newPage()) ?? null;
    } catch (e) {
      logger.error((e as Error).message);
      const answer = await prompt.ask({
        executablePath: { label: 'Enter valid Chrome executable path' },
      });
      executablePath = answer.executablePath;
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

export const fetchViaBrowser = async (resource: string | URL | Request, options: RequestInit, browser?: Browser) => {
  const browserInstance = browser ? browser : (await launchBrowser()).browser;

  // Load base url on page and parse cookies
  const page = await browserInstance.newPage();
  await page.bringToFront();
  const { origin } = parseUrlFromResource(resource);
  await page.evaluate((url) => {
    window.open(url, '_self');
  }, origin);
  await page.waitForNavigation();
  const browserCookies = await page.cookies();
  const cookies = browserCookiesToList(browserCookies);

  const isWaitingForRedirect = options?.redirect === 'manual';
  const response = await new Promise<Response>((resolve) => {
    if (isWaitingForRedirect) {
      page.on('response', async (httpResponse) => {
        const url = httpResponse.request().url();
        if (url !== resource) return;
        const response = new Response(null, {
          headers: httpResponse.headers(),
          status: httpResponse.status(),
          statusText: httpResponse.statusText(),
        });
        resolve(response);
      });
    }
    page
      .evaluate(
        (resource, init: globalThis.RequestInit) => {
          const fetchData = async () => {
            const initBody = init.body as string | { type: 'Buffer'; data: number[] };
            const body =
              typeof initBody === 'object' && initBody.type === 'Buffer' ? Uint8Array.from(initBody.data) : init.body;
            init.body = body;
            const response = await globalThis.fetch(resource as globalThis.RequestInfo, init);
            return {
              body: new Uint8Array(await response.arrayBuffer()),
              init: {
                headers: response.headers as unknown as Headers,
                status: response.status,
                statusText: response.statusText,
              } as ResponseInit,
            };
          };
          return fetchData();
        },
        resource,
        options!
      )
      .then(({ body, init }) => {
        return isWaitingForRedirect ? {} : resolve(new Response(Buffer.from(Object.values(body)), init));
      })
      .catch((e) => {
        logger.debug(`Error while evaluate browser fetch: ${e?.message}`);
        return { body: null, init: undefined };
      });
  });

  page.removeAllListeners('response');
  if (!page.isClosed) await page.close();

  return { response, cookies };
};
