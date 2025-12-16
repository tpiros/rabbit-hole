import { logger, task, metadata, streams } from '@trigger.dev/sdk/v3';
import { exploreTopic, pickNextTopic, generateNarrativeStream } from '../lib/gemini.js';
import type { Hop, RabbitHoleInput, RabbitHoleOutput } from '../lib/types.js';
import { PERSONALITIES } from '../lib/types.js';

export const rabbitHoleTask = task({
  id: 'rabbit-hole',
  maxDuration: 180,
  run: async (payload: RabbitHoleInput): Promise<RabbitHoleOutput> => {
    const { startTopic, maxHops = 2, personality: personalityKey = 'curious-generalist' } = payload;

    const personality = PERSONALITIES[personalityKey];

    const journey: Hop[] = [];
    const visited: string[] = [];
    let currentTopic = startTopic;

    logger.info(`Starting rabbit hole from: ${startTopic}`, { personality, maxHops });
    metadata.set('maxHops', maxHops);

    for (let i = 0; i < maxHops; i++) {
      metadata.set('currentHop', i + 1);
      metadata.set('currentTopic', currentTopic);
      metadata.set('status', 'exploring');

      logger.info(`Hop ${i + 1}: Exploring "${currentTopic}"`);

      const exploreResult = await exploreTopic(currentTopic, personality, visited);
      visited.push(currentTopic);

      const pickResult = await pickNextTopic(exploreResult.offramps, visited, personality, journey);

      const hop: Hop = {
        topic: currentTopic,
        summary: exploreResult.summary,
        surprise: exploreResult.surprise,
        offramps: exploreResult.offramps,
        chosenNext: pickResult.next,
        reasoning: pickResult.reasoning,
        sources: exploreResult.sources,
      };

      journey.push(hop);
      metadata.append('journey', { ...hop });
      logger.info(`Completed hop`, { hop });

      if (!pickResult.next) {
        logger.info(`Journey ended: ${pickResult.reasoning}`);
        break;
      }

      currentTopic = pickResult.next;
    }

    metadata.set('status', 'generating-narrative');
    logger.info(`Generating narrative for ${journey.length} hops`);

    const narrativeGenerator = generateNarrativeStream(journey, personality);
    const { stream, waitUntilComplete } = streams.pipe('narrative', narrativeGenerator);

    let narrative = '';
    for await (const chunk of stream) {
      if (chunk) {
        narrative += chunk;
      }
    }
    await waitUntilComplete();

    const result: RabbitHoleOutput = {
      start: startTopic,
      end: journey[journey.length - 1]?.topic || startTopic,
      hops: journey.length,
      journey,
      narrative,
    };

    logger.info(`Rabbit hole complete!`, {
      start: result.start,
      end: result.end,
      hops: result.hops,
    });

    return result;
  },
});
