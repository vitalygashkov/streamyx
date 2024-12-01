export type PromptFormResponse = { [field: string]: string };

export type AppPrompt = {
  ask<T = PromptFormResponse>(form: PromptForm): Promise<T>;
  listen(listener: (form: PromptForm) => Promise<PromptFormResponse>): void;
};
