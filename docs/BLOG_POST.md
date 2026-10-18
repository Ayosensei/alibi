# Every Lie Leaves a Path: How We Built an AI Detective Game Powered by FalkorDB

*By Ayo & Femi (Team Subaru Boys) · Built for Graph Hacks 2026 (Track 01: Agents That Act on Connected Data)*

---

![Alibi Banner](https://raw.githubusercontent.com/Ayosensei/alibi/main/public/alibi-banner.jpg)

When you watch a classic murder mystery—whether it's Agatha Christie's Poirot or Benoit Blanc in *Knives Out*—the detective never just "asks someone what happened." 

They pace the drawing room cross-referencing railway timetables, floor plans, keycard logs, and conflicting alibis, connecting pins with red thread on a corkboard. Every alibi is a hypothesis; every locked door is a topological constraint; every statement is a soft claim waiting to collide with physical reality.

When we set out to build **[Alibi](https://github.com/Ayosensei/alibi)** for **Graph Hacks Track 01 (*Agents That Act on Connected Data*)**, we asked ourselves a fundamental question:

> **Why do current AI detective games feel so hollow?**

The answer was immediate: **Developers keep trying to make the Large Language Model act as the database, the judge, and the spatial engine all at once.**

LLMs are extraordinary actors, but they are terrible judges. When an LLM controls game logic, it hallucinates non-existent clues, flatters the player when they make wild guesses, and completely forgets spatial geometry (like letting a suspect walk through three locked doors in two minutes).

To build a detective game with real deductive rigor, we had to flip the architecture:

> 💡 **The Core Thesis of Alibi:**  
> **The LLM is just the voice. FalkorDB is the brain.**

In this post, we’ll break down how we built Alibi, how we solved the "hallucinating AI" problem with an automated graph firewall, and how FalkorDB's connected data structures power our autonomous AI Inspector agent.

---

## 1. The Architecture: The Information Barrier

In a murder mystery, the player must *never* see the ground truth prematurely, and neither can the AI copilot. If the ground truth is stuffed into the AI’s system prompt or queried from a shared table, the model will inevitably leak spoilers through subtle phrasing or bias.

We solved this with **Graph-Level Multi-Tenancy**:

```
                       ┌───────────────────────────────────────────────┐
                       │          HIDDEN GROUND TRUTH GRAPH            │
                       │             (truth:{caseId})                  │
                       │  • Real culprit     • Murder weapon           │
                       │  • Actual presence  • Hidden exhibits         │
                       └───────────────────────┬───────────────────────┘
                                               │
                           GRAPH.COPY (Initial Template at Tick 0)
                                               │
                                               ▼
┌───────────────────────┐              ┌───────────────────────────────┐
│       AI SUSPECTS     │              │     PLAYER'S DEDUCTION GRAPH  │
│ (Bound by LLM Firewall│              │    (play:{playerId}:{caseId}) │
│   to authored claims) │─────────────►│  • Discovered statements      │
└───────────────────────┘  Creates     │  • Found keycard logs/anchors │
                           (:CLAIMED)  │  • Physical room topology     │
                                       └───────────────▲───────────────┘
                                                       │
                                            Autonomous Cypher Traversal
                                            (Q60, Q61, Q62, Q70)
                                                       │
                                       ┌───────────────┴───────────────┐
                                       │      AI INSPECTOR AGENT       │
                                       │  (Writes Flags & Hypotheses)  │
                                       └───────────────────────────────┘
```

1. **The Truth Graph (`truth:{caseId}`):** Holds the canonical reality of the crime. Only search actions and the final verdict evaluator can touch this graph.
2. **The Player Graph (`play:{playerId}:{caseId}`):** Starts completely blank of claims. When a case begins, FalkorDB clones the public scene template using `GRAPH.COPY`.
3. **Discrete Tenants, Zero Leaks:** The player's deduction graph only contains nodes the player has personally uncovered. Zero spoilers can ever leak because the data literally does not exist in the player's graph.

---

## 2. The LLM Firewall: Actors, Not Deciders

In Alibi, players interrogate suspects in natural language. But unlike unstructured chat games, our suspects **cannot invent facts**.

When you ask Dee, *"Where were you at 8:20?"*, here is what happens:

```
[Player Question] 
       │
       ▼
[FalkorDB Q40] ──► Selects eligible authored claims for suspect
       │
       ▼
[Gemini Flash] ──► Voices the persona in natural dialogue:
       │           { reply: "I was running lines in the green room...", claimIds: ["c1_dee_loc5"] }
       │
       ▼
[LLM Firewall] ──► Validates returned claimIds match graph preconditions
       │
       ▼
[FalkorDB Write] ─► CREATE (p:Person {id: 'dee'})-[:CLAIMED {at: 5}]->(r:Room {id: 'green_room'})
```

If the LLM tries to invent an alibi not authored in the mystery, the firewall rejects it and falls back to authored dialogue. The LLM handles the dramatic voice; **FalkorDB records the structural assertion.**

---

## 3. How Connected Data Solves Detective Reasoning

Once statements and scene evidence enter FalkorDB, our reasoning tools execute deterministic OpenCypher queries to expose lies.

### A. Instant Contradiction Detection (Query Q60)
In relational SQL, cross-referencing statements against physical evidence requires complex self-joins over dynamic time windows. In FalkorDB, it is a direct graph pattern match:

```cypher
MATCH (s:Statement)-[:AT_TIME]->(t:Slot), (a:Anchor)-[:AT_TIME]->(t)
WHERE s.subject = a.subject AND s.room <> a.room
RETURN s.by AS suspect, s.room AS claimed_room, a.room AS actual_room, t.slot AS time_slot
```

When Dee claims she was in the **Green Room** at 8:20, but the electronic keycard reader logs her entering the **Prop Store** at 8:20, FalkorDB identifies the conflict in **sub-2ms execution time**. 

In the UI, our **Pocket Graph** renders this immediately as a glowing red conflict ray connecting Dee's claim to the physical anchor.

### B. Unmasking Rehearsed Alibi Pacts (Query Q61)
In Case 1 (*A Quiet Pact*), three suspects—Dee, Kofi, and Hana—conspire to cover for each other. When interrogated individually about their whereabouts at 8:20, they all claim to have been running lines in the Green Room, and they all recite the exact same curious detail: *"the interval bell rang twice."*

FalkorDB detects this collusion cluster instantly:

```cypher
MATCH (s:Statement {kind: 'location'})
WHERE s.detail <> ''
WITH s.slot AS slot, s.room AS room, s.detail AS detail, collect(DISTINCT s.by) AS suspects
WHERE size(suspects) >= 2
RETURN slot, room, detail, suspects
```

The graph identifies that multiple independent suspects are sharing an identical authored detail, exposing their cover story before any physical evidence is even found!

### C. Physical Room Walking Feasibility & Shortest Paths
Can a suspect be in the Box Office at 8:00, commit a murder in the Prop Store at 8:20, and return to the Foyer by 8:40?

In Alibi, estate floor plans are modeled as a connected room graph: `(:Room)-[:CONNECTED_TO]->(:Room)`. Moving between adjacent rooms takes 1 time slot. FalkorDB computes the physical feasibility:

$$\text{Feasible} \iff \text{shortestPath}(\text{Room}_A, \text{Room}_B) \le |\text{Slot}_B - \text{Slot}_A|$$

If locked doors or keycard restrictions block the corridor, FalkorDB's `shortestPath()` traversal mathematically clears innocent suspects and exposes impossible travel claims.

---

## 4. The Autonomous AI Inspector Copilot

Alibi doesn't leave the player alone with raw Cypher. We built an **AI Inspector** powered by the Model Context Protocol (MCP) and Vercel AI SDK.

The Inspector is an autonomous agent that acts directly on connected data:
1. It queries FalkorDB using high-level graph tools: `getContradictions()`, `getEliminations()`, `getAlibiChain()`, and `getMotivePaths()`.
2. It analyzes the paths returned by FalkorDB.
3. It autonomously creates `(:Flag)` and `(:Hypothesis)` nodes directly inside the player’s FalkorDB graph, giving each hypothesis a confidence score based on physical anchors.
4. It explains its deduction step-by-step to the player, pointing directly to the graph path.

---

## 5. What We Learned Building on FalkorDB

Building a full-stack, real-time graph game within the hackathon window was an exhilarating challenge. Here are our biggest takeaways:

### ⚡ 1. The Speed of GraphBLAS is Real
FalkorDB’s C-based GraphBLAS engine is shockingly fast. In Alibi, every single suspect interaction triggers:
- Live graph updates
- Contradiction scans across 8 time slots
- Rehearsed alibi checks
- Clearance checks across room topologies

Even with all these queries running in sequence, our backend roundtrip latency remained under **15ms**. That speed makes the UI feel completely instantaneous.

### 🛡️ 2. `GRAPH.COPY` is a Game Changer for Multi-Tenancy
Creating isolated sandbox environments usually involves either complex schema migrations or risky row-level security filters (`WHERE user_id = ...`). FalkorDB's ability to clone an entire graph template with `GRAPH.COPY` in milliseconds gave us bulletproof information security with zero boilerplate.

### 🧩 3. Graphs are the Missing Half of Agentic AI
LLMs have conquered human language, but they struggle with structured state, spatial awareness, and mathematical consistency. Giving our AI agent access to a live FalkorDB knowledge graph gave it something prompt engineering never could: **an objective ground truth that it could traverse, verify, and prove.**

---

## Try It Out

- 🌐 **Play Alibi:** [https://alibi-game.vercel.app](https://alibi-game.vercel.app)
- 📦 **GitHub Repository:** [https://github.com/Ayosensei/alibi](https://github.com/Ayosensei/alibi)
- 🎥 **Watch the Demo Video:** [YouTube Walkthrough](https://youtu.be/FuiIWO71Ogg)

*Special thanks to FalkorDB and WeMakeDevs for hosting Graph Hacks 2026. Happy investigating!*
