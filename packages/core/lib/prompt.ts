import { stdin, stdout } from 'node:process';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline/promises';
import { setTimeout } from 'node:timers/promises';

export type PromptForm = {
  title?: string;
  subtitle?: string;
} & {
  [field: string]: { label: string; defaultValue?: string };
};

export type PromptFormResponse = {
  [field: string]: string;
};

export type IPrompt = typeof prompt;

export class Prompt extends EventEmitter implements IPrompt {
  constructor() {
    super();
  }

  async ask<T = PromptFormResponse>(form: PromptForm): Promise<T> {
    const response = new Promise<PromptFormResponse>((resolve) => {
      this.emit('form', form);
      this.addListener('form:response', (response) => {
        resolve(response);
      });
    });
    return response as Promise<T>;
  }

  listen(listener: (form: PromptForm) => Promise<PromptFormResponse>) {
    this.addListener('form', (form: PromptForm) =>
      listener(form).then((answer) => this.emit('form:response', answer))
    );
  }
}

export const prompt = new Prompt();

const TIMEOUT = 120_000; // Wait 2 minutes for user input

export const enableCliPrompt = () => {
  prompt.listen(async (form) => {
    const readline = createInterface({ input: stdin, output: stdout });
    const { title, subtitle, ...fields } = form;
    const response: PromptFormResponse = {};
    for (const [field, { label, defaultValue }] of Object.entries(fields)) {
      const question = { message: label, type: 'input' };
      const isBooleanQuestion = question.type === 'confirm';
      const formattedMessage = question.message + (isBooleanQuestion ? ' (y/n)' : '') + ': ';
      const answer = await Promise.race([
        readline.question(formattedMessage),
        setTimeout(TIMEOUT, ''),
      ]);
      response[field] = answer;
    }
    readline.close();
    return response;
  });
};
