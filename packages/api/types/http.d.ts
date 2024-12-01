export type AppHttp = {
  headers: Record<string, string>;
  cookies: string[];
  userAgents: Record<'chromeWindows' | 'chromeMacOS' | 'chromeLinux' | 'smartTv' | 'tizen', string>;
  fetch(resource: string | URL | Request, options?: RequestInit): Promise<Response>;
  fetchAsChrome(resource: string | URL | Request, options?: RequestInit): Promise<Response>;
  appendCookies(setCookie: string | string[]): void;
  setAgent(proxy?: string | null): void;
  setCookies(cookies: string[]): void;
  setHeader(name: string, value: string): void;
  setHeaders(headers: Record<string, string>): void;
  removeHeader(name: string): void;
  destroySessions(): Promise<void>;
};
