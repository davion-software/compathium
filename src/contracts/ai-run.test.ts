import { describe, expect, it } from 'vite-plus/test';
import { AiRun } from './index.ts';
import { aiRun, uuid } from './fixtures.ts';

describe('AiRun', () => {
  it('parses a run with strong evidence', () => {
    expect(AiRun.safeParse(aiRun()).success).toBe(true);
  });

  it('parses a handoff without evidence or measurements', () => {
    const run = {
      ...aiRun(),
      agent_version_id: uuid(),
      sources: [],
      evidence_coverage: 'none',
      handoff_reason: 'no_evidence',
      latency_ms: null,
      cost: null,
      cost_currency: null,
    };
    expect(AiRun.safeParse(run).success).toBe(true);
  });

  it('rejects a numeric confidence: handoff never depends on a self-reported number', () => {
    const result = AiRun.safeParse({ ...aiRun(), confidence: 0.92 });
    expect(result.success).toBe(false);
  });

  it('exposes no confidence key in its shape', () => {
    expect(Object.keys(AiRun.shape)).not.toContain('confidence');
  });

  it.each([
    ['evidence_coverage', 'high'],
    ['evidence_coverage', 0.8],
    ['handoff_reason', 'low_confidence'],
  ])('rejects %s = %j', (key, value) => {
    expect(AiRun.safeParse({ ...aiRun(), [key]: value }).success).toBe(false);
  });

  it.each(['none', 'partial', 'strong'])('accepts evidence_coverage %s', (coverage) => {
    expect(AiRun.safeParse({ ...aiRun(), evidence_coverage: coverage }).success).toBe(true);
  });

  it.each(['no_evidence', 'intent', 'policy', 'schedule', 'manual'])(
    'accepts handoff_reason %s',
    (reason) => {
      expect(AiRun.safeParse({ ...aiRun(), handoff_reason: reason }).success).toBe(true);
    },
  );

  it('rejects a negative or fractional latency_ms', () => {
    expect(AiRun.safeParse({ ...aiRun(), latency_ms: -1 }).success).toBe(false);
    expect(AiRun.safeParse({ ...aiRun(), latency_ms: 1.5 }).success).toBe(false);
  });

  it('rejects a source with a missing field or an extra retrieval_score', () => {
    const [source] = aiRun().sources;
    const { title_snapshot: _omitted, ...incomplete } = source!;
    expect(AiRun.safeParse({ ...aiRun(), sources: [incomplete] }).success).toBe(false);
    expect(
      AiRun.safeParse({ ...aiRun(), sources: [{ ...source, retrieval_score: 0.9 }] }).success,
    ).toBe(false);
  });

  it('keeps cost as an exact decimal string and rejects floats and negatives', () => {
    expect(AiRun.safeParse({ ...aiRun(), cost: 0.00012 }).success).toBe(false);
    expect(AiRun.safeParse({ ...aiRun(), cost: '-1' }).success).toBe(false);
    expect(AiRun.safeParse({ ...aiRun(), cost: '1.123456789' }).success).toBe(false);
  });

  it('requires cost and cost_currency together', () => {
    expect(AiRun.safeParse({ ...aiRun(), cost_currency: null }).success).toBe(false);
    expect(AiRun.safeParse({ ...aiRun(), cost: null }).success).toBe(false);
  });

  it('requires organization_id', () => {
    const { organization_id: _omitted, ...rest } = aiRun();
    expect(AiRun.safeParse(rest).success).toBe(false);
  });
});
