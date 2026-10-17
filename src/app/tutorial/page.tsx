'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Chip, Stamp, Polaroid, TraceRow } from '@/components/atoms';
import { Footer } from '@/components/shell/Footer';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Search,
  MessageSquare,
  Clock,
  MapPin,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  CheckCircle2,
  Database,
  Brain,
  Layers,
  KeyRound,
  Eye,
  Scale,
} from 'lucide-react';

export default function TutorialPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary selection:bg-thread/30">
      {/* Top Banner Navigation */}
      <header className="h-16 border-b border-border px-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-mono text-xs font-semibold tracking-widest text-brass uppercase hover:text-text-primary transition-colors group"
          >
            <Image
              src="/alibi-logo.jpg"
              alt="Alibi Logo"
              width={28}
              height={28}
              className="size-7 rounded-full object-cover border border-brass/50 group-hover:border-brass transition-colors shadow-sm"
            />
            <span>ALIBI</span>
          </Link>
          <span className="text-border-strong">/</span>
          <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
            Detective Field Manual
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-text-primary">
              Docs & Arch
            </Button>
          </Link>
          <Link href="/season/1">
            <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-text-primary">
              Case Dossiers
            </Button>
          </Link>
          <Link href="/play/l1-quiet-pact">
            <Button variant="default" size="sm" className="text-xs">
              Play File 01
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-6 md:px-12 max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border">
          <Compass className="size-3.5 text-brass" />
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            Official Inquest Guide
          </span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-tight text-text-primary">
          How to Unravel a <span className="italic font-normal text-thread">Conspiracy</span>
        </h1>

        <p className="text-sm md:text-base text-text-secondary max-w-2xl mx-auto leading-relaxed text-balance">
          Every suspect claims an alibi. Every statement becomes a node in a FalkorDB knowledge graph.
          Learn how to interrogate, search scenes, spot impossible journeys, and command the AI Inspector to close the case.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="/play/l1-quiet-pact">
            <Button variant="default" size="default" className="text-xs h-10 px-5">
              Launch Level 1 Tutorial Case
              <ArrowRight className="size-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/play/l1-quiet-pact?mode=cold_case">
            <Button variant="secondary" size="default" className="text-xs h-10 px-5">
              <Eye className="size-4 mr-1.5 text-inspector" />
              Watch Recorded Cold Case Run
            </Button>
          </Link>
        </div>
      </section>

      {/* 4-Step Core Loop */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="text-center space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            The Core Investigation Cycle
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            Four Steps to a Conviction
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="size-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-brass font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Inquire (Spoken Claims)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Select a suspect and ask for their whereabouts during the crime window. Each reply is an authored claim that pins a statement card into your graph.
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-paper text-ink border border-ink/20 font-mono text-xs font-medium">
                Spoken Claim
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="size-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-brass font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Search (Physical Proof)
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Inspect physical rooms to uncover electronic access logs, broken watches, or ledger fragments. Physical items act as objective ground truth anchors.
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-text-primary border border-border font-mono text-xs font-medium">
                Physical Proof
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="size-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-thread font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                Spot Discrepancies
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Open the Timeline or Evidence Board. The graph engine automatically identifies contradictions, rehearsed alibis, and impossible travel routes.
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <Stamp status="contradiction" label="CONTRADICTION" />
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="size-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center text-inspector font-mono font-bold text-sm">
                04
              </div>
              <h3 className="font-serif text-lg font-semibold text-text-primary">
                File Accusation
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Once suspects are eliminated or their alibis shatter, open the Accuse modal (hotkey A), designate the perpetrators, and review the explained inquest verdict.
              </p>
            </div>
            <div className="pt-3 border-t border-border/60 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-inspector/10 text-inspector border border-inspector/50 font-mono text-xs font-medium">
                Inquest Resolution
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Deep Dive: The Three Graph Discrepancies */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-thread">
            FalkorDB Graph Reasoning
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            The Three Ways Suspects Lie
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-2xl leading-relaxed">
            In traditional games, contradictions are hardcoded script triggers. In Alibi, all discrepancies are computed through OpenCypher graph pattern queries against physical topology and time slots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Discrepancy 1: Direct Contradiction */}
          <div className="p-6 rounded-xl bg-surface-1 border border-thread/40 shadow-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Stamp status="contradiction" label="DIRECT CONTRADICTION" />
                <span className="font-mono text-xs text-thread font-semibold">Q60</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Two Places at Once
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                Occurs when a suspect claims they were in Room A at 10:30 PM, but physical evidence (like an automated lock log) proves they were in Room B, or never entered.
              </p>
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono space-y-1">
                <div className="text-text-secondary">
                  Claim: <span className="text-paper">Prop Store (10:30 PM)</span>
                </div>
                <div className="text-text-secondary">
                  Proof: <span className="text-thread">Lock Log: 0 entries</span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-xs font-mono text-text-tertiary">
              Highlighted by red thread on the board.
            </div>
          </div>

          {/* Discrepancy 2: Rehearsed Alibi */}
          <div className="p-6 rounded-xl bg-surface-1 border border-brass/40 shadow-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Stamp status="rehearsed" label="REHEARSED STORY" />
                <span className="font-mono text-xs text-brass font-semibold">Q61</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Colluding Suspects
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                When three suspects give identical word-for-word explanations for why they were in an obscure room, the graph pattern reveals a prepared cover story.
              </p>
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono space-y-1">
                <div className="text-text-secondary">
                  Kofi: <span className="text-brass">"Checking costume inventory"</span>
                </div>
                <div className="text-text-secondary">
                  Dee: <span className="text-brass">"Checking costume inventory"</span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-xs font-mono text-text-tertiary">
              Flagged with brass pins across suspects.
            </div>
          </div>

          {/* Discrepancy 3: Impossible Journey */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Stamp status="impossible" label="IMPOSSIBLE MOVE" />
                <span className="font-mono text-xs text-status-impossible font-semibold">Q62</span>
              </div>
              <h3 className="font-serif text-xl font-semibold text-text-primary">
                Spatial Infeasibility
              </h3>
              <p className="text-xs text-text-secondary leading-relaxed">
                The estate is a graph of connected rooms. If a suspect was seen in the Courtyard at 10:20 PM and the Attic at 10:30 PM, but the shortest path requires 4 doors, they are lying.
              </p>
              <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono space-y-1">
                <div className="text-text-secondary">
                  Required distance: <span className="text-status-impossible">4 transitions</span>
                </div>
                <div className="text-text-secondary">
                  Available time: <span className="text-text-primary">1 time slot</span>
                </div>
              </div>
            </div>
            <div className="pt-2 text-xs font-mono text-text-tertiary">
              Exposed via shortest-path Cypher algorithms.
            </div>
          </div>
        </div>
      </section>

      {/* The Two-Tier AI Inspector */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div className="space-y-2">
            <span className="font-mono text-xs uppercase tracking-widest text-inspector">
              AI Copilot & Hackathon Verification
            </span>
            <h2 className="font-serif text-3xl font-semibold text-text-primary">
              The Two-Tier AI Inspector
            </h2>
            <p className="text-xs md:text-sm text-text-secondary max-w-2xl leading-relaxed">
              Alibi features an autonomous reasoning copilot with an information barrier. It queries only what you have discovered and streams conclusions via Server-Sent Events.
            </p>
          </div>
          <div className="flex items-center gap-2 p-1 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-secondary">
            <Database className="size-3.5 text-inspector" />
            <span>FalkorDB Read Barrier Active</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier 1: Detective View */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-text-primary font-semibold">
                Tier 1: Detective View (Default)
              </span>
              <Chip variant="default" className="text-xs">
                For Players
              </Chip>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Designed for immersion. Complex graph algorithms collapse into neat status accordions. The focus remains on deductive conclusions, pinned contradiction flags, and formal accusation confidence scores.
            </p>
            <div className="p-3.5 rounded-lg bg-surface-2 border-l-2 border-inspector space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-mono text-inspector font-semibold">
                <Sparkles className="size-3" />
                Inspector Deduction
              </div>
              <p className="text-text-primary leading-relaxed">
                "Kofi claims to have been in the prop store at 10:30 PM, but the lock log shows the room was unoccupied. This is a direct contradiction."
              </p>
            </div>
          </div>

          {/* Tier 2: Judge & Cypher Trace */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-inspector font-semibold">
                Tier 2: Judge & Cypher Trace
              </span>
              <Chip variant="inspector" className="text-xs">
                For Hackathon Judges
              </Chip>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Click the <strong>Cypher Trace</strong> toggle in the Inspector header to reveal every live FalkorDB roQuery call, execution latency in milliseconds, row counts, and graph traversal parameters.
            </p>
            <div className="space-y-1.5">
              <TraceRow
                agent="inspector"
                tool="findContradictions"
                queryId="Q60_contradictions"
                rows={1}
                ms={3.2}
              />
              <TraceRow
                agent="inspector"
                tool="checkFeasibility"
                queryId="Q63_check_feasibility"
                rows={0}
                ms={4.1}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Keyboard Shortcuts Field Guide */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            Speed & Ergonomics
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            Detective Keyboard Shortcuts
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-xl leading-relaxed">
            Every major investigative action is bound to a single keystroke for rapid play and seamless presentation.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 font-mono text-xs">
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">Case Briefing</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-brass font-bold">?</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">Present Mode</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-text-primary font-bold">P</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">Timeline Tab</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-text-primary font-bold">1</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">Evidence Board</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-text-primary font-bold">2</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">AI Inspector</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-inspector font-bold">3</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">Case Notes</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-text-primary font-bold">4</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">Bait Slip (L2/L3)</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-brass font-bold">B</kbd>
          </div>
          <div className="p-4 rounded-lg bg-surface-1 border border-border flex items-center justify-between">
            <span className="text-text-secondary">File Accusation</span>
            <kbd className="px-2 py-1 rounded bg-surface-2 border border-border text-thread font-bold">A</kbd>
          </div>
        </div>
      </section>

      {/* Call to Action Footer */}
      <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto text-center border-t border-border space-y-6">
        <h2 className="font-serif text-3xl md:text-4xl font-semibold text-text-primary">
          Ready to open your first case?
        </h2>
        <p className="text-xs md:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
          The Vale Shipping Trust conspiracy begins with File 01: The Quiet Pact. Examine the three suspects, inspect the prop store, and expose the lie.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/play/l1-quiet-pact">
            <Button variant="default" size="default" className="text-xs h-10 px-6">
              Begin File 01 Investigation
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
          <Link href="/season/1">
            <Button variant="secondary" size="default" className="text-xs h-10 px-6">
              Browse All Season 1 Dossiers
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
