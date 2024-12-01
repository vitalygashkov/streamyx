import { Context } from 'node:vm';
import metavm from 'metavm';

type LoadOptions = {
  context?: Context;
  access?: Record<string, boolean>;
  dirname?: string;
  format?: 'cjs' | 'esm';
};

export function load(
  scriptPath: string,
  options?: LoadOptions,
): Promise<metavm.MetaScript>;
