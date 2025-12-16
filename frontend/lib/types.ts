export const PERSONALITIES = {
  "curious-generalist": "Curious Generalist",
  "history-nerd": "History Nerd",
  "science-geek": "Science Geek",
  "chaos-goblin": "Chaos Goblin",
  "foodie": "Foodie",
  "conspiracy-adjacent": "Conspiracy Adjacent",
} as const;

export type PersonalityKey = keyof typeof PERSONALITIES;

export interface Hop {
  topic: string;
  summary: string;
  surprise: string;
  offramps: string[];
  chosenNext: string | null;
  reasoning: string;
  sources: string[];
}

export interface RabbitHoleOutput {
  start: string;
  end: string;
  hops: number;
  journey: Hop[];
  narrative: string;
}

export interface RabbitHoleMetadata {
  status: "exploring" | "generating-narrative";
  currentHop: number;
  maxHops: number;
  currentTopic: string;
  journey: Hop[];
}
