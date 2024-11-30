'use strict';

const { stat } = require('node:fs/promises');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

const findChromePath = async () => {
  const paths = [
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (Arm)\\Google\\Chrome\\Application\\chrome.exe',
  ];
  const getPathStat = (p) =>
    stat(p)
      .catch(() => null)
      .then((s) => (s ? p : null));
  return await Promise.any(paths.map(getPathStat)).catch(() => null);
};

const launchBrowser = async (options = {}) => {
  const { chromePath, proxy, onChromePathPrompt, ...rest } = options;
  let executablePath = chromePath || (await findChromePath());
  let browser = null;
  let page = null;
  const args = ['--no-sandbox', '--start-maximized', '--lang=ru'];
  if (proxy) args.push(`--proxy-server=${proxy}`);
  const mainOptions = {
    headless: true,
    args,
    userDataDir: './config/chrome',
    ...rest,
  };
  while (!browser || !page) {
    try {
      const launchOptions = executablePath
        ? { executablePath, ...mainOptions }
        : { channel: 'chrome', ...mainOptions };
      browser = await puppeteer.launch(launchOptions);
      page = (await browser?.newPage()) ?? null;
    } catch (e) {
      if (!onChromePathPrompt) throw e;
      const answer = await onChromePathPrompt?.(
        'Enter valid Chrome executable path',
      );
      if (answer) executablePath = answer;
    }
  }
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

const fetchViaBrowser = async (resource, options, browser) => {
  const browserInstance = browser ? browser : (await launchBrowser()).browser;
  // Load base url on page and parse cookies
  const page = await browserInstance.newPage();
  await page.bringToFront();
  const { origin } = new URL(resource);
  await page.evaluate((url) => {
    window.open(url, '_self');
  }, origin);
  await page.waitForNavigation();

  const isWaitingForRedirect = options?.redirect === 'manual';
  const response =
    (await new Promise()) <
    Response >
    ((resolve) => {
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
          (resource, init) => {
            const fetchData = async () => {
              const initBody = init.body;
              const body =
                typeof initBody === 'object' && initBody.type === 'Buffer'
                  ? Uint8Array.from(initBody.data)
                  : init.body;
              init.body = body;
              const response = await globalThis.fetch(resource, init);
              return {
                body: new Uint8Array(await response.arrayBuffer()),
                init: {
                  headers: response.headers,
                  status: response.status,
                  statusText: response.statusText,
                },
              };
            };
            return fetchData();
          },
          resource,
          options,
        )
        .then(({ body, init }) => {
          return isWaitingForRedirect
            ? {}
            : resolve(new Response(Buffer.from(Object.values(body)), init));
        })
        .catch(() => ({ body: null, init: undefined }));
    });

  const cookies = await page.cookies();

  page.removeAllListeners('response');
  if (!page.isClosed) await page.close();

  return { response, cookies };
};

module.exports = { launchBrowser, fetchViaBrowser };
