import { GoogleGenAI } from '@google/genai';
import { ExploreResultSchema, PickResultSchema, Hop } from './types.js';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ExploreResult {
  summary: string;
  surprise: string;
  offramps: string[];
  sources: string[];
}

interface PickResult {
  next: string | null;
  reasoning: string;
}

export async function exploreTopic(
  topic: string,
  personality: string,
  visited: string[],
): Promise<ExploreResult> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Research this topic: "${topic}"

Already visited (avoid suggesting these as offramps): ${visited.join(', ') || 'none'}

Return your findings as JSON with this exact structure:
{"summary": "2-3 sentences", "surprise": "one wait really fact", "offramps": ["topic1", "topic2", "topic3", "topic4", "topic5"]}`,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      systemInstruction: `You are a ${personality}. You love discovering surprising connections and obscure facts. When researching topics, dig for the weird, unexpected angles that make people say "wait, really?".

For offramps, suggest specific, intriguing tangents - not generic categories.
Bad: "Italian cuisine"
Good: "Why Europeans feared tomatoes for 200 years"

IMPORTANT: Return ONLY valid JSON, no markdown code blocks.`,
      tools: [{ googleSearch: {} }],
    },
  });

  const text = (response.text || '').replace(/```json\n?|\n?```/g, '').trim();
  const parsed = ExploreResultSchema.parse(JSON.parse(text));

  const sources: string[] = [];
  const groundingMeta = response.candidates?.[0]?.groundingMetadata;
  if (groundingMeta?.groundingChunks) {
    for (const chunk of groundingMeta.groundingChunks) {
      if (chunk.web?.uri) {
        sources.push(chunk.web.uri);
      }
    }
  }

  return {
    summary: parsed.summary,
    surprise: parsed.surprise,
    offramps: parsed.offramps,
    sources,
  };
}

export async function pickNextTopic(
  offramps: string[],
  visited: string[],
  personality: string,
  journeySoFar: Hop[],
): Promise<PickResult> {
  const visitedLower = visited.map((v) => v.toLowerCase());
  const available = offramps.filter((o) => !visitedLower.includes(o.toLowerCase()));

  if (available.length === 0) {
    return { next: null, reasoning: 'Dead end - all offramps already visited' };
  }

  const journeyContext = journeySoFar.map((h) => `${h.topic}: ${h.summary}`).join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Available topics to explore next:
${available.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Journey so far:
${journeyContext || 'Just starting'}

Pick the most intriguing topic. Return as JSON: {"next": "chosen topic", "reasoning": "why"}`,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      systemInstruction: `You are a ${personality}. Pick topics that create surprising connections or delightful contrasts with the journey so far. Return ONLY valid JSON, no markdown.`,
    },
  });

  const text = (response.text || '').replace(/```json\n?|\n?```/g, '').trim();
  const parsed = PickResultSchema.parse(JSON.parse(text));

  return {
    next: parsed.next,
    reasoning: parsed.reasoning,
  };
}

export async function* generateNarrativeStream(
  journey: Hop[],
  personality: string,
): AsyncGenerator<string> {
  const journeyDetails = journey
    .map((h, i) => `Stop ${i + 1}: ${h.topic}\n- Found: ${h.summary}\n- Surprise: ${h.surprise}`)
    .join('\n\n');

  const response = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: `Write a 150-200 word summary of this research journey:

${journeyDetails}

Style: Engaging and enthusiastic but professional. Show the fascinating connections between topics. Write in first person.`,
    config: {
      thinkingConfig: { thinkingBudget: 0 },
      temperature: 1.4,
      systemInstruction: `You are a ${personality}. Write an engaging summary that captures the wonder of discovery without being overly casual or using slang.`,
    },
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}
