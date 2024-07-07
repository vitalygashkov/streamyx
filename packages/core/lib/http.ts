import http2, {
  ClientHttp2Session,
  IncomingHttpStatusHeader,
  IncomingHttpHeaders as IncomingHttp2Headers,
} from 'node:http2';
import { URL } from 'node:url';
import { EOL } from 'node:os';
import { fetch, ProxyAgent, Agent, buildConnector } from 'undici';
import { Browser, Page } from 'puppeteer-core';
import { fetch as curl } from '@ossiana/node-libcurl';
import { logger } from './logger';
import { browserCookiesToList, launchBrowser } from './browser';
import { randomizeCiphers } from './tls';
import fs from './fs';

const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

const USER_AGENTS = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  chromeMacOS:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  chromeLinux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  smartTv:
    'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 76.0.3809.146/6.0 TV Safari/537.36',
  tizen:
    'Mozilla/5.0 (Linux; U; Tizen 2.0; en-us) AppleWebKit/537.1 (KHTML, like Gecko) Mobile TizenBrowser/2.0',
};

const COMMON_HEADERS = {
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Accept-Language': 'ru-RU,ru;q=0.9,en-NL;q=0.8,en-US;q=0.7,en;q=0.6,vi;q=0.5',
  'Sec-Ch-Ua-Mobile': '?0',
  'Upgrade-Insecure-Requests': '1',
};

const CHROME_MACOS_JA3 =
  '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,11-0-43-35-18-13-65281-27-10-23-45-17513-16-65037-51-5,25497-29-23-24,0';
const CHROME_LINUX_JA3 =
  '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,65037-16-27-45-0-10-18-17513-35-65281-51-13-11-5-23-43,25497-29-23-24,0';
const CHROME_WINDOWS_JA3 =
  '771,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,65037-10-17513-18-13-43-45-11-51-35-0-16-5-65281-27-23,25497-29-23-24,0';

const CLIENTS = {
  darwin: {
    headers: {
      ...COMMON_HEADERS,
      'User-Agent': USER_AGENTS.chromeMacOS,
      'Sec-Ch-Ua': '"Google Chrome";v="126", "Chromium";v="126", "Not.A/Brand";v="24"',
      'Sec-Ch-Ua-Platform': '"macOS"',
    },
    fingerprint: CHROME_MACOS_JA3,
  },
  linux: {
    headers: {
      ...COMMON_HEADERS,
      'User-Agent': USER_AGENTS.chromeLinux,
      'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'Sec-Ch-Ua-Platform': '"Linux"',
    },
    fingerprint: CHROME_LINUX_JA3,
  },
  win32: {
    headers: {
      ...COMMON_HEADERS,
      'User-Agent': USER_AGENTS.chromeWindows,
      'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
      'Sec-Ch-Ua-Platform': '"Windows"',
    },
    fingerprint: CHROME_WINDOWS_JA3,
  },
};

const CLIENT = CLIENTS[process.platform as 'darwin' | 'linux' | 'win32'];

const parseUrlFromResource = (resource: string | URL | Request) =>
  resource instanceof Request
    ? new URL(resource.url)
    : typeof resource === 'string'
      ? new URL(resource)
      : resource;

const DEFAULT_MAX_REDIRECTIONS = 5;

export interface IHttp {
  headers: Record<string, string>;
  cookies: string[];
  fetch(resource: string | URL | Request, options?: RequestInit): Promise<Response>;
  fetchAsChrome(resource: string | URL | Request, options?: RequestInit): Promise<Response>;
  appendCookies(setCookie: string | string[]): void;
  setAgent(proxy?: string | null): void;
  setCookies(cookies: string[]): void;
  setHeader(name: string, value: string): void;
  setHeaders(headers: Record<string, string>): void;
  removeHeader(name: string): void;
  destroySessions(): Promise<void>;
}

class Http implements IHttp {
  headers: Record<string, string>;
  cookies: string[];

  #sessions: Map<string, ClientHttp2Session>;
  #retryThreshold: number;
  #retryDelayMs: number;
  #session?: ClientHttp2Session;
  browser: Browser | null;
  browserPage: Page | null;
  #failures: Map<string | URL | Request, number> = new Map();

  #agent!: ProxyAgent | Agent;
  #proxy?: string | null;

  constructor({ proxy }: { proxy?: string | null } = {}) {
    this.headers = { 'User-Agent': USER_AGENTS.tizen };
    this.cookies = [];
    this.#sessions = new Map();
    this.#retryThreshold = 3;
    this.#retryDelayMs = 1500;
    this.browser = null;
    this.browserPage = null;
    this.setAgent(proxy);
  }

