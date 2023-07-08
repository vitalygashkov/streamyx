import http2, {
  ClientHttp2Session,
  IncomingHttpStatusHeader,
  IncomingHttpHeaders as IncomingHttp2Headers,
} from 'node:http2';
import { IncomingHttpHeaders } from 'node:http';
import { URL } from 'node:url';
import { request, fetch, Request, RequestInit, Response } from 'undici';
import BodyReadable from 'undici/types/readable';
import puppeteer, { VanillaPuppeteer } from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { logger } from './logger';
import { prompt, sleep } from './utils';

puppeteer.use(StealthPlugin());

const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

const USER_AGENTS = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  chromeMacOS:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
  chromeLinux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
  firefoxWindows: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:90.0) Gecko/20100101 Firefox/90.0',
  smartTv:
    'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) 76.0.3809.146/6.0 TV Safari/537.36',
  tizen:
    'Mozilla/5.0 (Linux; U; Tizen 2.0; en-us) AppleWebKit/537.1 (KHTML, like Gecko) Mobile TizenBrowser/2.0',
};

const parseUrlFromResource = (resource: string | URL | Request) =>
  resource instanceof Request
    ? new URL(resource.url)
    : typeof resource === 'string'
    ? new URL(resource)
    : resource;

class Http {
  public headers: Record<string, string>;
  public cookies: string[];
  private sessions: Map<string, ClientHttp2Session>;
  private retryCount: number;
  private retryThreshold: number;
  private retryDelayMs: number;

  #session?: ClientHttp2Session;
  #lastOrigin?: string;

  #browser: VanillaPuppeteer['launch'] | null;
  #browserPage: any;

  constructor() {
    this.headers = { 'User-Agent': USER_AGENTS.tizen };
    this.cookies = [];
    this.sessions = new Map();
    this.retryCount = 0;
    this.retryThreshold = 3;
    this.retryDelayMs = 1500;
    this.#browser = null;
  }

  get hasSessions() {
    return !!this.sessions.size;
  }

  async fetch(resource: string | URL | Request, options?: RequestInit): Promise<Response> {
    const session = this.getHttp2Session(resource);
    if (this.#browser) {
      return this.fetchViaBrowser(resource, options);
    } else if (session) {
      return this.fetchHttp2(session, resource, options);
    } else {
      return this.fetchHttp1(resource, options);
    }
  }

  async launchBrowser() {
    let executablePath;
    while (!this.#browser) {
      try {
        const launchOptions = executablePath ? { executablePath } : { channel: 'chrome' };
        this.#browser = await puppeteer.launch(launchOptions);
        this.#browserPage = await this.#browser.newPage();
      } catch (e) {
        logger.error((e as Error).message);
        executablePath = await prompt('Enter valid Chrome executable path');
      }
    }
  }

  async fetchViaBrowser(resource: string | URL | Request, options?: RequestInit) {
    await this.#browserPage.goto(resource);
    const { body, init } = await this.#browserPage.evaluate(
      (resource: any, options: any) => {
        const fetchData = async () => {
          const response = await globalThis.fetch(
            resource as globalThis.RequestInfo,
            options as globalThis.RequestInit
          );
          return {
            body: await response.text(),
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
      options
    );
    return new Response(body, init);
  }

  async closeBrowser() {
    if (this.#browser) {
      await this.#browser.close();
      this.#browser = null;
    }
  }

  private getHttp2Session(resource: string | URL | Request) {
    const url = parseUrlFromResource(resource);
    const session = this.sessions.get(url.host);
    if (session) {
      return session;
    } else {
      const session = this.createHttp2Session(url.host);
      if (session) {
        session.on('error', (e) => {
          logger.error('Http2 session error');
          logger.debug(e);
        });
        this.sessions.set(url.host, session);
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

  private async fetchHttp2(
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
        if (this.retryCount === this.retryThreshold) reject(err);
        this.retryCount++;
        await new Promise<void>((resolve) => setTimeout(resolve, this.retryDelayMs));
        const response = await this.fetchHttp2(session, resource, options);
        resolve(response);
      });
      stream.on('end', () => {
        resolve(
          new Response(data, {
            status: Number(headers[':status']),
            headers: headers as Record<string, string>,
          })
        );
      });
    });
  }

  private async fetchHttp1(
    resource: string | URL | Request,
    options?: RequestInit
  ): Promise<Response> {
    try {
      const headers = { ...this.headers, ...options?.headers };
      const response = await fetch(resource, {
        ...options,
        headers,
      });
      const setCookie = response.headers.get('set-cookie');
      if (setCookie) this.appendCookies(setCookie);
      return response;
    } catch (e) {
      if (this.retryCount === this.retryThreshold) throw e;
      this.retryCount++;
      await new Promise<void>((resolve) => setTimeout(resolve, this.retryDelayMs));
      const response = await this.fetchHttp1(resource, options);
      return response;
    }
  }

  async request(url: string, options?: any): Promise<any> {
    const requestUrl = new URL(url);
    const forceHttp2 = options?.http2;
    delete options?.http2;
    if (forceHttp2) {
      return this.#http2Request(requestUrl, options);
    } else {
      this.#session?.destroy();
      return this.#httpsRequest(requestUrl, options);
    }
  }

  async #httpsRequest(url: string | URL, options: any) {
    const requestOptions = {
      maxRedirections: 5,
      ...options,
      headers: { ...this.headers, ...options?.headers },
    };
    const { statusCode, headers, body, context } = await request(url, requestOptions);
    if (headers['set-cookie']) this.appendCookies(headers['set-cookie']);

    const buffers = [];
    for await (const chunk of body) buffers.push(chunk);
    const dataBuffer = Buffer.concat(buffers);
    const data = options?.responseType === 'buffer' ? dataBuffer : dataBuffer.toString();

    // const retryRequest = async (error) => {
    //   logger.debug(`Retry request. URL: ${url}`);
    //   if (this.#retryCount === this.#retryThreshold) reject(error);
    //   this.#retryCount++;
    //   const TWO_SECS = 2000;
    //   await new Promise((resolve) => setTimeout(() => resolve(), TWO_SECS));
    //   const response = await this.#httpsRequest(url, options);
    // };

    return { statusCode, headers, body: data, context };
  }

