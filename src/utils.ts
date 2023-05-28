import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { delimiter, join } from 'node:path';
import { stat } from 'node:fs/promises';

const prompt = async <T = string>(message: string, type = 'input') => {
  const readline = createInterface({ input: stdin, output: stdout });
  const question = { message, type };
  const isBooleanQuestion = question.type === 'confirm';
  const formattedMessage = question.message + (isBooleanQuestion ? ' (y/n)' : '') + ': ';
  const answer = await readline.question(formattedMessage);
  const result = isBooleanQuestion ? answer === 'y' : answer.trim();
  readline.close();
  return result as T;
};

const sleep = async (seconds: number) =>
  new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const bold = (text: string) => `\x1b[1m${text}\x1b[0m`;

const parseNumberRange = (rangeStr: string) => {
  if (!rangeStr?.replace(/\D/g, '').trim()) return NaN;
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
  return value.replaceAll(' ', '').trim().split(',');
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

export {
  prompt,
  sleep,
  bold,
  parseNumberRange,
  parseArrayFromString,
  parseHeadersFromString,
  getRandomElements,
  getRandomInRange,
  generateMacAddress,
  findExecutable,
};
