'use strict';

const { createInterface } = require('readline');

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

const question = async (message, type = 'input') => {
  const readline = createInterface({ input: process.stdin, output: process.stdout });
  const question = { message, type };
  const isBooleanQuestion = question.type === 'confirm';
  const formattedMessage = question.message + (isBooleanQuestion ? ' (y/n)' : '') + ': ';
  const answer = await new Promise((resolve) => readline.question(formattedMessage, resolve));
  const result = isBooleanQuestion ? answer === 'y' : answer.trim();
  readline.close();
  return result;
};

module.exports = { parseNumberRange, parseArrayFromString, question };
