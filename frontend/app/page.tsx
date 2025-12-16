'use client';

import { useState, useEffect, useRef } from 'react';
import { useRealtimeRunWithStreams } from '@trigger.dev/react-hooks';
import { startResearch } from './actions';
import {
  PERSONALITIES,
  type PersonalityKey,
  type Hop,
  type RabbitHoleOutput,
  type RabbitHoleMetadata,
} from '../lib/types';

export default function Home() {
  const [topic, setTopic] = useState('');
  const [personality, setPersonality] = useState<PersonalityKey>('curious-generalist');
  const [runId, setRunId] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { run, streams, error } = useRealtimeRunWithStreams<any, { narrative: string }>(runId, {
    accessToken,
    enabled: !!runId && !!accessToken,
  });

  const output = run?.output as RabbitHoleOutput | undefined;
  const meta = run?.metadata as RabbitHoleMetadata | undefined;
  const isCompleted = run?.status === 'COMPLETED';
  const isFailed = run?.status === 'FAILED' || run?.status === 'CRASHED';
  const isRunning = !!runId && !isCompleted && !isFailed;

  const journey = meta?.journey || output?.journey || [];
  const narrativeText = streams.narrative?.join('') || output?.narrative || '';

  const journeyEndRef = useRef<HTMLDivElement>(null);
  const narrativeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (journey.length > 0) {
      journeyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [journey.length]);

  useEffect(() => {
    if (narrativeText && meta?.status === 'generating-narrative') {
      narrativeRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [narrativeText, meta?.status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!topic.trim()) return;

    setRunId(undefined);
    setAccessToken(undefined);
    setIsSubmitting(true);
    try {
      const result = await startResearch(topic.trim(), personality);
      setRunId(result.runId);
      setAccessToken(result.publicAccessToken);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="container">
      <h1>Rabbit Hole Agent</h1>
      <p className="subtitle">Fall down a curiosity-driven research rabbit hole</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="topic">Research Topic</label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Why do dogs bark?"
            disabled={isSubmitting || isRunning}
          />
        </div>

        <div className="form-group">
          <label htmlFor="personality">Personality</label>
          <select
            id="personality"
            value={personality}
            onChange={(e) => setPersonality(e.target.value as PersonalityKey)}
            disabled={isSubmitting || isRunning}
          >
            {Object.entries(PERSONALITIES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" disabled={isSubmitting || isRunning || !topic.trim()}>
          {isSubmitting ? 'Starting...' : isRunning ? 'Exploring...' : 'Start Exploration'}
        </button>
      </form>

      {error && (
        <div className="status">
          <span className="status-dot failed" />
          {error.message}
        </div>
      )}

      {run && (
        <div className="journey-container">
          <div className="status">
            <span
              className={`status-dot ${isCompleted ? 'completed' : isFailed ? 'failed' : 'running'}`}
            />
            <span>
              {run.status === 'QUEUED' && 'Waiting in queue...'}
              {run.status === 'EXECUTING' &&
                meta?.status === 'exploring' &&
                `Hop ${meta.currentHop}/${meta.maxHops}: Exploring "${meta.currentTopic}"...`}
              {run.status === 'EXECUTING' &&
                meta?.status === 'generating-narrative' &&
                'Writing narrative...'}
              {run.status === 'EXECUTING' && !meta?.status && 'Starting...'}
              {isCompleted && 'Complete!'}
              {isFailed && 'Failed'}
            </span>
          </div>

          {journey.map((hop: Hop, i: number) => (
            <div key={i} className="hop">
              <div className="hop-header">
                <span className="hop-number">{i + 1}</span>
                <span className="hop-topic">{hop.topic}</span>
              </div>
              <p className="hop-summary">{hop.summary}</p>
              <div className="hop-surprise">
                <div className="hop-surprise-label">Wait, really?</div>
                {hop.surprise}
              </div>
              {hop.chosenNext && (
                <p className="hop-next">
                  Next: <strong>{hop.chosenNext}</strong> — {hop.reasoning}
                </p>
              )}
            </div>
          ))}
          <div ref={journeyEndRef} />

          {narrativeText && (
            <div ref={narrativeRef} className="narrative">
              <div className="narrative-label">The Journey</div>
              <p>{narrativeText}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
