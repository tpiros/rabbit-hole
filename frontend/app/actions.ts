'use server';

import { tasks } from '@trigger.dev/sdk/v3';

export async function startResearch(topic: string, personality: string) {
  const handle = await tasks.trigger('rabbit-hole', {
    startTopic: topic,
    personality,
    maxHops: 6,
  });

  return { runId: handle.id, publicAccessToken: handle.publicAccessToken };
}
