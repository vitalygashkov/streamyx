export type QuestionForm = {
  title?: string;
  subtitle?: string;
} & {
  [field: string]: { label: string; defaultValue?: string };
};

export type Answer = { [field: string]: string };

export type Question = {
  ask<T = Answer>(form: QuestionForm): Promise<T>;
  listen(listener: (form: QuestionForm) => Promise<Answer>): void;
};
