import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { delimiter, join } from 'node:path';
import { stat } from 'node:fs/promises';
import EventEmitter from 'node:events';

type PromptType = 'input' | 'confirm';
type PromptAnswer<T> = T extends 'input' ? string : T extends 'confirm' ? boolean : never;

class Prompt extends EventEmitter {
  constructor() {
    super();
  }

  async waitForInput<T extends PromptType = 'input'>(
    message: string,
    type?: T
  ): Promise<PromptAnswer<T>> {
    const hasPromptListener = !!this.listeners('prompt').length;
    const answer = hasPromptListener
      ? await this.waitForListenerResponse(message, type)
      : await this.waitForCliResponse(message, type);
    if (type === 'confirm') {
      if (typeof answer === 'string')
        return (answer?.toLowerCase() === 'y') as PromptAnswer<boolean>;
      else return !!answer as PromptAnswer<boolean>;
    } else {
      return String(answer).trim() as PromptAnswer<string>;
    }
  }

  private async waitForCliResponse(message: string, type: PromptType = 'input') {
    const readline = createInterface({ input: stdin, output: stdout });
    const question = { message, type };
    const isBooleanQuestion = question.type === 'confirm';
    const formattedMessage = question.message + (isBooleanQuestion ? ' (y/n)' : '') + ': ';
    const answer = await readline.question(formattedMessage);
    readline.close();
    return answer;
  }

  private async waitForListenerResponse(message: string, type: PromptType = 'input') {
    return new Promise((resolve) => {
      this.emit('prompt', message, type);
      this.addListener('prompt:response', (response) => {
        resolve(response);
      });
    });
  }
}

export const prompt = new Prompt();

const sleep = async (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

const parseNumberRange = (rangeStr: string) => {
  if (!rangeStr?.replace(/\D/g, '').trim()) return [];
  const numbers: number[] = [];
  rangeStr
    .replaceAll(' ', '')
    .trim()
    .split(',')
    .forEach((rawNumber) => {
      if (rawNumber.includes('-')) {
        const start = parseInt(rawNumber.split('-')[0].trim());
        const end = parseInt(rawNumber.split('-')[1].trim());
        for (let i = start; i <= end; i++) numbers.push(i);
      } else numbers.push(parseInt(rawNumber.trim()));
    });
  return numbers;
};

const parseArrayFromString = (value: string) => {
  if (!value) return [];
  return value.trim().split(',');
};

const parseHeadersFromString = (str: string) => {
  if (!str) return {};
  const headers: Record<string, string> = {};
  for (const header of str.split('|')) {
    const [key, value] = header.split(':');
    headers[key.trim()] = value.trim();
  }
  return headers;
};

const getRandomElements = (array: unknown, count = 1) => {
  if (Array.isArray(array) || typeof array === 'string') {
    const elements = [];
    for (let i = 1; i <= count; i++) elements.push(array[Math.floor(Math.random() * array.length)]);
    return elements;
  } else {
    return [];
  }
};

const getRandomInRange = (min = 0, max = 100) => Math.floor(Math.random() * (max - min)) + min;

const generateMacAddress = () =>
  'XX:XX:XX:XX:XX:XX'.replace(/X/g, () =>
    '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
  );

const findExecutable = async (exe: string) => {
  const envPath = process.env.PATH || '';
  const envExt = process.env.PATHEXT || '';
  const pathDirs = envPath.replace(/["]+/g, '').split(delimiter).filter(Boolean);
  const extensions = envExt.split(';');
  const candidates = pathDirs.flatMap((d) => extensions.map((ext) => join(d, exe + ext)));
  try {
    return await Promise.any(candidates.map(checkFileExists));
  } catch (e) {
    return null;
  }
  async function checkFileExists(filePath: string) {
    if ((await stat(filePath)).isFile()) return filePath;
    throw new Error('Not a file');
  }
};

const validateUrl = async (url: string) => {
  let isValid = false;
  let currentUrl = url;
  do {
    try {
      if (currentUrl) {
        const urlObject = new URL(currentUrl);
        isValid = !!urlObject;
      } else {
        currentUrl = await prompt.waitForInput('URL');
      }
    } catch (e) {
      currentUrl = await prompt.waitForInput('URL');
    }
  } while (!isValid);
  return currentUrl;
};

const parseMainDomain = (url: string) => new URL(url).host.split('.').at(-2) || null;

export {
  sleep,
  bold,
  parseNumberRange,
  parseArrayFromString,
  parseHeadersFromString,
  getRandomElements,
  getRandomInRange,
  generateMacAddress,
  findExecutable,
  validateUrl,
  parseMainDomain,
};
