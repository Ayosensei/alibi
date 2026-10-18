// src/lib/store.ts — Zustand game state store
import { create } from 'zustand';
import {
  api,
  type StartOutput,
  type BoardOutput,
  type ContradictionsOutput,
  type RehearsedOutput,
  type ImpossibleMovesOutput,
  type AskOutput,
  type SearchOutput,
  type UseBaitOutput,
  type AccuseOutput,
} from './api';
import type { InspectorEventType, Topic } from '@/engine/contract';
import { z } from 'zod';

export interface ChatMessage {
  id: string;
  suspectId: string;
  speaker: 'player' | 'suspect';
  text: string;
  topic?: string;
  slot?: number | null;
  about?: string | null;
  observation?: string | null;
  firewallWarning?: boolean;
  tick?: number;
  status?: 'answered' | 'nothing_new';
}

export interface LevelProgress {
  stars: number;
  solved: boolean;
  accusationsUsed: number;
  arcClue?: string | null;
}

const DEFAULT_PROGRESS: Record<string, LevelProgress> = {
  'l1-quiet-pact': { stars: 0, solved: false, accusationsUsed: 0 },
  'l2-stopped-watch': { stars: 0, solved: false, accusationsUsed: 0 },
  'l3-blackout-dinner': { stars: 0, solved: false, accusationsUsed: 0 },
};

