# Alibi — 3-Minute Demo Video Script
**Track 01: Agents That Act on Connected Data**  
**Hackathon:** Graph Hacks 2026 (WeMakeDevs & FalkorDB)  
**Team:** Subaru Boys (Ayo & Femi)  
**Target Duration:** 3:00 (180 seconds)  
**Recording Mode:** Fullscreen 1920x1080, 60fps, clean microphone audio.

---

## 🎬 Recording Setup & Pre-Flight Checklist

Before hitting record:
1. Run `pnpm demo:reset` in terminal to guarantee clean graphs.
2. In browser tab 1: Open [http://localhost:3001](http://localhost:3001) (Alibi).
3. In browser tab 2: Open [http://localhost:3000](http://localhost:3000) (FalkorDB Browser) connected to `localhost:6379`.
4. In terminal: Have a second split terminal ready showing `pnpm mcp`.
5. Press `P` on Alibi if you want large presentation mode fonts.

---

## ⏱️ Video Breakdown

```
[0:00 - 0:15] Act 1: The Hook & Core Pitch
[0:15 - 0:45] Act 2: Interrogation & Contradiction Pattern Matching (Case 1)
[0:45 - 1:15] Act 3: Physical Movement Feasibility & Shortest Paths
[1:15 - 1:50] Act 4: Autonomous AI Inspector Reasoning Live on Connected Data
[1:50 - 2:15] Act 5: Single-Survivor Candidate Elimination (Case 3)
[2:15 - 2:35] Act 6: FalkorDB Architecture & The Information Barrier
[2:35 - 2:50] Act 7: Model Context Protocol (MCP) Integration
[2:50 - 3:00] Act 8: The Verdict Inquest & Closing
```

---

## Detailed Script (Word-for-Word & Screen Direction)

### Act 1: The Hook & Core Pitch (0:00 – 0:15)
* **Screen:** Start on the Alibi landing page ([http://localhost:3001](http://localhost:3001)). Slowly scroll past the glowing red title: *"Every lie leaves a path."*
* **Voiceover:**
  > "Every lie leaves a path. In detective stories, investigators connect clues with red thread on a corkboard. In real software, reasoning over interdependent alibis, physical floor plans, and contradictory stories isn't a vector search problem—**it is a connected graph problem**.
  > This is **Alibi**, a detective game where **FalkorDB** is the brain that exposes the conspirators, and an autonomous AI Inspector explains the proof."

---

### Act 2: Interrogation & Contradiction Pattern Matching (0:15 – 0:45)
* **Screen:** Click **"Investigate File 01: The Quiet Pact"**. Select **Dee Marsh** from the left dossier.
* **Action:** Click *"Where were you at 8:20 (Slot 5)?"* Dee replies claiming she was in the Green Room with Kofi and Hana, mentioning the bell rang twice. Switch to **Kofi** and **Hana** and ask the same. Switch to the **Timeline Grid**: highlight the golden bracket showing the rehearsed alibi.
* **Action:** In the left sidebar, click **Search Room** on `Prop Store`. A keycard log exhibit pops up showing Dee, Kofi, and Hana swiped into the Prop Store at 8:20.
* **Action:** Switch to the **Evidence Board tab**. Point to the red glowing contradiction thread drawn between Dee's statement and the keycard log.
* **Voiceover:**
  > "We're investigating the murder of a theatre director. When we interrogate our suspects, their replies aren't prompt hallucinations—they convey discrete graph claims.
  > Notice the timeline: Dee, Kofi, and Hana tell identical stories about hearing a bell. FalkorDB flags this with `Q61_rehearsed`.
  > But when we search the crime scene, the keycard access log reveals all three entered the prop store at that exact minute. Instantly, FalkorDB runs `Q60_contradictions`—a dual-node pattern match that detects the spatial collision and pins red conflict threads directly onto our deduction board."

---

### Act 3: Physical Movement Feasibility & Shortest Path (0:45 – 1:15)
* **Screen:** Select **Mr. Okoye** (Box-Office Manager).
* **Action:** Click **"Ask Inspector"** or trigger **"Could Okoye do it?"**.
* **Screen:** The AI Inspector card displays in steel blue: `checkFeasibility: Okoye -> Prop Store: Infeasible (Distance: 3, Window: 1)`. The board highlights Okoye's card with an emerald cleared badge.
* **Voiceover:**
  > "Now, what about Mr. Okoye? He had a financial motive, but could he have reached the crime scene?
  > A vector database cannot answer this. FalkorDB computes `shortestPath()` across the physical door topology of the playhouse in `Q63_distance`.
  > Moving from the box office to the prop store requires 3 room transitions, but Okoye was ticketed at the box office 10 minutes earlier. FalkorDB mathematically proves he could not physically traverse the distance in time. An innocent suspect is cleared with an explainable path."

---

### Act 4: Autonomous AI Inspector on Connected Data (1:15 – 1:50)
* **Screen:** Return to Dossiers Menu, click **Recorded Cold Case** on **File 03: The Blackout Dinner**.
* **Action:** The Inspector stream starts playing over SSE. Point to the stream cards landing in real time:
  1. Contradiction Detection (Found 3 contradictions, 277ms).
  2. Flag Pinned to Board.
  3. `whoCouldHave` (Evaluated candidates for Circuit Breaker: Clara).
  4. Feasibility for Study (Hidden passage known only by Tobias).
  5. `alibiSupport` (Roz discredited, Clara's alibi collapses).
* **Action:** Switch to the **Cypher Trace** tab in the Inspector panel showing query ID, parameter inputs, returned rows, and sub-millisecond execution times.
* **Voiceover:**
  > "Here is our Track 01 agent in action: the **AI Inspector**. It streams tool executions in real time over Server-Sent Events.
  > Watch closely: the Inspector doesn't invent guesses. It executes our fixed catalogue of 10 Zod-governed reasoning tools backed by 58 parameterised Cypher queries.
  > It discovers contradictions, writes `Flag` nodes onto the player's graph, traverses multi-hop motive paths, and drops `Hypothesis` deduction nodes.
  > Every action is explainable: our trace panel records the exact Cypher query, row count, and latency for every single inference."

---

### Act 5: Single-Survivor Candidate Elimination & Alibi Chains (1:50 – 2:15)
* **Screen:** Zoom in on the board for Case 3 where the `Circuit Breaker` evidence card links to Clara.
* **Action:** Show the timeline where Roz's false statement is contradicted, and show Clara's alibi dependency bracket turning red and collapsing.
* **Voiceover:**
  > "In Level 3, the power was cut during dinner. The evidence records an act: someone tripped the breaker at slot 4.
  > FalkorDB runs `whoCouldHave`: it tests path feasibility and room degree for every dinner guest. Five candidates are physically eliminated. Exactly one survivor remains: Clara.
  > FalkorDB writes an inferred anchor node to the graph, which immediately triggers downstream contradictions against her previous statements.
  > Meanwhile, Clara's alibi relied on Roz seeing her. When Roz's alibi is discredited, the multi-hop dependency tree collapses."

---

### Act 6: FalkorDB Architecture & The Information Barrier (2:15 – 2:35)
* **Screen:** Switch to the **FalkorDB Browser** tab ([http://localhost:3000](http://localhost:3000)).
* **Action:** Show the graph dropdown:
  - `truth:l1-quiet-pact`
  - `public:l1-quiet-pact`
  - `play:demo:l1-quiet-pact`
* **Action:** Run a quick query: `GRAPH.LIST` or `MATCH (n) RETURN count(n)`.
* **Voiceover:**
  > "Under the hood, FalkorDB powers our architectural foundation: **The Information Barrier**.
  > Ground truth lives in `truth:caseId`. The player's workspace is an isolated graph cloned via `GRAPH.COPY` at `play:playerId:caseId`.
  > Multi-tenancy is enforced at the graph level, not through leaky `WHERE` clauses. Neither the player, the LLM, nor the AI Inspector can ever query truth. Suspect dialogue is voiced by Gemini Flash, but constrained by an automated graph firewall that guarantees zero hallucinations."

---

### Act 7: Model Context Protocol (MCP) Integration (2:35 – 2:50)
* **Screen:** Switch to terminal showing `pnpm mcp` running, or a terminal running an MCP tool call (e.g. `alibi.findContradictions`).
* **Voiceover:**
  > "Because Track 01 is all about autonomous agents acting on connected data, Alibi exposes an official **Model Context Protocol (MCP)** server over stdio.
  > Any external agent—whether in Claude Desktop, Cursor, or an AGY sidecar—can connect directly to Alibi, call reasoning tools like `findContradictions` and `whoCouldHave`, and inspect the live board topology."

---

### Act 8: The Verdict Inquest & Closing (2:50 – 3:00)
* **Screen:** Switch back to browser, click **File Accusation**. Select Clara and Tobias, submit.
* **Action:** The **Case Closed** inquest screen animates in: Step-by-Step Replay highlighting the path, 3 Brass Stars, and the revealed Syndicate Archive clue.
* **Voiceover:**
  > "When we file our accusation, the graph validates our deduction against ground truth, awarding stars and revealing the Season 1 syndicate clue.
  > Original mysteries, zero hallucination, strict information barriers, and deductions that carry their graph proof.
  > Built on **FalkorDB** by **Team Subaru Boys**. Thank you!"

---

## 🎯 Tips for the Recording Session

1. **Energy & Tone:** Confident, deliberate, crisp. Keep the pace moving; don't linger on loading screens.
2. **Cursor Movement:** Use smooth, intentional mouse moves. Hover over key tags like `CONTRADICTION`, `REHEARSED`, and `FEASIBLE`.
3. **If You Make a Mistake:** Don't restart the whole recording! Pause for 2 seconds, re-read the sentence from the start of the act, and edit it in post.
4. **Offline Mode:** The script runs identically with `ALIBI_LLM=off` or with a live Gemini key.
