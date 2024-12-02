import './types/global';
import { Extension } from './types/extension';

export * from './types/app';
export * from './types/http';
export * from './types/logger';
export * from './types/question';
export * from './types/common';
export * from './types/extension';

export function defineExtension(extension: Extension): Extension;