function loadStoredProgress(): Record<string, LevelProgress> {
  if (typeof window === 'undefined') return DEFAULT_PROGRESS;
  try {
    const raw = localStorage.getItem('alibi_progress');
    if (raw) {
      return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return DEFAULT_PROGRESS;
}

function saveStoredProgress(progress: Record<string, LevelProgress>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('alibi_progress', JSON.stringify(progress));
  } catch {
    // ignore
  }
}

function loadStoredChat(caseId: string): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`alibi_chat_${caseId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return [];
}

function saveStoredChat(caseId: string, chat: ChatMessage[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`alibi_chat_${caseId}`, JSON.stringify(chat));
  } catch {
    // ignore
  }
}

function loadStoredVerdict(caseId: string): AccuseOutput | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`alibi_verdict_${caseId}`);
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return null;
}

export interface GameState {
  playerId: string;
  caseId: string;
  caseData: StartOutput | null;
  board: BoardOutput | null;
  contradictions: ContradictionsOutput['pairs'];
  rehearsed: RehearsedOutput['groups'];
  impossible: ImpossibleMovesOutput['moves'];
  clearedSuspects: Record<string, boolean>;
  isLoading: boolean;
  error: string | null;

  // Selection & UI modals
  selectedSuspectId: string | null;
  selectedTab: 'timeline' | 'board' | 'inspector' | 'notes' | 'phone';
  isPhoneDockedUnderInterrogation: boolean;
  setPhoneDockedUnderInterrogation: (docked: boolean) => void;
  togglePhoneDocked: () => void;
  isBriefingOpen: boolean;
  isBaitModalOpen: boolean;
  isAccuseModalOpen: boolean;
  isSearchModalOpen: boolean;
  isResetModalOpen: boolean;
  setResetModalOpen: (open: boolean) => void;
  activeSearchRoomId: string | null;
  lastSearchResults: SearchOutput | null;

  // Interrogation history
  chatHistory: ChatMessage[];
  isAsking: boolean;

  // Inspector SSE stream
  inspectorEvents: InspectorEventType[];
  isInspectorStreaming: boolean;
  activeInspectorSource: 'llm' | 'deterministic' | 'recorded' | null;

  // Board highlights & focus
  highlights: {
    refs: string[];
    highlightedCardId: string | null;
    focusedCell: { person: string; slot: number } | null;
  };

  // Board layout & filters
  boardPositions: Record<string, { x: number; y: number }>;
  boardFilter: {
    statements: boolean;
    evidence: boolean;
    flags: boolean;
    inspector: boolean;
  };

  // Cross-level progress
  progress: Record<string, LevelProgress>;

  // Verdict outcome
  lastVerdict: AccuseOutput | null;
  usedBaitIds: string[];

  // Actions
  initCase: (caseId: string, reset?: boolean) => Promise<void>;
  resetCaseProgress: (caseId: string) => Promise<void>;
  resetAllProgress: () => Promise<void>;
  refreshBoard: () => Promise<void>;
  selectSuspect: (suspectId: string | null) => void;
  selectTab: (tab: 'timeline' | 'board' | 'inspector' | 'notes' | 'phone') => void;
  setBriefingOpen: (open: boolean) => void;
  setBaitModalOpen: (open: boolean) => void;
  setAccuseModalOpen: (open: boolean) => void;
  setSearchModalOpen: (open: boolean) => void;
  askQuestion: (
    topic: z.infer<typeof Topic>,
    slot?: number,
    about?: string
  ) => Promise<AskOutput | null>;
  searchRoomAction: (roomId: string) => Promise<SearchOutput | null>;
  useBaitAction: (baitId: string) => Promise<UseBaitOutput | null>;
  accuseSuspectsAction: (persons: string[]) => Promise<AccuseOutput | null>;
  prefilledAccused: string[];
  setPrefilledAccused: (persons: string[]) => void;
  runInspectorAction: (mode?: 'assist' | 'cold_case', question?: string) => void;
  setHighlightRefs: (refs: string[]) => void;
  setFocusedCard: (id: string | null) => void;
  setFocusedCell: (cell: { person: string; slot: number } | null) => void;
  clearHighlights: () => void;
  setBoardPosition: (id: string, pos: { x: number; y: number }) => void;
  toggleBoardFilter: (key: 'statements' | 'evidence' | 'flags' | 'inspector') => void;
  resetBoardFilters: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  playerId: 'demo',
  caseId: 'l1-quiet-pact',
  caseData: null,
  board: null,
  contradictions: [],
  rehearsed: [],
  impossible: [],
  clearedSuspects: {},
  isLoading: false,
  error: null,

  selectedSuspectId: null,
  selectedTab: 'timeline',
  isPhoneDockedUnderInterrogation: true,
  setPhoneDockedUnderInterrogation: (docked) => set({ isPhoneDockedUnderInterrogation: docked }),
  togglePhoneDocked: () =>
    set((s) => ({
      isPhoneDockedUnderInterrogation: !s.isPhoneDockedUnderInterrogation,
    })),
  isBriefingOpen: false,
  isBaitModalOpen: false,
  isAccuseModalOpen: false,
  isSearchModalOpen: false,
  isResetModalOpen: false,
  setResetModalOpen: (open) => set({ isResetModalOpen: open }),
  activeSearchRoomId: null,
  lastSearchResults: null,

  chatHistory: [],
  isAsking: false,

  inspectorEvents: [],
  isInspectorStreaming: false,
  activeInspectorSource: null,

  highlights: {
    refs: [],
    highlightedCardId: null,
    focusedCell: null,
  },

  boardPositions: {},
  boardFilter: {
    statements: true,
    evidence: true,
    flags: true,
    inspector: true,
  },

  progress: loadStoredProgress(),

  lastVerdict: null,
  prefilledAccused: [],
  usedBaitIds: [],

  initCase: async (caseId: string, reset = false) => {
    const currentCaseId = get().caseId;
    const currentCaseData = get().caseData;
    if (!reset && currentCaseId === caseId && currentCaseData) {
      return;
    }

    if (reset && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`alibi_verdict_${caseId}`);
        localStorage.removeItem(`alibi_chat_${caseId}`);
      } catch {
        // ignore
      }
    }

    const cachedVerdict = reset ? null : loadStoredVerdict(caseId);
    const cachedChat = reset ? [] : loadStoredChat(caseId);
    const isSolved = Boolean(
      get().progress[caseId]?.solved || cachedVerdict?.result === 'full'
    );

    set({
      isLoading: true,
      error: null,
      caseId,
      caseData: null,
      lastVerdict: cachedVerdict,
      usedBaitIds: [],
    });
    const { playerId } = get();

    const startRes = await api.startCase(playerId, caseId, reset);
    if (!startRes.ok) {
      set({ isLoading: false, error: startRes.error.message });
      return;
    }

    const caseData = startRes.data;
    // Set first suspect selected by default
    const firstSuspect = caseData.people.find((p) => !p.victim)?.id ?? null;

    set({
      caseData,
      selectedSuspectId: firstSuspect,
      isBriefingOpen: !isSolved,
      isAccuseModalOpen: false,
      isBaitModalOpen: false,
      isSearchModalOpen: false,
      prefilledAccused: [],
      chatHistory: cachedChat,
      inspectorEvents: [],
      lastSearchResults: null,
      usedBaitIds: [],
      highlights: { refs: [], highlightedCardId: null, focusedCell: null },
      boardPositions: reset ? {} : get().boardPositions,
    });

    await get().refreshBoard();
    set({ isLoading: false });
  },

  resetCaseProgress: async (caseId: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(`alibi_verdict_${caseId}`);
        localStorage.removeItem(`alibi_chat_${caseId}`);
      } catch {}
    }
    const nextProgress = {
      ...get().progress,
      [caseId]: { stars: 0, solved: false, accusationsUsed: 0 },
    };
    saveStoredProgress(nextProgress);
    set({ progress: nextProgress, lastVerdict: null, chatHistory: [] });
    await get().initCase(caseId, true);
  },

  resetAllProgress: async () => {
    const { playerId } = get();
    for (const cid of ['l1-quiet-pact', 'l2-stopped-watch', 'l3-blackout-dinner']) {
      await api.startCase(playerId, cid, true);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(`alibi_verdict_${cid}`);
          localStorage.removeItem(`alibi_chat_${cid}`);
        } catch {}
      }
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('alibi_progress');
      } catch {}
    }
    saveStoredProgress(DEFAULT_PROGRESS);
    set({ progress: DEFAULT_PROGRESS, lastVerdict: null, chatHistory: [] });
    const targetCaseId = get().caseId || 'l1-quiet-pact';
    await get().initCase(targetCaseId, true);
  },

  refreshBoard: async () => {
    const { playerId, caseId, caseData } = get();
    const [boardRes, contraRes, rehRes, impRes] = await Promise.all([
      api.getBoard(playerId, caseId),
      api.findContradictions(playerId, caseId),
      api.findRehearsedAlibis(playerId, caseId),
      api.findImpossibleMoves(playerId, caseId),
    ]);

    let clearedSuspects: Record<string, boolean> = {};
    if (caseData) {
      const activeWindow =
        boardRes.ok && boardRes.data.window && boardRes.data.window.length > 0
          ? boardRes.data.window
          : caseData.publicWindow ?? [4, 5];
      const targetSlot = activeWindow[0];
      const crimeScene = caseData.crimeScene;

      const suspects = caseData.people.filter((p) => !p.victim);
      const feasChecks = await Promise.all(
        suspects.map(async (s) => {
          const res = await api.checkFeasibility(
            playerId,
            caseId,
            s.id,
            targetSlot,
            crimeScene
          );
          return {
            id: s.id,
            cleared: res.ok ? !res.data.feasible : false,
          };
        })
      );
      clearedSuspects = Object.fromEntries(
        feasChecks.map((f) => [f.id, f.cleared])
      );
    }

    const derivedSlipBaits = boardRes.ok
      ? boardRes.data.statements
          .filter((s) => s.claimId.startsWith('slip:') || s.id.startsWith('stmt_slip_'))
          .map((s) => s.claimId.replace('slip:', '').replace('stmt_slip_', ''))
      : [];

    // Reconstruct or restore chat messages if chatHistory is currently empty
    const currentChat = get().chatHistory;
    let nextChat = currentChat;
    if (currentChat.length === 0 && boardRes.ok && boardRes.data.statements.length > 0) {
      const reconstructed: ChatMessage[] = boardRes.data.statements.map((s) => ({
        id: `msg_recon_${s.id}`,
        suspectId: s.by,
        speaker: 'suspect',
        text: s.text,
        topic: s.kind === 'location' ? 'whereabouts' : s.kind === 'saw' ? 'witness' : 'motive',
        slot: s.slot ?? null,
        about: s.subject ?? null,
        tick: s.tick,
      }));
      nextChat = reconstructed;
      saveStoredChat(caseId, reconstructed);
    }

    set((s) => ({
      board: boardRes.ok ? boardRes.data : null,
      contradictions: contraRes.ok ? contraRes.data.pairs : [],
      rehearsed: rehRes.ok ? rehRes.data.groups : [],
      impossible: impRes.ok ? impRes.data.moves : [],
      clearedSuspects,
      usedBaitIds: Array.from(new Set([...s.usedBaitIds, ...derivedSlipBaits])),
      chatHistory: nextChat,
    }));
  },

  selectSuspect: (suspectId) => set({ selectedSuspectId: suspectId }),
  selectTab: (tab) => set({ selectedTab: tab }),
  setBriefingOpen: (open) => set({ isBriefingOpen: open }),
  setBaitModalOpen: (open) => set({ isBaitModalOpen: open }),
  setAccuseModalOpen: (open) => set({ isAccuseModalOpen: open }),
  setSearchModalOpen: (open) => set({ isSearchModalOpen: open }),

  askQuestion: async (topic, slot, about) => {
    const { playerId, caseId, selectedSuspectId, board } = get();
    if (!selectedSuspectId) return null;

    set({ isAsking: true, error: null });

    // Format human player line
    const suspect = get().caseData?.people.find((p) => p.id === selectedSuspectId);
    const slotTime = slot && get().caseData?.slots[slot - 1] ? get().caseData?.slots[slot - 1] : `slot ${slot}`;

    let playerQuestion = 'Tell me what you know.';
    const targetPerson = about ? get().caseData?.people.find((p) => p.id === about) : undefined;
    const victim = get().caseData?.people.find((p) => p.victim);
    const victimName = victim?.name ?? 'the victim';

    if (topic === 'whereabouts' && slot) {
      playerQuestion = `Where were you at ${slotTime}?`;
    } else if (topic === 'witness' && slot && targetPerson) {
      playerQuestion = `Did you see ${targetPerson.name} at ${slotTime}?`;
    } else if (topic === 'witness' && slot) {
      playerQuestion = `Who did you see at ${slotTime}?`;
    } else if (topic === 'witness' && targetPerson) {
      playerQuestion = `Did you see ${targetPerson.name}?`;
    } else if (topic === 'motive') {
      playerQuestion = `What was your history with ${victimName}?`;
    } else if (topic === 'general') {
      playerQuestion = `Tell me about the night.`;
    }

    const playerMsg: ChatMessage = {
      id: `msg_p_${Date.now()}`,
      suspectId: selectedSuspectId,
      speaker: 'player',
      text: playerQuestion,
      topic,
      slot: slot ?? null,
      about: about ?? null,
      tick: (board?.tick ?? 0) + 1,
    };

    set((s) => {
      const updated = [...s.chatHistory, playerMsg];
      saveStoredChat(caseId, updated);
      return { chatHistory: updated };
    });

    const res = await api.ask(playerId, caseId, selectedSuspectId, topic, slot, about);
    set({ isAsking: false });

    if (!res.ok) {
      set({ error: res.error.message });
      return null;
    }

    const suspectMsg: ChatMessage = {
      id: `msg_s_${Date.now()}`,
      suspectId: selectedSuspectId,
      speaker: 'suspect',
      text: res.data.reply,
      topic,
      slot: slot ?? null,
      about: about ?? null,
      observation: res.data.observation,
      firewallWarning: !res.data.firewall.passed,
      status: res.data.status,
      tick: (board?.tick ?? 0) + 1,
    };

    set((s) => {
      const updated = [...s.chatHistory, suspectMsg];
      saveStoredChat(caseId, updated);
      return { chatHistory: updated };
    });
    await get().refreshBoard();
    return res.data;
  },

  searchRoomAction: async (roomId: string) => {
    const { playerId, caseId } = get();
    set({ isLoading: true, activeSearchRoomId: roomId });

    const res = await api.search(playerId, caseId, roomId);
    set({ isLoading: false });

    if (!res.ok) {
      set({ error: res.error.message });
      return null;
    }

    set({
      lastSearchResults: res.data,
      isSearchModalOpen: true,
    });

    await get().refreshBoard();
    return res.data;
  },

  useBaitAction: async (baitId: string) => {
    const { playerId, caseId } = get();
    set({ isLoading: true });

    const res = await api.useBait(playerId, caseId, baitId);
    set({ isLoading: false });

    if (!res.ok) {
      set({ error: res.error.message });
      return null;
    }

    // Add suspect reactions to chat history if relevant
    if (res.data.reactions && res.data.reactions.length > 0) {
      const reactions: ChatMessage[] = res.data.reactions.map((react) => ({
        id: `msg_bait_${react.person}_${Date.now()}`,
        suspectId: react.person,
        speaker: 'suspect',
        text: react.text,
        observation: react.observation,
      }));
      set((s) => {
        const updated = [...s.chatHistory, ...reactions];
        saveStoredChat(caseId, updated);
        return { chatHistory: updated };
      });
    }

    set((s) => ({
      usedBaitIds: Array.from(new Set([...s.usedBaitIds, baitId])),
      board: s.board ? { ...s.board, baitsLeft: res.data.baitsLeft } : s.board,
    }));

    await get().refreshBoard();
    return res.data;
  },

  accuseSuspectsAction: async (persons: string[]) => {
    const { playerId, caseId } = get();
    set({ isLoading: true });

    const res = await api.accuse(playerId, caseId, persons);
    set({ isLoading: false });

    if (!res.ok) {
      set({ error: res.error.message });
      return null;
    }

    const data = res.data;
    set({ lastVerdict: data });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`alibi_verdict_${caseId}`, JSON.stringify(data));
      } catch {
        // ignore localStorage errors
      }
    }

    // Update level progress if level is over or solved
    if (data.result === 'full' || data.levelOver) {
      const nextProgress = {
        ...get().progress,
        [caseId]: {
          stars: Math.max(get().progress[caseId]?.stars ?? 0, data.stars),
          solved: data.result === 'full',
          accusationsUsed: (get().progress[caseId]?.accusationsUsed ?? 0) + 1,
          arcClue: get().caseData?.arcClue,
        },
      };
      saveStoredProgress(nextProgress);
      set({ progress: nextProgress });
    }

    return data;
  },

  setPrefilledAccused: (persons) => set({ prefilledAccused: persons }),

  runInspectorAction: (mode = 'assist', question?: string) => {
    const { playerId, caseId } = get();
    set({
      isInspectorStreaming: true,
      inspectorEvents: [],
      activeInspectorSource: null,
    });

    api.streamInspector(
      { playerId, caseId, mode, question },
      (event) => {
        set((s) => ({ inspectorEvents: [...s.inspectorEvents, event] }));
        if (event.type === 'tool_result' && event.highlight?.length) {
          set((s) => ({
            highlights: {
              ...s.highlights,
              refs: Array.from(new Set([...s.highlights.refs, ...event.highlight])),
            },
          }));
        }
        if (event.type === 'done') {
          set({ activeInspectorSource: event.source });
        }
      },
      (err) => {
        set({ isInspectorStreaming: false, error: err.message });
      },
      () => {
        set({ isInspectorStreaming: false });
        get().refreshBoard();
      }
    );
  },

  setHighlightRefs: (refs) =>
    set((s) => ({ highlights: { ...s.highlights, refs } })),
  setFocusedCard: (id) =>
    set((s) => ({ highlights: { ...s.highlights, highlightedCardId: id } })),
  setFocusedCell: (cell) =>
    set((s) => ({ highlights: { ...s.highlights, focusedCell: cell } })),
  clearHighlights: () =>
    set({ highlights: { refs: [], highlightedCardId: null, focusedCell: null } }),

  setBoardPosition: (id, pos) =>
    set((s) => ({
      boardPositions: { ...s.boardPositions, [id]: pos },
    })),
  toggleBoardFilter: (key) =>
    set((s) => ({
      boardFilter: { ...s.boardFilter, [key]: !s.boardFilter[key] },
    })),
  resetBoardFilters: () =>
    set({
      boardFilter: { statements: true, evidence: true, flags: true, inspector: true },
    }),
}));
