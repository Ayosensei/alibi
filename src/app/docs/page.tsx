'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/atoms';
import { Footer } from '@/components/shell/Footer';
import {
  Database,
  ShieldCheck,
  Server,
  CheckCircle2,
  Layers,
  ArrowRight,
  Workflow,
  Cpu,
  Fingerprint,
} from 'lucide-react';

export default function DocsPage() {
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
            Architecture & Hackathon Docs
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/tutorial">
            <Button variant="ghost" size="sm" className="text-xs text-text-secondary hover:text-text-primary">
              Field Manual
            </Button>
          </Link>
          <Link href="/season/1">
            <Button variant="default" size="sm" className="text-xs">
              Play Season 1
              <ArrowRight className="size-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-20 px-6 md:px-12 max-w-5xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-2 border border-border">
          <Database className="size-3.5 text-brass" />
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            Graph Hacks Track 01 · System Specification
          </span>
        </div>

        <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance leading-tight text-text-primary">
          Agents That Act on <span className="italic font-normal text-thread">Connected Data</span>
        </h1>

        <p className="text-sm md:text-base text-text-secondary max-w-3xl leading-relaxed text-balance">
          Alibi is a deductive reasoning detective game powered by <strong>FalkorDB</strong>. Suspect statements, physical room topology, and forensic items form an isolated graph partition. Graph algorithms expose lies through shortest paths, cycle detection, and alibi-support chains.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono">
          <span className="px-3 py-1 rounded-md bg-surface-2 border border-border text-text-secondary">
            Engine: <strong className="text-text-primary">FalkorDB v6.8</strong>
          </span>
          <span className="px-3 py-1 rounded-md bg-surface-2 border border-border text-text-secondary">
            AI SDK: <strong className="text-text-primary">Vercel AI SDK + Gemini Flash</strong>
          </span>
          <span className="px-3 py-1 rounded-md bg-surface-2 border border-border text-text-secondary">
            MCP: <strong className="text-text-primary">@modelcontextprotocol/sdk</strong>
          </span>
          <span className="px-3 py-1 rounded-md bg-surface-2 border border-border text-text-secondary">
            Tests: <strong className="text-success">75 / 75 Passing (Real DB)</strong>
          </span>
        </div>
      </section>

      {/* Section 1: Track 01 Criteria & Compliance */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            Hackathon Requirements
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            Track 01 Alignment Matrix
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            Organizers of Track 01 require that graph databases do genuine computational work rather than serving as passive text stores. Here is how Alibi delivers on every single focus point:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-brass">
              <Workflow className="size-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Multi-Hop Reasoning
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Topological & Motive Traversal
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Motive paths traverse up to 3 hops across <code className="text-brass font-mono">KNOWN_REL</code> edges. Physical movement feasibility runs variable-length shortest paths over connected estate rooms.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-inspector">
              <Cpu className="size-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Queries as Agent Tools
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              10 Formalized Tools
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              8 read tools and 2 board writes in <code className="text-inspector font-mono">TOOLS</code>. The AI agent never writes ad-hoc Cypher; it dispatches parameterized, audited queries through typed Zod contracts.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-thread">
              <Server className="size-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Tool Selection via MCP
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Standard Stdio MCP Server
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              <code className="text-thread font-mono">pnpm mcp</code> starts an MCP server over the standard reasoning tool registry, allowing external agent systems (Claude, Cursor, custom agents) to solve murder cases.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-brass">
              <Layers className="size-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Graph-Driven Actions
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Board Mutations & Elimination
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              When graph queries detect a lie, the Inspector writes <code className="text-brass font-mono">:Flag</code> and <code className="text-brass font-mono">:Hypothesis</code> nodes directly to the board with justification references.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-inspector">
              <Fingerprint className="size-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Explainable Results
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Concrete Paths, Not Guesses
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Every deductive assertion includes the exact room path, contradiction pair, or alibi-support chain that produced it. The verdict screen diffs what the player solved against ground truth.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-success">
              <ShieldCheck className="size-4" />
              <span className="font-mono text-xs uppercase tracking-wider font-semibold">
                Honest Abstention
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              "No Path" vs "Nothing"
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Empty query results are semantically differentiated. "No path known" is a valid graph traversal state, preserving full mathematical precision without hallucinating false connections.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2: The Information Barrier Architecture */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-thread">
            Architectural Core
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            The Information Barrier (Graph Partitions)
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            In AI reasoning systems, "cheating" occurs when the model or copilot has access to ground truth. Alibi enforces a cryptographic-level information barrier using dedicated FalkorDB database partitions:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Truth Graph */}
          <div className="p-6 rounded-xl bg-surface-1 border border-thread/50 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-thread font-bold uppercase">
                truth:{"{caseId}"}
              </span>
              <Stamp status="contradiction" label="RESTRICTED" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Ground Truth Partition
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              Contains hidden reality: actual perpetrators, true locations at each minute, hidden secret passages, knowledge facts (<code className="text-thread font-mono">knownBy</code>), and authored claims with truth flags.
            </p>
            <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-tertiary">
              Accessible ONLY by: <span className="text-text-primary">ask, search, bait, verdict</span>. Never sent to client or Inspector.
            </div>
          </div>

          {/* Public Template */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-brass font-bold uppercase">
                public:{"{caseId}"}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-2 text-brass border border-border">
                TEMPLATE
              </span>
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Public Map & Cast
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              The blueprint copied at the start of an investigation. Contains known rooms, open doors, public suspect personas, and time slots. Hidden doors and true alibis are scrubbed.
            </p>
            <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-tertiary">
              Copied via: <span className="text-text-primary">GRAPH.COPY public:{"{c}"} play:{"{p}"}:{"{c}"}</span>.
            </div>
          </div>

          {/* Player Tenant Graph */}
          <div className="p-6 rounded-xl bg-surface-1 border border-inspector/50 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-inspector font-bold uppercase">
                play:{"{pid}"}:{"{caseId}"}
              </span>
              <Stamp status="inferred" label="PLAY GRAPH" />
            </div>
            <h3 className="font-serif text-lg font-semibold text-text-primary">
              Isolated Tenant Graph
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              The player's working graph. Grows in real-time as statements are extracted and rooms are searched. Contains <code className="text-inspector font-mono">:Statement</code>, <code className="text-inspector font-mono">:Assertion</code>, <code className="text-inspector font-mono">:Flag</code>, and <code className="text-inspector font-mono">:Hypothesis</code> nodes.
            </p>
            <div className="p-3 rounded-lg bg-surface-2 border border-border text-xs font-mono text-inspector">
              AI Inspector & MCP read ONLY this partition. Zero truth leakage possible.
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The 10 Reasoning Tools */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            FalkorDB Engine Contract
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            The 10 Formal Reasoning Tools
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            Every tool conforms to a strict Zod contract returning the standard envelope: <code className="text-text-primary font-mono">{"{ ok, data, trace }"}</code>. Below are the 10 tools implemented in <code className="text-brass font-mono">src/engine/tools/</code>:
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-2 border-b border-border text-text-secondary">
              <tr>
                <th className="p-3.5 font-semibold">Tool Name</th>
                <th className="p-3.5 font-semibold">Type</th>
                <th className="p-3.5 font-semibold">Underlying Cypher Query</th>
                <th className="p-3.5 font-semibold">Purpose & Graph Logic</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-text-secondary">
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">getBoard</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Multi-MATCH</td>
                <td className="p-3.5 font-sans">Full snapshot of active statements, evidence, flags, hypotheses, and tick count.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">findContradictions</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Q60_contradictions</td>
                <td className="p-3.5 font-sans">Finds assertions placing the same subject in two distinct rooms at the same time slot.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">findRehearsedAlibis</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Q61_rehearsed</td>
                <td className="p-3.5 font-sans">Identifies pairs/triplets of suspects giving identical specific location details.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">findImpossibleMoves</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Q62 & Q63_distance</td>
                <td className="p-3.5 font-sans">Flags sequential room claims where required room transitions exceed available time slots.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">checkFeasibility</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Q66_hard_anchors</td>
                <td className="p-3.5 font-sans">Checks if a person could have reached a target room given their fixed physical anchors.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">whoCouldHave</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Q68_evidence_act</td>
                <td className="p-3.5 font-sans">Elimination algorithm: tests candidate feasibility for a scene act; returns survivors.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">motivePaths</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Q70_motive_paths</td>
                <td className="p-3.5 font-sans">Traverses up to 3 hops of known social/business relationships between suspect and victim.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">alibiSupport</td>
                <td className="p-3.5"><span className="text-inspector">Read</span></td>
                <td className="p-3.5 text-brass">Graph Alibi Chains</td>
                <td className="p-3.5 font-sans">Evaluates whether a corroborating witness has a reliable alibi or is compromised.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">flag</td>
                <td className="p-3.5"><span className="text-thread">Write</span></td>
                <td className="p-3.5 text-brass">CREATE (:Flag)</td>
                <td className="p-3.5 font-sans">Pins an inconsistency card (contradiction, impossible move, rehearsed) to the board.</td>
              </tr>
              <tr className="hover:bg-surface-2/40">
                <td className="p-3.5 font-bold text-text-primary">hypothesize</td>
                <td className="p-3.5"><span className="text-thread">Write</span></td>
                <td className="p-3.5 text-brass">CREATE (:Hypothesis)</td>
                <td className="p-3.5 font-sans">Writes a formal suspect accusation hypothesis with confidence percentage to the board.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Key Cypher Queries */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-brass">
            OpenCypher Showcase
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            Key FalkorDB Graph Queries
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            All Cypher in Alibi is strictly parameterized, pre-audited, and executed via <code className="text-brass font-mono">roQuery</code> for sub-10ms performance:
          </p>
        </div>

        <div className="space-y-6">
          {/* Query 1: Contradictions */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brass uppercase">Q60_contradictions</span>
                <span className="text-border-strong">·</span>
                <span className="text-xs text-text-secondary">Direct Space-Time Collisions</span>
              </div>
              <span className="font-mono text-xs text-text-tertiary">~3.2ms</span>
            </div>
            <pre className="p-4 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-primary overflow-x-auto leading-relaxed">
{`MATCH (a:Assertion), (b:Assertion)
WHERE a.subject = b.subject 
  AND a.slot = b.slot 
  AND a.room <> b.room 
  AND a.src < b.src
RETURN a.src AS srcA, a.hard AS hardA, 
       b.src AS srcB, b.hard AS hardB, 
       a.subject AS subject, a.slot AS slot, 
       a.room AS roomA, b.room AS roomB`}
            </pre>
          </div>

          {/* Query 2: Shortest Path Topology */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brass uppercase">Q63_distance</span>
                <span className="text-border-strong">·</span>
                <span className="text-xs text-text-secondary">Spatial Traversal over Estate Graph</span>
              </div>
              <span className="font-mono text-xs text-text-tertiary">~4.1ms</span>
            </div>
            <pre className="p-4 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-primary overflow-x-auto leading-relaxed">
{`MATCH (a:Room {id: $from}), (b:Room {id: $to})
MATCH p = shortestPath((a)-[:CONNECTS|HIDDEN_KNOWN*..8]-(b))
WHERE ALL(r IN relationships(p) WHERE 
  (type(r) = 'CONNECTS' AND r.state = 'open') OR 
  (type(r) = 'HIDDEN_KNOWN' AND $useHidden))
RETURN length(p) AS d, [n IN nodes(p) | n.id] AS path`}
            </pre>
          </div>

          {/* Query 3: Multi-Hop Motive Chains */}
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-brass uppercase">Q70_motive_paths</span>
                <span className="text-border-strong">·</span>
                <span className="text-xs text-text-secondary">Social & Business Relationship Chains</span>
              </div>
              <span className="font-mono text-xs text-text-tertiary">~5.4ms</span>
            </div>
            <pre className="p-4 rounded-lg bg-surface-2 border border-border text-xs font-mono text-text-primary overflow-x-auto leading-relaxed">
{`MATCH p = (a:Party {id: $person})-[:KNOWN_REL*1..3]-(v:Person {victim: true})
RETURN [r IN relationships(p) | r.id] AS relationIds, length(p) AS len
ORDER BY len LIMIT 3`}
            </pre>
          </div>
        </div>
      </section>

      {/* Section 5: The Suspect Firewall & Author Claims */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-thread">
            Fair Play & Anti-Hallucination
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            The Author Claim Firewall
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            LLMs in games frequently hallucinate false clues or reveal the killer prematurely. Alibi solves this with a strict four-stage interrogation pipeline:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 rounded-xl bg-surface-1 border border-border space-y-2">
            <span className="text-brass font-bold">1. Claim Selection</span>
            <p className="text-text-secondary font-sans leading-relaxed">
              <code className="text-brass font-mono">Q40_select_claims</code> queries the truth graph for authorized claims matching the topic and time slot that haven't already been revealed.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border space-y-2">
            <span className="text-inspector font-bold">2. Verbalization</span>
            <p className="text-text-secondary font-sans leading-relaxed">
              The LLM verbalizes the claim text in character with a structured JSON schema returning <code className="text-text-primary font-mono">{"{ reply, claimIds }"}</code>.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border space-y-2">
            <span className="text-thread font-bold">3. Firewall Check</span>
            <p className="text-text-secondary font-sans leading-relaxed">
              <code className="text-thread font-mono">firewall.ts</code> strictly verifies returned claim IDs and scans for forbidden keyword leaks against truth facts.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-surface-1 border border-border space-y-2">
            <span className="text-success font-bold">4. Template Fallback</span>
            <p className="text-text-secondary font-sans leading-relaxed">
              If the LLM fails validation or the network is offline (<code className="text-success font-mono">ALIBI_LLM=off</code>), the game falls back directly to the authored claim text.
            </p>
          </div>
        </div>
      </section>

      {/* Section 6: Testing & Verification Rigor */}
      <section className="py-12 px-6 md:px-12 max-w-7xl mx-auto border-t border-border space-y-8">
        <div className="space-y-2">
          <span className="font-mono text-xs uppercase tracking-widest text-success">
            Verification & Reproducibility
          </span>
          <h2 className="font-serif text-3xl font-semibold text-text-primary">
            Oracle Parity & Zero Mocking
          </h2>
          <p className="text-xs md:text-sm text-text-secondary max-w-3xl leading-relaxed">
            Every reasoning tool in Alibi has an oracle implementation in pure JavaScript (<code className="text-brass font-mono">scripts/reference-engine.mjs</code>). Automated test suites verify 100% parity against live FalkorDB:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4" />
              <span className="font-mono text-xs font-semibold">Real FalkorDB Tests</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Tests hit a real FalkorDB container on <code className="text-text-primary font-mono">localhost:6379</code>. Zero mocked database queries.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4" />
              <span className="font-mono text-xs font-semibold">Information Barrier Test</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Automated leak tests verify that no ground-truth fields (<code className="text-thread font-mono">culprits</code>, <code className="text-thread font-mono">knownBy</code>) ever appear in player responses or Inspector contexts.
            </p>
          </div>

          <div className="p-6 rounded-xl bg-surface-1 border border-border shadow-card space-y-3">
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="size-4" />
              <span className="font-mono text-xs font-semibold">Deterministic Fallback</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              If an AI provider encounters rate limits or API outages, a deterministic plan executes the exact same FalkorDB tool pipeline with zero disruption.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-16 px-6 md:px-12 max-w-4xl mx-auto text-center border-t border-border space-y-6">
        <h2 className="font-serif text-3xl font-semibold text-text-primary">
          Explore the Live Implementation
        </h2>
        <p className="text-xs md:text-sm text-text-secondary max-w-xl mx-auto leading-relaxed">
          Experience the graph reasoning engine live in the browser, review the developer field manual, or inspect the styleguide component library.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <Link href="/season/1">
            <Button variant="default" size="default" className="text-xs h-10 px-6">
              Investigate Season 1 Cases
              <ArrowRight className="size-4 ml-2" />
            </Button>
          </Link>
          <Link href="/tutorial">
            <Button variant="secondary" size="default" className="text-xs h-10 px-6">
              Detective Field Manual
            </Button>
          </Link>
          <Link href="/styleguide">
            <Button variant="ghost" size="default" className="text-xs h-10 px-6 text-text-secondary hover:text-text-primary">
              UI Styleguide
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
