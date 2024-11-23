import { EOL } from 'node:os';
import { fs } from './fs';

export type Cookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires: number;
  size: number;
  httpOnly: boolean;
  secure: boolean;
  session: boolean;
  sameSite?: string;
  sameParty?: boolean;
  partitionKey?: string;
  partitionKeyOpaque?: boolean;
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

export const importCookies = async (cookiesTxtPath: string): Promise<string[]> => {
  const text = await fs.readText(cookiesTxtPath).catch(() => '');
  if (!text) return [];
  const lines = text.split(EOL).flatMap((line) => line.split('\n'));
  const linesWithoutComments = lines.filter((line: string) => !!line.trim() && !line.startsWith('# '));
  const rows = linesWithoutComments.map((line: string) => line.split('\t'));
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
