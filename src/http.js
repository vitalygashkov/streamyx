'use strict';

const http2 = require('node:http2');
const { request } = require('undici');
const { logger } = require('./logger');
const { sleep } = require('./utils');

const HTTP_METHOD = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
};

const USER_AGENTS = {
  chromeWindows:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
  chromeMacOS:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.61 Safari/537.36',
  chromeLinux:
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.71 Safari/537.36',
  firefoxWindows: 'Mozilla/5.0 (Windows NT 10.0; WOW64; rv:90.0) Gecko/20100101 Firefox/90.0',
};

class Http {
  #headers;
  #cookies;
  #session;
  #lastOrigin;
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

  async request(url, options) {
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

  async #httpsRequest(url, options) {
    const requestOptions = {
      maxRedirections: 5,
      ...options,
      headers: { ...this.#headers, ...options?.headers },
    };
    const { statusCode, headers, body } = await request(url, requestOptions);
    this.appendCookies(headers['set-cookie']);

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

    return { statusCode, headers, body: data };
  }

  async #http2Request(url, options) {
    return new Promise((resolve, reject) => {
      const requestOptions = {
        ':path': url.pathname + url.search,
        ':method': options?.method || HTTP_METHOD.GET,
        ...this.#headers,
        ...options?.headers,
      };
      const sameOrigin = this.#lastOrigin === url.origin;
      if ((!sameOrigin && this.#lastOrigin) || !this.#session) {
        this.#session?.destroy();
        this.#session = http2.connect(url.href);
      }

      const stream = this.#session.request(requestOptions);
      if (options?.responseType !== 'buffer') stream.setEncoding('utf8');
      if (options?.body) stream.write(options.body);

      let statusCode = '';
      stream.on('response', (headers) => {
        statusCode = headers[':status'].toString();
        this.appendCookies(headers['set-cookie']);
      });

      let body = [];
      stream
        .on('data', (chunk) => {
          if (options?.responseType === 'buffer') body.push(Buffer.from(chunk));
          else body.push(chunk);
        })
        .on('error', (e) => {
          logger.error(`HTTP2 request stream error`);
          logger.debug(url);
          logger.debug(e);
          reject(e);
        })
        .on('end', () => {
          if (options?.responseType === 'buffer') body = Buffer.concat(body);
          else body = body.join('');
          resolve({ body, statusCode: parseInt(statusCode) });
        });

      this.#session.on('error', (e) => {
        logger.error('HTTP2 session error');
        logger.debug(url);
        logger.debug(e);
        reject(e);
      });

      stream.end();
    });
  }

  appendCookies(setCookie) {
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

  setCookies(cookies) {
    this.#cookies = cookies;
    this.#headers.cookie = this.#cookies.join('; ');
  }

  setHeader(name, value) {
    this.#headers[name] = value;
  }

  setHeaders(headers) {
    this.#headers = { ...this.#headers, ...headers };
  }

  removeHeader(name) {
    delete this.#headers[name];
  }

  disconnect() {
    this.#session?.destroy();
  }
}

const receiveData = async (body) => {
  const buffers = [];
  for await (const chunk of body) buffers.push(chunk);
  return Buffer.concat(buffers);
};

const httpRequest = async (url, options = {}) => {
  const { statusCode, headers, body } = await request(url, {
    bodyTimeout: 5000,
    headersTimeout: 5000,
    ...options,
  });
  const data = await receiveData(body);
  return { statusCode, headers, data };
};

const RETRY_THRESHOLD = 3;

const httpFetch = async (url, options) => {
  const retryCount = options.retryCount || RETRY_THRESHOLD;
  let currentRetry = 0;
  let error = null;
  let response = {};
  do {
    try {
      response = await httpRequest(url, options);
      if (response.statusCode !== 200) error = { message: `Status code: ${response.statusCode}` };
    } catch (e) {
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

module.exports = { Http, HTTP_METHOD, USER_AGENTS, fetch: httpFetch };
