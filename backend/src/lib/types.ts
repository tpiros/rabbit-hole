import { z } from "zod";

export const PERSONALITIES = {
  "curious-generalist": "curious generalist who finds everything interesting",
  "history-nerd": "history nerd who always wants to know the origin story",
  "science-geek": "science geek fascinated by how things work",
  "chaos-goblin": "chaos goblin drawn to the weird, dark, and unexpected",
  "foodie": "food obsessive who relates everything back to eating",
  "conspiracy-adjacent": "person who loves connecting dots (but stays grounded in facts)",
} as const;

export type PersonalityKey = keyof typeof PERSONALITIES;

export const ExploreResultSchema = z.object({
  summary: z.string().describe("2-3 sentences on most interesting findings"),
  surprise: z.string().describe("One 'wait, really?' fact"),
  offramps: z
    .array(z.string())
    .describe("5 specific, intriguing tangential topics"),
});

export const PickResultSchema = z.object({
  next: z.string().nullable().describe("The chosen next topic, or null if dead end"),
  reasoning: z.string().describe("Why this topic was chosen"),
});

export interface Hop {
  topic: string;
  summary: string;
  surprise: string;
  offramps: string[];
  chosenNext: string | null;
  reasoning: string;
  sources: string[];
}

export interface RabbitHoleInput {
  startTopic: string;
  maxHops?: number;
  personality?: PersonalityKey;
}

export interface RabbitHoleOutput {
  start: string;
  end: string;
  hops: number;
  journey: Hop[];
  narrative: string;
}
