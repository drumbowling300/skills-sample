export type ClauseType =
  | "HOOK"
  | "PROBLEM"
  | "AGITATE"
  | "SOLUTION"
  | "BENEFIT"
  | "CTA";

export type Clause = {
  start: number;
  end: number;

  rawText: string;
  displayText: string;

  type: ClauseType;

  highlightWords: string[];

  ctaKeyword?: string;
};