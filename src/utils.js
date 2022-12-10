'use strict';

const { createInterface } = require('node:readline/promises');
const { stdin, stdout } = require('node:process');
const { delimiter, join } = require('node:path');
const { stat } = require('node:fs/promises');

const prompt = async (message, type = 'input') => {
  const readline = createInterface({ input: stdin, output: stdout });
  const question = { message, type };
  const isBooleanQuestion = question.type === 'confirm';
  const formattedMessage = question.message + (isBooleanQuestion ? ' (y/n)' : '') + ': ';
  const answer = await readline.question(formattedMessage);
  const result = isBooleanQuestion ? answer === 'y' : answer.trim();
  readline.close();
  return result;
};

const sleep = async (seconds) => new Promise((resolve) => setTimeout(resolve, seconds * 1000));

const bold = (text) => `\x1b[1m${text}\x1b[0m`;

const parseNumberRange = (rangeStr) => {
  if (!rangeStr?.replace(/\D/g, '').trim()) return NaN;
  const numbers = [];
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

const parseArrayFromString = (value) => {
  if (!value) return [];
  return value.replaceAll(' ', '').trim().split(',');
};

const getRandomElements = (array, count = 1) => {
  const elements = [];
  for (let i = 1; i <= count; i++) elements.push(array[Math.floor(Math.random() * array.length)]);
  return elements;
};

const getRandomInRange = (min = 0, max = 100) => Math.floor(Math.random() * (max - min)) + min;

const generateMacAddress = () =>
  'XX:XX:XX:XX:XX:XX'.replace(/X/g, () =>
    '0123456789ABCDEF'.charAt(Math.floor(Math.random() * 16))
  );

const findExecutable = async (exe) => {
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
  async function checkFileExists(filePath) {
    if ((await stat(filePath)).isFile()) return filePath;
    throw new Error('Not a file');
  }
};

module.exports = {
  prompt,
  sleep,
  bold,
  parseNumberRange,
  parseArrayFromString,
  getRandomElements,
  getRandomInRange,
  generateMacAddress,
  findExecutable,
};
