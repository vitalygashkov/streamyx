import ora from 'ora-classic';

import { getLogPrefix } from './logger';

export const createSpinner = async (text?: string, color?: string, prefixText?: string) => {
  const spinner = ora({
    text: text,
    color: color as any,
    prefixText: prefixText || getLogPrefix('info'),
  });
  spinner.start();
  return spinner;
};
