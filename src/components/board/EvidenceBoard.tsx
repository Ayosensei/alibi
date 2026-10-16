'use client';

import * as React from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnNodeDrag,
} from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { EmptyState, Chip } from '@/components/atoms';
import { useGameStore } from '@/lib/store';
import {
  PersonNode,
  StatementNode,
  EvidenceNode,
  FlagNode,
  HypothesisNode,
} from './CustomNodes';
import {
  ThreadEdge,
  ImpossibleEdge,
  RehearsedEdge,
  InspectorEdge,
  SupportEdge,
} from './CustomEdges';
import {
  LayoutGrid,
  Filter,
  Maximize2,
  RotateCcw,
  Sparkles,
  Feather,
  Pin,
  Flag,
} from 'lucide-react';

const nodeTypes = {
  person: PersonNode,
  statement: StatementNode,
  evidence: EvidenceNode,
  flag: FlagNode,
  hypothesis: HypothesisNode,
};

const edgeTypes = {
  thread: ThreadEdge,
  impossible: ImpossibleEdge,
  rehearsed: RehearsedEdge,
  inspector: InspectorEdge,
  support: SupportEdge,
};

export function EvidenceBoard() {
  const {
    caseData,
    board,
    contradictions,
    rehearsed,
    impossible,
    highlights,
    boardPositions,
    boardFilter,
    setBoardPosition,
    toggleBoardFilter,
    setFocusedCard,
    clearHighlights,
  } = useGameStore();

  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  // Build nodes and edges from game store state
  const { initialNodes, initialEdges } = React.useMemo(() => {
    if (!caseData || !board) return { initialNodes: [], initialEdges: [] };

    const nodes: Node[] = [];
    const edges: Edge[] = [];
    const claimToNodeId = new Map<string, string>();

    const people = caseData.people;
    const statements = board.statements ?? [];
    const evidence = board.evidence ?? [];
    const flags = board.flags ?? [];
    const hypotheses = board.hypotheses ?? [];

    const isNodeHighlighted = (id: string, claimId?: string) => {
      if (selectedNodeId === id) return true;
      if (highlights.highlightedCardId === id) return true;
      if (highlights.refs.includes(id)) return true;
      if (claimId && highlights.refs.includes(claimId)) return true;
      return false;
    };

    // 1. People nodes & Statement nodes layout in columns
    people.forEach((person, colIdx) => {
      const colX = colIdx * 300 + 40;
      const personNodeId = `person_${person.id}`;

      // Person node
      nodes.push({
        id: personNodeId,
        type: 'person',
        position: boardPositions[personNodeId] ?? { x: colX, y: 40 },
        data: {
          id: person.id,
          name: person.name,
          role: person.role,
          victim: person.victim,
          selected: selectedNodeId === personNodeId,
          isHighlighted: isNodeHighlighted(personNodeId),
        },
      });

      // Filtered statements for this person
      if (boardFilter.statements) {
        const personStatements = statements.filter((s) =>
          s.subject ? s.subject === person.id : s.by === person.id
        );

        personStatements.forEach((stmt, rowIdx) => {
          const stmtNodeId = `stmt_${stmt.id}`;
          claimToNodeId.set(stmt.claimId, stmtNodeId);

          // Check if this statement is part of a contradiction
          const hasConflict = contradictions.some(
            (c) => c.a.src === stmt.claimId || c.b.src === stmt.claimId
          );

          nodes.push({
            id: stmtNodeId,
            type: 'statement',
            position: boardPositions[stmtNodeId] ?? {
              x: colX,
              y: 160 + rowIdx * 150,
            },
            data: {
              id: stmt.id,
              claimId: stmt.claimId,
              by: stmt.by,
              text: stmt.text,
              room: stmt.room,
              slot: stmt.slot,
              tick: stmt.tick,
              isContradicted: hasConflict,
              isHighlighted: isNodeHighlighted(stmtNodeId, stmt.claimId),
            },
          });

          // Connect statement to speaker/subject
          edges.push({
            id: `edge_p_${stmtNodeId}`,
            source: personNodeId,
            target: stmtNodeId,
            type: 'support',
          });
        });
      }
    });

    // 2. Evidence Column
    if (boardFilter.evidence) {
      const evColX = people.length * 300 + 40;
      evidence.forEach((ev, idx) => {
        const evNodeId = `ev_${ev.id}`;
        claimToNodeId.set(ev.id, evNodeId);

        nodes.push({
          id: evNodeId,
          type: 'evidence',
          position: boardPositions[evNodeId] ?? {
            x: evColX,
            y: 40 + idx * 190,
          },
          data: {
            id: ev.id,
            title: ev.title,
            text: ev.text,
            room: ev.room,
            isHighlighted: isNodeHighlighted(evNodeId, ev.id),
          },
        });
      });
    }

    // 3. Flags Column
    if (boardFilter.flags) {
      const flagColX = (people.length + 1) * 300 + 40;
      flags.forEach((f, idx) => {
        const flagNodeId = `flag_${f.id}`;
        nodes.push({
          id: flagNodeId,
          type: 'flag',
          position: boardPositions[flagNodeId] ?? {
            x: flagColX,
            y: 40 + idx * 150,
          },
          data: {
            id: f.id,
            kind: f.kind,
            note: f.note,
            by: f.by,
            isHighlighted: isNodeHighlighted(flagNodeId),
          },
        });

        // Connect flag to its referenced cards
        f.refs.forEach((ref) => {
          const targetNodeId = claimToNodeId.get(ref) ?? (ref.startsWith('ev_') || ref.startsWith('stmt_') ? ref : null);
          if (targetNodeId) {
            edges.push({
              id: `edge_flag_${f.id}_${targetNodeId}`,
              source: flagNodeId,
              target: targetNodeId,
              type: f.by === 'inspector' ? 'inspector' : 'support',
            });
          }
        });
      });
    }

    // 4. Hypotheses Column
    if (boardFilter.inspector) {
      const hypColX = (people.length + 2) * 300 + 40;
      hypotheses.forEach((h, idx) => {
        const hypNodeId = `hyp_${h.id}`;
        nodes.push({
          id: hypNodeId,
          type: 'hypothesis',
          position: boardPositions[hypNodeId] ?? {
            x: hypColX,
            y: 40 + idx * 160,
          },
          data: {
            id: h.id,
            text: h.text,
            person: h.person,
            confidence: h.confidence,
            by: h.by,
            isHighlighted: isNodeHighlighted(hypNodeId),
          },
        });

        if (h.person) {
          edges.push({
            id: `edge_hyp_${h.id}_person`,
            source: hypNodeId,
            target: `person_${h.person}`,
            type: 'inspector',
          });
        }
      });
    }

    // 5. Reasoning Threads & Edges

    // 5a. Red Contradiction Threads
    contradictions.forEach((c, idx) => {
      const nodeA = claimToNodeId.get(c.a.src) ?? (c.a.src.startsWith('e') ? `ev_${c.a.src}` : `stmt_${c.a.src}`);
      const nodeB = claimToNodeId.get(c.b.src) ?? (c.b.src.startsWith('e') ? `ev_${c.b.src}` : `stmt_${c.b.src}`);

      if (nodeA && nodeB) {
        edges.push({
          id: `contra_${idx}_${nodeA}_${nodeB}`,
          source: nodeA,
          target: nodeB,
          type: 'thread',
        });
      }
    });

    // 5b. Impossible Travel Orange Dashed Edges
    impossible.forEach((mv, idx) => {
      const nodeFrom = claimToNodeId.get(mv.from.src) ?? `stmt_${mv.from.src}`;
      const nodeTo = claimToNodeId.get(mv.to.src) ?? `stmt_${mv.to.src}`;

      if (nodeFrom && nodeTo) {
        edges.push({
          id: `impossible_${idx}_${nodeFrom}_${nodeTo}`,
          source: nodeFrom,
          target: nodeTo,
          type: 'impossible',
        });
      }
    });

    // 5c. Rehearsed Alibi Brass Edges
    rehearsed.forEach((grp, idx) => {
      const claimNodes = grp.claimIds
        .map((cid) => claimToNodeId.get(cid))
        .filter((nid): nid is string => Boolean(nid));

      for (let i = 0; i < claimNodes.length - 1; i++) {
        edges.push({
          id: `rehearsed_${idx}_${claimNodes[i]}_${claimNodes[i + 1]}`,
          source: claimNodes[i],
          target: claimNodes[i + 1],
          type: 'rehearsed',
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [
    caseData,
    board,
    contradictions,
    rehearsed,
    impossible,
    highlights,
    boardPositions,
    boardFilter,
    selectedNodeId,
  ]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Synchronize generated nodes and edges when state updates
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleNodeDragStop: OnNodeDrag = (_, node) => {
    setBoardPosition(node.id, { x: node.position.x, y: node.position.y });
  };

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setFocusedCard(node.id);
  };

  const handlePaneClick = () => {
    setSelectedNodeId(null);
    clearHighlights();
  };

  const hasCards = (board?.statements.length ?? 0) > 0 || (board?.evidence.length ?? 0) > 0;

  if (!hasCards) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-surface-1 rounded-xl border border-border">
        <EmptyState
          titlePrefix="Search a room or "
          titleItalic="ask"
          titleSuffix=" a question."
          description="Statements and physical exhibits land as pinned cards on this corkboard, connected by red threads of contradiction."
          icon={<LayoutGrid className="size-6 text-text-tertiary" />}
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-[580px] lg:h-[680px] rounded-xl border border-border bg-background overflow-hidden flex flex-col select-none">
      {/* Top Filter Chips & Controls */}
      <div className="h-12 px-4 border-b border-border bg-surface-2/70 flex items-center justify-between z-10 shrink-0 gap-3">
        {/* Filter chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <span className="font-mono text-xs text-text-tertiary uppercase flex items-center gap-1 mr-1">
            <Filter className="size-3 text-text-tertiary" />
            Cards:
          </span>

          <Button
            variant={boardFilter.statements ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleBoardFilter('statements')}
            className={`h-7 px-2.5 text-xs font-mono gap-1 ${
              boardFilter.statements ? 'text-paper' : 'text-text-tertiary'
            }`}
          >
            <Feather className="size-3" />
            Statements ({board?.statements.length ?? 0})
          </Button>

          <Button
            variant={boardFilter.evidence ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleBoardFilter('evidence')}
            className={`h-7 px-2.5 text-xs font-mono gap-1 ${
              boardFilter.evidence ? 'text-brass' : 'text-text-tertiary'
            }`}
          >
            <Pin className="size-3 text-brass" />
            Evidence ({board?.evidence.length ?? 0})
          </Button>

          <Button
            variant={boardFilter.flags ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleBoardFilter('flags')}
            className={`h-7 px-2.5 text-xs font-mono gap-1 ${
              boardFilter.flags ? 'text-thread' : 'text-text-tertiary'
            }`}
          >
            <Flag className="size-3 text-thread" />
            Flags ({board?.flags.length ?? 0})
          </Button>

          <Button
            variant={boardFilter.inspector ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => toggleBoardFilter('inspector')}
            className={`h-7 px-2.5 text-xs font-mono gap-1 ${
              boardFilter.inspector ? 'text-inspector' : 'text-text-tertiary'
            }`}
          >
            <Sparkles className="size-3 text-inspector" />
            Inspector ({board?.hypotheses.length ?? 0})
          </Button>
        </div>

        {/* Legend status indicators */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
          {contradictions.length > 0 && (
            <div className="flex items-center gap-1.5 text-thread">
              <span className="size-2 rounded-full bg-thread" />
              <span>{contradictions.length} Thread{contradictions.length === 1 ? '' : 's'}</span>
            </div>
          )}
          {rehearsed.length > 0 && (
            <div className="flex items-center gap-1.5 text-brass">
              <span className="size-2 rounded-full bg-brass" />
              <span>{rehearsed.length} Rehearsed</span>
            </div>
          )}
        </div>
      </div>

      {/* React Flow Board Canvas */}
      <div className="flex-1 w-full h-full relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeDragStop={handleNodeDragStop}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          minZoom={0.2}
          maxZoom={1.8}
          proOptions={{ hideAttribution: true }}
          className="bg-background"
        >
          <Background color="var(--color-border)" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="rounded-lg border border-border bg-surface-2 text-text-primary shadow-floating m-3"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