  setAgent(proxy?: string | null) {
    if (this.#proxy === proxy) return;
    this.#proxy = proxy;
    const connector = buildConnector({ ciphers: randomizeCiphers() });
    if (proxy) {
      this.#agent = new ProxyAgent({
        connect: connector,
        uri: proxy,
        maxRedirections: DEFAULT_MAX_REDIRECTIONS,
      });
    } else {
      this.#agent = new Agent({ connect: connector, maxRedirections: DEFAULT_MAX_REDIRECTIONS });
    }
  }

  get retries() {
    return this.#retryThreshold;
  }

  get hasSessions() {
    return !!this.#sessions.size;
  }

  async fetch(resource: string | URL | Request, options?: RequestInit): Promise<Response> {
    if (!resource) throw new Error('Fetch resource is empty');
    const session = this.getHttp2Session(resource);
    if (this.browser) {
      return this.fetchViaBrowser(resource, options);
    } else if (session) {
      return this.fetchHttp2(session, resource, options);
    } else {
      return this.fetchHttp1(resource, options);
    }
  }

  async launchBrowser() {
    const { browser, page } = await launchBrowser({}, this.#proxy);
    this.browser = browser;
    this.browserPage = page;
  }

  async fetchAsChrome(resource: string | URL | Request, options?: RequestInit): Promise<Response> {
    try {
      const headers = {
        ...this.headers,
        ...options?.headers,
        ...CLIENT.headers,
      };
      const init = {
        ...options,
        redirect: options?.redirect !== 'manual',
        body: options?.body as Buffer | string,
        headers,
        ja3: CLIENT.fingerprint,
      } as any;
      const curlResponse = await curl(resource as string | URL, init);
      const text = await curlResponse.text();
      const status = curlResponse.status();
      const responseHeaders = await curlResponse.headers();
      const isSuccess = status >= 200 && status <= 299;
      if (!isSuccess && this.#hasAttempts(resource)) {
        await this.#nextRetry(resource);
        return this.fetchAsChrome(resource, init);
      }
      this.appendCookies(responseHeaders.getSetCookie());
      const response = new Response(text, {
        headers: Object.fromEntries(responseHeaders.entries()),
        status: status,
      });
      return response;
    } catch (e) {
      if (!this.#hasAttempts(resource)) {
        logger.debug(e);
        throw e;
      }
      await this.#nextRetry(resource);
      return this.fetchAsChrome(resource, options);
    }
  }

  async fetchViaBrowser(resource: string | URL | Request, options?: RequestInit) {
    if (!this.browserPage || !this.browser) await this.launchBrowser();

    // Load base url on page and parse cookies
    const page = await this.browser!.newPage();
    await page.bringToFront();
    const { origin } = parseUrlFromResource(resource);
    await page.evaluate((url) => {
      window.open(url, '_self');
    }, origin);
    await page.waitForNavigation();
    const cookies = await page.cookies();
    this.setCookies(browserCookiesToList(cookies));

    const headers = { ...this.headers, ...options?.headers };
    const init = { ...options, headers };

    const isWaitingForRedirect = init?.redirect === 'manual';
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
          (resource, init) => {
            const fetchData = async () => {
              const response = await globalThis.fetch(
                resource as globalThis.RequestInfo,
                init as globalThis.RequestInit
              );
              return {
                body: await response.text(),
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
          init
        )
        .then(({ body, init }) => (isWaitingForRedirect ? {} : resolve(new Response(body, init))))
        .catch((e) => {
          logger.debug(`Error while evaluate browser fetch: ${e?.message}`);
          return { body: null, init: undefined };
        });
    });

    page.removeAllListeners('response');
    if (!page.isClosed) await page.close();

    return response;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close().catch(() => null);
      this.browser = null;
    }
  }

  private getHttp2Session(resource: string | URL | Request) {
    const url = parseUrlFromResource(resource);
    if (!url) return null;
    const session = this.#sessions.get(url.host);
    if (session) {
      return session;
    } else {
      const session = this.createHttp2Session(url.host);
      if (session) {
        session.on('error', (e) => {
          logger.error('Http2 session error');
          logger.debug(e);
        });
        this.#sessions.set(url.host, session);
        return session;
      } else {
        return null;
      }
    }
  }

  private createHttp2Session(authority: string | URL): ClientHttp2Session | null {
    try {
      return http2.connect(authority);
    } catch (e) {
      return null;
    }
  }

  async fetchHttp2(
    session: ClientHttp2Session,
    resource: string | URL | Request,
    options?: RequestInit
  ): Promise<Response> {
    const url = parseUrlFromResource(resource);
    const stream = session.request({
      ':method': options?.method || HTTP_METHOD.GET,
      ':authority': url.host,
      ':path': url.pathname + url.search,
      ':scheme': url.protocol.replace(':', ''),
      ...this.headers,
      ...(options?.headers as Record<string, string> | undefined),
    });
    if (options?.body) stream.write(options.body);
    stream.end();
    const headers = await new Promise<IncomingHttp2Headers & IncomingHttpStatusHeader>((resolve) =>
      stream.on('response', resolve)
    );
    if (headers['set-cookie']) this.appendCookies(headers['set-cookie']);
    let data: Buffer;
    stream.on('data', (chunk) => {
      data = data ? Buffer.concat([data, chunk]) : chunk;
    });

    return new Promise<Response>((resolve, reject) => {
      stream.on('error', async (err) => {
        if (!this.#hasAttempts(resource)) reject(err);
        await this.#nextRetry(resource);
        const response = await this.fetchHttp2(session, resource, options);
        resolve(response);
      });
      stream.on('end', async () => {
        const status = Number(headers[':status']);
        if (status !== 200 && this.#hasAttempts(resource)) {
          await this.#nextRetry(resource);
          const response = await this.fetchHttp2(session, resource, options);
          resolve(response);
        }
        resolve(new Response(data, { status: status, headers: headers as Record<string, string> }));
      });
    });
  }

  async fetchHttp1(resource: string | URL | Request, options?: RequestInit): Promise<Response> {
    try {
      const headers = { ...this.headers, ...options?.headers };
      const init = {
        ...options,
        body: options?.body as Buffer | string,
        headers,
        dispatcher: this.#agent,
      };
      const response = await fetch(resource as string | URL, init);
      const isSuccess = response.status >= 200 && response.status <= 299;
      if (!isSuccess && this.#hasAttempts(resource)) {
        await this.#nextRetry(resource);
        return this.fetchHttp1(resource, init);
      }
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) this.appendCookies(setCookie);
      return response as Response;
    } catch (e) {
      if (!this.#hasAttempts(resource)) throw e;
      await this.#nextRetry(resource);
      return this.fetchHttp1(resource, options);
    }
  }

  #hasAttempts(resource: string | URL | Request) {
    return this.#getFailuresCount(resource) <= this.#retryThreshold;
  }

  #getFailuresCount(resource: string | URL | Request) {
    return this.#failures.get(resource) || 1;
  }

  #addFailure(resource: string | URL | Request) {
    this.#failures.set(resource, this.#getFailuresCount(resource) + 1);
  }

  async #nextRetry(resource: string | URL | Request) {
    const failuresCount = this.#getFailuresCount(resource);
    if (failuresCount)
      await new Promise<void>((resolve) => setTimeout(resolve, this.#retryDelayMs));
    this.#addFailure(resource);
    logger.debug(`Retry ${failuresCount}/${this.#retryThreshold}: ${String(resource)}`);
  }

  appendCookies(setCookie: string | string[]) {
    const newCookies = typeof setCookie === 'string' ? setCookie.split(', ') : setCookie;
    if (!newCookies || !newCookies?.length) return;
    this.cookies = this.cookies.filter((cookie) => {
      const cookieKey = cookie.split('=')[0];
      const cookieDomain = cookie.split('Domain=')[1]?.split(';')[0];
      const hasMatch = newCookies.some(
        (newCookie) =>
          cookieKey === newCookie.split('=')[0] &&
          cookieDomain === newCookie.split('Domain=')[1]?.split(';')[0]
      );
      return !hasMatch;
    });
    this.setCookies([...this.cookies, ...newCookies]);
  }

  setCookies(cookies: string[]) {
    this.cookies = cookies;
    this.headers.cookie = this.cookies.join('; ');
  }

  setHeader(name: string, value: string) {
    this.headers[name] = value;
  }

  setHeaders(headers: Record<string, string>) {
    this.headers = { ...this.headers, ...headers };
  }

  removeHeader(name: string) {
    delete this.headers[name];
  }

  setRetryCount(value: number) {
    if (value > 1) this.#retryThreshold = value;
  }

  async destroySessions() {
    for (const [key, session] of this.#sessions) {
      await new Promise<void>((resolve) => session.close(resolve));
      session.destroy();
      this.#sessions.delete(key);
    }
    this.#session?.destroy(); // TODO: Remove
  }
}

const importCookies = async (cookiesTxtPath: string): Promise<string[]> => {
  const text = await fs.readText(cookiesTxtPath).catch(() => '');
  if (!text) return [];
  const rows = text
    .split(EOL)
    .filter((line: string) => !!line && !line.startsWith('# '))
    .map((line: string) => line.replace('\r', '').split('\t'));
  const cookies: any[] = [];
  for (const row of rows) {
    const [domain, includeSubdomains, path, secure, expires, name, value] = row;
    cookies.push({
      name,
      value,
      domain: domain.replace('#HttpOnly_', ''),
      hostOnly: includeSubdomains === 'FALSE',
      path,
      secure: secure === 'TRUE',
      expires: Number(expires),
    });
  }
  return browserCookiesToList(cookies);
};

const http = new Http();

export { http, Http, HTTP_METHOD, USER_AGENTS, importCookies };
