import { stdin, stdout } from 'node:process';
import { EventEmitter } from 'node:events';
import { createInterface } from 'node:readline/promises';
import { setTimeout } from 'node:timers/promises';

type PromptType = 'input' | 'confirm';
type PromptAnswer<T> = T extends 'input' ? string : T extends 'confirm' ? boolean : never;

export class Prompt extends EventEmitter {
  constructor() {
    super();
  }

  async waitForInput<T extends PromptType = 'input'>(
    message: string,
    type?: T,
    timeout?: number
  ): Promise<PromptAnswer<T>> {
    const answer = await this.waitForListenerResponse(message, type, timeout);
    if (type === 'confirm') {
      if (typeof answer === 'string')
        return (answer?.toLowerCase() === 'y') as PromptAnswer<boolean>;
      else return !!answer as PromptAnswer<boolean>;
    } else {
      return String(answer).trim() as PromptAnswer<string>;
    }
  }

  private async waitForListenerResponse(
    message: string,
    type: PromptType = 'input',
    timeout?: number
  ) {
    return new Promise((resolve) => {
      this.emit('prompt', message, type, timeout);
      this.addListener('prompt:response', (response) => {
        resolve(response);
      });
    });
  }

  listen(listener: (message: string, type: PromptType, timeout?: number) => Promise<string>) {
    this.addListener('prompt', (message, type, timeout) =>
      listener(message, type, timeout).then((answer) => this.emit('prompt:response', answer))
    );
  }
}

export const prompt = new Prompt();

const TIMEOUT = 120_000; // Wait 2 minutes for user input

export const enableCliPrompt = () => {
  prompt.listen(async (message, type, timeout = TIMEOUT) => {
    const readline = createInterface({ input: stdin, output: stdout });
    const question = { message, type };
    const isBooleanQuestion = question.type === 'confirm';
    const formattedMessage = question.message + (isBooleanQuestion ? ' (y/n)' : '') + ': ';
    const answer = await Promise.race([
      readline.question(formattedMessage),
      setTimeout(timeout, ''),
    ]);
    readline.close();
    return answer;
  });
};
