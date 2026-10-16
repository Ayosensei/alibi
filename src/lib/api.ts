// src/lib/api.ts — Typed API client for Alibi UI
import type {
  ACTIONS,
  TOOLS,
  Envelope,
  InspectorEventType,
  Topic,
} from '@/engine/contract';
import { z } from 'zod';

export type StartOutput = z.infer<typeof ACTIONS.start.output>;
export type AskOutput = z.infer<typeof ACTIONS.ask.output>;
export type SearchOutput = z.infer<typeof ACTIONS.search.output>;
export type UseBaitOutput = z.infer<typeof ACTIONS.useBait.output>;
export type AccuseOutput = z.infer<typeof ACTIONS.accuse.output>;
export type BoardOutput = z.infer<typeof TOOLS.getBoard.output>;
export type ContradictionsOutput = z.infer<typeof TOOLS.findContradictions.output>;
export type RehearsedOutput = z.infer<typeof TOOLS.findRehearsedAlibis.output>;
export type ImpossibleMovesOutput = z.infer<typeof TOOLS.findImpossibleMoves.output>;
export type FeasibilityOutput = z.infer<typeof TOOLS.checkFeasibility.output>;
export type WhoCouldHaveOutput = z.infer<typeof TOOLS.whoCouldHave.output>;
export type MotivePathsOutput = z.infer<typeof TOOLS.motivePaths.output>;
export type AlibiSupportOutput = z.infer<typeof TOOLS.alibiSupport.output>;

async function postJson<T>(url: string, body: unknown): Promise<Envelope<T>> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return (await res.json()) as Envelope<T>;
  } catch (err) {
    return {
      ok: false,
      error: {
        code: 'INTERNAL',
        message: err instanceof Error ? err.message : 'Network error occurred.',
      },
      trace: [],
    };
  }
}

export const api = {
  async startCase(playerId: string, caseId: string, reset = false): Promise<Envelope<StartOutput>> {
    return postJson<StartOutput>('/api/start', { playerId, caseId, reset });
  },

  async ask(
    playerId: string,
    caseId: string,
    suspectId: string,
    topic: z.infer<typeof Topic>,
    slot?: number,
    about?: string
  ): Promise<Envelope<AskOutput>> {
    return postJson<AskOutput>('/api/ask', {
      playerId,
      caseId,
      suspectId,
      topic,
      slot,
      about,
    });
  },

  async search(playerId: string, caseId: string, roomId: string): Promise<Envelope<SearchOutput>> {
    return postJson<SearchOutput>('/api/search', { playerId, caseId, roomId });
  },

  async useBait(playerId: string, caseId: string, baitId: string): Promise<Envelope<UseBaitOutput>> {
    return postJson<UseBaitOutput>('/api/bait', { playerId, caseId, baitId });
  },

  async accuse(
    playerId: string,
    caseId: string,
    persons: string[]
  ): Promise<Envelope<AccuseOutput>> {
    return postJson<AccuseOutput>('/api/accuse', { playerId, caseId, persons });
  },

  async runTool<T>(name: string, args: Record<string, unknown>): Promise<Envelope<T>> {
    return postJson<T>(`/api/tool/${name}`, args);
  },

  async getBoard(playerId: string, caseId: string): Promise<Envelope<BoardOutput>> {
    return postJson<BoardOutput>('/api/tool/getBoard', { playerId, caseId });
  },

  async findContradictions(playerId: string, caseId: string): Promise<Envelope<ContradictionsOutput>> {
    return postJson<ContradictionsOutput>('/api/tool/findContradictions', { playerId, caseId });
  },

  async findRehearsedAlibis(playerId: string, caseId: string): Promise<Envelope<RehearsedOutput>> {
    return postJson<RehearsedOutput>('/api/tool/findRehearsedAlibis', { playerId, caseId });
  },

  async findImpossibleMoves(playerId: string, caseId: string): Promise<Envelope<ImpossibleMovesOutput>> {
    return postJson<ImpossibleMovesOutput>('/api/tool/findImpossibleMoves', { playerId, caseId });
  },

  async checkFeasibility(
    playerId: string,
    caseId: string,
    person: string,
    slot: number,
    room: string
  ): Promise<Envelope<FeasibilityOutput>> {
    return postJson<FeasibilityOutput>('/api/tool/checkFeasibility', {
      playerId,
      caseId,
      person,
      slot,
      room,
    });
  },

  async whoCouldHave(
    playerId: string,
    caseId: string,
    evidenceId: string
  ): Promise<Envelope<WhoCouldHaveOutput>> {
    return postJson<WhoCouldHaveOutput>('/api/tool/whoCouldHave', {
      playerId,
      caseId,
      evidenceId,
    });
  },

  async flag(
    playerId: string,
    caseId: string,
    kind: string,
    refs: string[],
    note: string,
    by: 'player' | 'inspector' = 'player'
  ): Promise<Envelope<{ flagId: string }>> {
    return postJson<{ flagId: string }>('/api/tool/flag', {
      playerId,
      caseId,
      kind,
      refs,
      note,
      by,
    });
  },

  async hypothesize(
    playerId: string,
    caseId: string,
    text: string,
    confidence: number,
    supportedBy: string[],
    person?: string,
    by: 'player' | 'inspector' = 'player'
  ): Promise<Envelope<{ hypothesisId: string }>> {
    return postJson<{ hypothesisId: string }>('/api/tool/hypothesize', {
      playerId,
      caseId,
      text,
      confidence,
      supportedBy,
      person,
      by,
    });
  },

  streamInspector(
    params: {
      playerId: string;
      caseId: string;
      mode?: 'assist' | 'cold_case';
      question?: string;
    },
    onEvent: (event: InspectorEventType) => void,
    onError?: (err: Error) => void,
    onDone?: () => void
  ): () => void {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/inspector', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          throw new Error(`Inspector failed with status ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() ?? '';

          for (const block of lines) {
            const dataLine = block
              .split('\n')
              .find((l) => l.startsWith('data: '));
            if (dataLine) {
              const rawJson = dataLine.slice(6).trim();
              if (rawJson) {
                try {
                  const ev = JSON.parse(rawJson) as InspectorEventType;
                  onEvent(ev);
                } catch {
                  // ignore non-json frames
                }
              }
            }
          }
        }
        onDone?.();
      } catch (err: unknown) {
        if (!controller.signal.aborted) {
          onError?.(err instanceof Error ? err : new Error(String(err)));
        }
      }
    })();

    return () => controller.abort();
  },
};
