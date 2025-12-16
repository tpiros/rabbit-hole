import { tasks, runs } from '@trigger.dev/sdk/v3';
import type { rabbitHoleTask } from './trigger/rabbit-hole.js';

async function main() {
  console.log('🐇 Starting rabbit hole exploration...\n');

  const handle = await tasks.trigger<typeof rabbitHoleTask>('rabbit-hole', {
    startTopic: 'Space Travel',
    maxHops: 4,
    personality: 'chaos-goblin',
  });

  console.log(`Task triggered! Run ID: ${handle.id}`);
  console.log(`Polling for completion...`);

  const result = await runs.poll(handle, { pollIntervalMs: 2000 });

  if (result.status === 'COMPLETED' && result.output) {
    const { start, end, hops, journey, narrative } = result.output as any;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🕳️  RABBIT HOLE COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);
    console.log(`Started: ${start}`);
    console.log(`Ended: ${end}`);
    console.log(`Hops: ${hops}\n`);

    console.log(`--- THE JOURNEY ---\n`);
    for (const hop of journey) {
      console.log(`📍 ${hop.topic}`);
      console.log(`   ${hop.summary}`);
      console.log(`   💡 "${hop.surprise}"`);
      if (hop.chosenNext) {
        console.log(`   → Next: ${hop.chosenNext} (${hop.reasoning})`);
      }
      console.log();
    }

    console.log(`--- THE NARRATIVE ---\n`);
    console.log(narrative);
  } else {
    console.error('Task failed, bruuuuh:', result.status, result.error);
  }
}

main().catch(console.error);