  async #http2Request(url: URL, options: any) {
    const sameOrigin = this.#lastOrigin === url.origin;
    if ((!sameOrigin && this.#lastOrigin) || !this.#session || this.#session.destroyed) {
      if (this.#session && !this.#session?.closed) {
        try {
          await new Promise<void>((resolve, reject) => {
            this.#session?.close(resolve);
          });
          this.#session.destroy();
        } catch (e) {
          console.log(e);
        }
      }
      if (!this.#session || this.#session.destroyed || this.#session.closed) {
        this.#session = http2.connect(url.href);
        this.#session.on('error', (e) => {
          logger.error('HTTP2 session error');
          logger.debug(url.toString());
          logger.debug(e);
        });
      }
    }

    return new Promise((resolve, reject) => {
      if (!this.#session) return;
      const requestOptions = {
        ':authority': url.host,
        ':path': url.pathname + url.search,
        ':method': options?.method || HTTP_METHOD.GET,
        ':scheme': url.protocol.replace(':', ''),
        ...this.headers,
        ...options?.headers,
      };

      const stream = this.#session.request(requestOptions);
      if (options?.responseType !== 'buffer') stream.setEncoding('utf8');
      if (options?.body) stream.write(options.body);

      let statusCode = '';
      stream.on('response', (headers) => {
        if (headers[':status']) statusCode = headers[':status'].toString();
        if (headers['set-cookie']) this.appendCookies(headers['set-cookie']);
      });

      const retryRequest = async (e: any) => {
        logger.debug(`Retry request. URL: ${url}`);
        if (this.retryCount === this.retryThreshold) reject(e);
        this.retryCount++;
        const TWO_SECS = 2000;
        await new Promise<void>((resolve) => setTimeout(() => resolve(), TWO_SECS));
        const response = await this.#http2Request(url, options);
        return response;
      };

      const chunks: Buffer[] | string[] = [];
      let body: Buffer | string = '';
      stream
        .on('data', (chunk) => {
          if (options?.responseType === 'buffer') (chunks as Buffer[]).push(Buffer.from(chunk));
          else (chunks as string[]).push(chunk);
        })
        .on('error', async (e) => {
          logger.error(`HTTP2 request stream error`);
          logger.debug(url.toString());
          logger.debug(e);
          const response: any = await retryRequest(e);
          if (response?.body) resolve(response);
          else reject(e);
        })
        .on('end', () => {
          if (options?.responseType === 'buffer') body = Buffer.concat(chunks as Buffer[]);
          else body = (chunks as string[]).join('');
          resolve({ body, statusCode: parseInt(statusCode) });
        });

      stream.end();
    });
  }

  appendCookies(setCookie: string | string[]) {
    const newCookies = typeof setCookie === 'string' ? [setCookie] : setCookie;
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

  async destroySessions() {
    for (const [key, session] of this.sessions) {
      await new Promise<void>((resolve) => session.close(resolve));
      session.destroy();
      this.sessions.delete(key);
    }
    this.#session?.destroy(); // TODO: Remove
  }
}

const receiveData = async (body: BodyReadable) => {
  const buffers: Buffer[] = [];
  for await (const chunk of body) buffers.push(chunk);
  return Buffer.concat(buffers);
};

const httpRequest = async (url: string, options = {}) => {
  const { statusCode, headers, body } = await request(url, {
    bodyTimeout: 5000,
    headersTimeout: 5000,
    ...options,
  });
  const data = await receiveData(body);
  return { statusCode, headers, data };
};

const RETRY_THRESHOLD = 3;

const httpFetch = async (url: string, options: any) => {
  const retryCount = options.retryCount || RETRY_THRESHOLD;
  let currentRetry = 0;
  let error: { message: string } | null = null;
  let response: { statusCode: number; headers: IncomingHttpHeaders; data?: Buffer } = {
    statusCode: 0,
    headers: {},
    data: undefined,
  };
  do {
    try {
      response = await httpRequest(url, options);
      if (response.statusCode !== 200) error = { message: `Status code: ${response.statusCode}` };
    } catch (e: any) {
      error = e;
    }
    if (response.statusCode !== 200) {
      currentRetry++;
      await sleep(1);
    }
  } while (response.statusCode !== 200 && currentRetry <= retryCount);
  if (response.statusCode === 200) return response;
  else throw Error(error?.message);
};

export { Http, HTTP_METHOD, USER_AGENTS, httpFetch as fetch };
