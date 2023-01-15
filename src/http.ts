import http2, { ClientHttp2Session } from 'node:http2';
import { request } from 'undici';
import BodyReadable from 'undici/types/readable';
import { logger } from './logger';
import { sleep } from './utils';
import { Buffer } from 'protobufjs';
import { IncomingHttpHeaders } from 'http';

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
  tizen:
    'Mozilla/5.0 (Linux; U; Tizen 2.0; en-us) AppleWebKit/537.1 (KHTML, like Gecko) Mobile TizenBrowser/2.0',
};

class Http {
  #headers: Record<string, string>;
  #cookies: string[];
  #session?: ClientHttp2Session;
  #lastOrigin?: string;
  #retryCount;
  #retryThreshold;

  constructor() {
    this.#headers = {
      'User-Agent': USER_AGENTS.chromeWindows,
    };
    this.#cookies = [];
    this.#retryCount = 1;
    this.#retryThreshold = 3;
  }

  get cookies() {
    return this.#cookies;
  }

  get headers() {
    return this.#headers;
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
      headers: { ...this.#headers, ...options?.headers },
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
          console.log(this.#session);
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
        ...this.#headers,
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
        if (this.#retryCount === this.#retryThreshold) reject(e);
        this.#retryCount++;
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
    this.#cookies = this.#cookies.filter((cookie) => {
      const cookieKey = cookie.split('=')[0];
      const cookieDomain = cookie.split('Domain=')[1]?.split(';')[0];
      const hasMatch = newCookies.some(
        (newCookie) =>
          cookieKey === newCookie.split('=')[0] &&
          cookieDomain === newCookie.split('Domain=')[1]?.split(';')[0]
      );
      return !hasMatch;
    });
    this.setCookies([...this.#cookies, ...newCookies]);
  }

  setCookies(cookies: string[]) {
    this.#cookies = cookies;
    this.#headers.cookie = this.#cookies.join('; ');
  }

  setHeader(name: string, value: string) {
    this.#headers[name] = value;
  }

  setHeaders(headers: Record<string, string>) {
    this.#headers = { ...this.#headers, ...headers };
  }

  removeHeader(name: string) {
    delete this.#headers[name];
  }

  disconnect() {
    this.#session?.destroy();
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
