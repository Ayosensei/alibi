import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Chip, Stamp } from '@/components/atoms';
import {
  ShieldAlert,
  Sparkles,
  GitFork,
  ArrowRight,
  Database,
  Brain,
  Compass,
  Lock,
  Layers,
  FolderOpen,
  Eye,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-thread/30">
      {/* Top Banner Navigation */}
      <header className="h-16 border-b border-border px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-semibold tracking-widest text-brass uppercase">
            ALIBI
          </span>
          <span className="text-border-strong">/</span>
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wider hidden sm:inline">
            FalkorDB Detective Game
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/styleguide">
            <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-text-primary">
              Styleguide
            </Button>
          </Link>
          <Link href="/season/1">
            <Button variant="default" size="sm" className="text-xs">
              Open Dossiers
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 max-w-5xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border">
          <Sparkles className="size-3 text-brass" />
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            Graph Hacks Track 01: Agents That Act on Connected Data
          </span>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tight text-balance leading-tight text-text-primary">
          Every lie <span className="italic font-normal text-thread">leaves</span> a path.
        </h1>

        <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed text-balance">
          Interrogate suspects whose statements construct a dynamic knowledge graph in FalkorDB.
          Contradictions, rehearsed alibis, and impossible journeys expose the conspiracy.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/season/1">
            <Button variant="default" size="default" className="px-6 h-11 text-sm">
              <FolderOpen className="size-4 mr-2" />
              Begin Investigation (Season 1)
            </Button>
          </Link>
          <Link href="/play/l1-quiet-pact?mode=cold_case">
            <Button variant="secondary" size="default" className="px-6 h-11 text-sm">
              <Eye className="size-4 mr-2 text-inspector" />
              Watch Recorded Cold Case
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Pillars Grid */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Graph Engine */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4">
            <div className="size-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-brass">
              <Database className="size-5" />
            </div>
            <div className="space-y-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-brass block">
                FalkorDB Knowledge Graph
              </span>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                The Graph Does Real Work
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Suspect claims and scene exhibits form an isolated player graph. Cypher queries calculate movement feasibility across physical room topologies and identify timing conflicts.
              </p>
            </div>
          </div>

          {/* Pillar 2: AI Inspector */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4">
            <div className="size-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-inspector">
              <Brain className="size-5" />
            </div>
            <div className="space-y-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-inspector block">
                Autonomous Copilot
              </span>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Live Inspector Reasoning
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                An AI Inspector streams tool calls via SSE, synthesizes evidence into hypotheses, and pinpoints discrepancies with concrete graph paths—without ever accessing ground truth.
              </p>
            </div>
          </div>

          {/* Pillar 3: Information Barrier */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4">
            <div className="size-10 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-thread">
              <ShieldAlert className="size-5" />
            </div>
            <div className="space-y-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-thread block">
                Information Barrier
              </span>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Guaranteed Fair Play
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Ground truth resides in a strictly partitioned database partition. Suspects speak solely from authored claims validated through an automated firewall, never hallucinating facts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Season 1 Case Preview Banner */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <span className="font-mono text-xs uppercase tracking-widest text-brass">
              Three Distinct Puzzles
            </span>
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              Season 1: The Vale <span className="italic font-normal text-thread">Conspiracy</span>
            </h2>
          </div>
          <Link href="/season/1">
            <Button variant="secondary" size="sm" className="text-xs">
              View All 3 Cases
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Case 1 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-brass tracking-widest uppercase">
                  FILE 01
                </span>
                <Stamp status="contradiction" label="CONTRADICTIONS" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                The Quiet Pact
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Three suspects claim they were together in the prop store. The electronic lock log says none of them entered.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60">
              <Link href="/play/l1-quiet-pact">
                <Button variant="default" size="sm" className="w-full text-xs">
                  Investigate File 01
                </Button>
              </Link>
            </div>
          </div>

          {/* Case 2 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-brass tracking-widest uppercase">
                  FILE 02
                </span>
                <Stamp status="impossible" label="IMPOSSIBLE MOVES" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                The Stopped Watch
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                A shattered pocket watch anchors the murder to an exact minute. One suspect could not physically cross the estate in time.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60">
              <Link href="/play/l2-stopped-watch">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Investigate File 02
                </Button>
              </Link>
            </div>
          </div>

          {/* Case 3 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-semibold text-brass tracking-widest uppercase">
                  FILE 03
                </span>
                <Stamp status="cleared" label="ELIMINATIONS" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                The Blackout Dinner
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Six dinner guests in pitch darkness. The circuit breaker was thrown by someone navigating a hidden library corridor.
              </p>
            </div>
            <div className="pt-4 border-t border-border/60">
              <Link href="/play/l3-blackout-dinner">
                <Button variant="secondary" size="sm" className="w-full text-xs">
                  Investigate File 03
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-6 md:px-12 text-center text-xs text-text-secondary max-w-7xl mx-auto space-y-2">
        <p className="font-mono text-brass">
          ALIBI · Track 01: Agents That Act on Connected Data
        </p>
        <p className="text-text-tertiary">
          FalkorDB · Next.js App Router · Vercel AI SDK with Gemini Flash · @xyflow/react
        </p>
      </footer>
    </div>
  );
}
