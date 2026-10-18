import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const OUTPUT_HTML = path.join(ROOT_DIR, 'docs', 'demo-guide.html');
const OUTPUT_PDF = path.join(ROOT_DIR, 'docs', 'Alibi-Demo-Video-Guide.pdf');
const COPY_ROOT_PDF = path.join(ROOT_DIR, 'Alibi-Demo-Video-Guide.pdf');

function getBase64Image(relPath, mime = 'image/jpeg') {
  try {
    const fullPath = path.join(ROOT_DIR, relPath);
    if (fs.existsSync(fullPath)) {
      const data = fs.readFileSync(fullPath).toString('base64');
      return `data:${mime};base64,${data}`;
    }
  } catch (err) {
    console.warn(`Could not load ${relPath}:`, err.message);
  }
  return '';
}

const logoBase64 = getBase64Image('public/alibi-logo.jpg', 'image/jpeg');
const deeAvatar = getBase64Image('public/avatars/dee.svg', 'image/svg+xml');
const kofiAvatar = getBase64Image('public/avatars/kofi.svg', 'image/svg+xml');
const hanaAvatar = getBase64Image('public/avatars/hana.svg', 'image/svg+xml');
const okoyeAvatar = getBase64Image('public/avatars/okoye.svg', 'image/svg+xml');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Alibi — Video Demonstration Guide</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=JetBrains+Mono:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 10mm 12mm 10mm 12mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background-color: #0c0e12;
      color: #e2e4e9;
      line-height: 1.4;
      font-size: 10pt;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      page-break-after: always;
      break-after: page;
      height: 275mm;
      max-height: 275mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }

    .page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    /* Header styling */
    .header-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #c5a059;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .brand-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1.5px solid #c5a059;
      object-fit: cover;
    }

    .brand-title {
      font-family: 'Cinzel', serif;
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: 2px;
      color: #c5a059;
      line-height: 1;
    }

    .brand-subtitle {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      color: #9ba1b0;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      margin-top: 2px;
    }

    .meta-badge-group {
      text-align: right;
    }

    .track-badge {
      display: inline-block;
      background: rgba(197, 160, 89, 0.15);
      border: 1px solid rgba(197, 160, 89, 0.5);
      color: #c5a059;
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 9999px;
      text-transform: uppercase;
    }

    .duration-badge {
      display: block;
      font-size: 7.5pt;
      color: #717786;
      font-family: 'JetBrains Mono', monospace;
      margin-top: 3px;
    }

    /* Section Cards */
    .section-card {
      background: #14171f;
      border: 1px solid #232834;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 10px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      padding-bottom: 4px;
    }

    .section-title {
      font-family: 'Cinzel', serif;
      font-size: 11.5pt;
      font-weight: 700;
      color: #ffffff;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .timestamp-pill {
      background: #c5a059;
      color: #0c0e12;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
    }

    /* Cue blocks */
    .action-box {
      background: #1c202a;
      border-left: 3px solid #60a5fa;
      padding: 5px 8px;
      border-radius: 0 5px 5px 0;
      font-size: 8.5pt;
      color: #93c5fd;
      margin-bottom: 6px;
      display: flex;
      align-items: flex-start;
      gap: 6px;
    }

    .action-label {
      font-weight: 700;
      text-transform: uppercase;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      background: rgba(96, 165, 250, 0.2);
      padding: 1px 4px;
      border-radius: 3px;
      margin-right: 2px;
      flex-shrink: 0;
    }

    .speech-box {
      background: rgba(197, 160, 89, 0.06);
      border-left: 3px solid #c5a059;
      padding: 6px 10px;
      border-radius: 0 5px 5px 0;
      margin-bottom: 6px;
    }

    .speech-label {
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      font-weight: 700;
      color: #c5a059;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
      display: block;
    }

    .speech-text {
      font-size: 9.5pt;
      color: #f1f2f5;
      line-height: 1.38;
      font-weight: 400;
    }

    .speech-highlight {
      color: #c5a059;
      font-weight: 600;
    }

    .speech-contradiction {
      color: #f87171;
      font-weight: 600;
    }

    .speech-clearance {
      color: #4ade80;
      font-weight: 600;
    }

    /* Cypher Snippets */
    .cypher-box {
      background: #090a0d;
      border: 1px solid #282d3c;
      border-radius: 5px;
      padding: 6px 8px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7.5pt;
      color: #38bdf8;
      margin-top: 4px;
      margin-bottom: 4px;
      line-height: 1.3;
    }

    .cypher-keyword { color: #f59e0b; font-weight: 700; }
    .cypher-var { color: #e2e8f0; }
    .cypher-type { color: #a78bfa; }

    /* Grid columns */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .checklist-card {
      background: #14171f;
      border: 1px solid #232834;
      border-radius: 6px;
      padding: 8px 10px;
    }

    .checklist-title {
      font-family: 'Cinzel', serif;
      font-size: 9.5pt;
      font-weight: 700;
      color: #c5a059;
      margin-bottom: 4px;
    }

    .checklist-item {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 8pt;
      color: #cbd5e1;
      margin-bottom: 3px;
    }

    .check-bullet { color: #4ade80; font-weight: bold; }

    /* Footer */
    .page-footer {
      border-top: 1px solid #232834;
      padding-top: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: 'JetBrains Mono', monospace;
      font-size: 7pt;
      color: #64748b;
      margin-top: auto;
    }

    .suspect-avatars {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 4px 0;
    }

    .avatar-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #1c202a;
      border: 1px solid #2d3444;
      border-radius: 9999px;
      padding: 2px 6px;
      font-size: 7.5pt;
    }

    .avatar-img {
      width: 14px;
      height: 14px;
      border-radius: 50%;
    }
  </style>
</head>
<body>

  <!-- ==================== PAGE 1 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-group">
          ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Alibi Logo">` : ''}
          <div>
            <div class="brand-title">ALIBI</div>
            <div class="brand-subtitle">Track 01: Agents That Act on Connected Data · Official Video Script</div>
          </div>
        </div>
        <div class="meta-badge-group">
          <span class="track-badge">Track 01 · FalkorDB</span>
          <span class="duration-badge">⏱ Target: 5m 30s · Team Subaru Boys</span>
        </div>
      </div>

      <!-- Core Thesis -->
      <div class="section-card" style="border-left: 3px solid #c5a059;">
        <div style="font-family: 'Cinzel', serif; font-size: 10.5pt; font-weight: 700; color: #c5a059; margin-bottom: 2px;">
          The Track 01 Thesis: "The Graph Does Real Work"
        </div>
        <p style="font-size: 8.5pt; color: #94a3b8; line-height: 1.4;">
          Traditional LLMs hallucinate facts, flatter players, and forget spatial rules. In <strong>Alibi</strong>, the LLM <em>never</em> decides what is true or solves the murder. Suspects speak through an AI Firewall bound strictly to authored claims. Every statement, keycard swipe, and receipt dynamically builds a tenant knowledge graph in <strong>FalkorDB</strong>. Our autonomous AI Inspector agent executes graph traversal queries to expose contradictions, impossible moves, and rehearsed alibis.
        </p>
      </div>

      <!-- Pre-Flight Checklist -->
      <div class="grid-2" style="margin-bottom: 10px;">
        <div class="checklist-card">
          <div class="checklist-title">⚙️ Recording Setup</div>
          <div class="checklist-item"><span class="check-bullet">✓</span> App running on <code>http://localhost:3001</code></div>
          <div class="checklist-item"><span class="check-bullet">✓</span> FalkorDB Browser ready on <code>http://localhost:3000</code></div>
          <div class="checklist-item"><span class="check-bullet">✓</span> Screen resolution set to 1080p (1920x1080)</div>
          <div class="checklist-item"><span class="check-bullet">✓</span> Clear audio; steady, enthusiastic pacing</div>
        </div>
        <div class="checklist-card">
          <div class="checklist-title">🎯 Judge Evaluation Criteria</div>
          <div class="checklist-item"><span class="check-bullet">✓</span> Information Barrier: <code>truth:*</code> isolated from <code>play:*</code></div>
          <div class="checklist-item"><span class="check-bullet">✓</span> Pocket Graph: Live interactive Cypher proofs</div>
          <div class="checklist-item"><span class="check-bullet">✓</span> Autonomous AI Inspector calling graph tools</div>
          <div class="checklist-item"><span class="check-bullet">✓</span> Sub-millisecond OpenCypher traversal demonstration</div>
        </div>
      </div>

      <!-- Scene 1 -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">
            <span>🎬 Scene 1: Introduction & The Core Thesis</span>
          </div>
          <span class="timestamp-pill">0:00 – 0:40 (40s)</span>
        </div>
        <div class="action-box">
          <span class="action-label">SCREEN</span>
          <span>Start on the <strong>Home Page</strong> (<code>http://localhost:3001</code>). Show hero title <em>"Every lie leaves a path."</em> Hover gently over Track 01 banner.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Hi everyone, I'm presenting <strong>Alibi</strong>—a detective game built for Track 01: <em>Agents That Act on Connected Data</em>.<br><br>
            In traditional AI games, large language models hallucinate, lose spatial consistency, and invent whatever pleases the player. In <strong>Alibi</strong>, we flipped the script: <span class="speech-highlight">The LLM does NOT decide what is true, and it does NOT solve the mystery. FalkorDB does.</span><br><br>
            Suspects speak through an AI firewall bound strictly to authored claims. Every statement, witness sighting, and physical exhibit dynamically constructs a connected knowledge graph in FalkorDB. Let's jump into <strong>Case 0</strong> to see how this works in real time."
          </p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>ALIBI · Track 01 Video Demo Script</span>
      <span>Page 1 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 2 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-group">
          ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Alibi Logo">` : ''}
          <div>
            <div class="brand-title">ALIBI</div>
            <div class="brand-subtitle">Scene 2: Case 0 Guided Induction Walkthrough</div>
          </div>
        </div>
        <div class="meta-badge-group">
          <span class="timestamp-pill">0:40 – 1:35 (55s)</span>
        </div>
      </div>

      <!-- Scene 2: Steps 1-2 -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">Step 1 & 2: Inspect Dee & Interrogate for Alibi</div>
          <span class="timestamp-pill">0:40 – 1:05</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>"Play Case 0 (Guided Walkthrough)"</strong> on home page. Step 1 modal opens. Click <strong>"Show Me Dee →"</strong>. Click <strong>Dee</strong> in the left dossier.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "We begin with our interactive induction walkthrough. The modal explains that all suspect nodes start in a clean slate in FalkorDB.<br>
            A visual spotlight guides us to inspect our first suspect, Dee. In Step 2, we interrogate her. Every question writes a live <code>(:CLAIMED)</code> relationship into FalkorDB."
          </p>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>"Guide Me to Question →"</strong>. Click glowing lead button: <strong>"Where were you at 8:20?"</strong>.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Dee claims she was in the Green Room at 8:20. Watch our docked Pocket Graph at the bottom—it immediately creates a connected edge to the Green Room!"
          </p>
        </div>
      </div>

      <!-- Scene 2: Steps 3-5 -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">Step 3, 4 & 5: Scene Evidence, Pocket Graph & Accusation</div>
          <span class="timestamp-pill">1:05 – 1:35</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Step 3 modal opens. Click <strong>"Guide Me to Search Prop Store →"</strong>. Click <strong>Search</strong> on Prop Store in left panel. Close Search modal.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Physical evidence cannot lie. Ground truth exhibits write immutable <code>(:Anchor)</code> nodes. We search the murder scene: the Prop Store. The keycard reader log reveals three cards entered by 8:20."
          </p>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Step 4 modal opens. Click <strong>"Inspect Pocket Graph →"</strong>. Point cursor to red contradiction ray and green clearance shield!</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "FalkorDB executed Query Q60 in real time! Look at the Pocket Graph below: a <span class="speech-contradiction">bright red contradiction line</span> connects Dee's Green Room claim to the Prop Store keycard log. Meanwhile, Mr. Okoye in the Box Office gets a <span class="speech-clearance">green clearance shield</span>."
          </p>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>"Accuse Dee →"</strong> on bottom beacon. Step 5 opens. Click <strong>"Take Me to Accuse →"</strong>. Confirm accusation.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "We file the indictment and achieve a flawless conviction. That's the induction loop—now let's tackle the full mystery!"
          </p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>ALIBI · Track 01 Video Demo Script</span>
      <span>Page 2 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 3 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-group">
          ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Alibi Logo">` : ''}
          <div>
            <div class="brand-title">ALIBI</div>
            <div class="brand-subtitle">Scene 3: Case 1 — A Quiet Pact (The Full Investigation)</div>
          </div>
        </div>
        <div class="meta-badge-group">
          <span class="timestamp-pill">1:35 – 2:40</span>
        </div>
      </div>

      <!-- Case 1 Briefing & Cast -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">The Case Briefing & Playhouse Cast</div>
          <span class="timestamp-pill">1:35 – 2:00</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>"Start Case 1"</strong> or open Case 1 from <code>/season/1</code>. Briefing modal opens automatically.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Welcome to <strong>Case 1: A Quiet Pact</strong>. Walter, director of the Grand Playhouse, was bludgeoned to death in the Prop Store between 8:00 and 8:40.<br>
            We have 4 suspects: Dee, lead actress; Kofi, stage manager; Hana, costume designer; and Mr. Okoye, box-office manager."
          </p>
        </div>
        <div class="suspect-avatars">
          <div class="avatar-chip">${deeAvatar ? `<img src="${deeAvatar}" class="avatar-img">` : ''} Dee (Actress)</div>
          <div class="avatar-chip">${kofiAvatar ? `<img src="${kofiAvatar}" class="avatar-img">` : ''} Kofi (Stage Mgr)</div>
          <div class="avatar-chip">${hanaAvatar ? `<img src="${hanaAvatar}" class="avatar-img">` : ''} Hana (Costume)</div>
          <div class="avatar-chip">${okoyeAvatar ? `<img src="${okoyeAvatar}" class="avatar-img">` : ''} Okoye (Box Office)</div>
        </div>
      </div>

      <!-- Interrogating Suspects & Rehearsed Alibi -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">Interrogation & FalkorDB Q61 Rehearsed Alibi Detection</div>
          <span class="timestamp-pill">2:00 – 2:40</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Close Briefing. Select Dee &rarr; click <strong>"Where were you at 8:20?"</strong>. Select Kofi &rarr; ask 8:20. Select Hana &rarr; ask 8:20.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Let's interrogate Dee. She claims she was in the Green Room with Kofi and Hana, noting <em>'the interval bell rang twice. I remember counting.'</em><br><br>
            Now let's question Kofi and Hana—they repeat the <span class="speech-highlight">exact same curious phrase</span>.<br><br>
            Behind the scenes, FalkorDB executes Query Q61—detecting an authored <span class="speech-highlight">Rehearsed Alibi cluster</span> between all three suspects!"
          </p>
        </div>
        <div class="cypher-box">
          <span class="cypher-keyword">MATCH</span> (s:<span class="cypher-type">Statement</span> {kind: 'location'}) <span class="cypher-keyword">WHERE</span> s.detail &lt;&gt; ''<br>
          <span class="cypher-keyword">WITH</span> s.slot <span class="cypher-keyword">AS</span> slot, s.room <span class="cypher-keyword">AS</span> room, s.detail <span class="cypher-keyword">AS</span> detail, collect(DISTINCT s.by) <span class="cypher-keyword">AS</span> people<br>
          <span class="cypher-keyword">WHERE</span> size(people) &gt;= 2 <span class="cypher-keyword">RETURN</span> people, detail
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>ALIBI · Track 01 Video Demo Script</span>
      <span>Page 3 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 4 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-group">
          ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Alibi Logo">` : ''}
          <div>
            <div class="brand-title">ALIBI</div>
            <div class="brand-subtitle">Scene 3 (Cont.): Evidence, Tabs, Inspector & Verdict</div>
          </div>
        </div>
        <div class="meta-badge-group">
          <span class="timestamp-pill">2:40 – 4:15</span>
        </div>
      </div>

      <!-- Physical Evidence & Pocket Graph Inspector -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">Scene Evidence & Pocket Graph Cypher Inspector</div>
          <span class="timestamp-pill">2:40 – 3:15</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>Search on Prop Store</strong> (Door Log found). Click <strong>Search on Box Office</strong> (Till Receipts found). Close modal.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Now we search for exhibits. The Prop Store door log proves Dee, Kofi, AND Hana entered the crime scene at 8:20. Meanwhile, the Box Office till receipts prove Mr. Okoye was at the cash register at 8:00 and 8:40."
          </p>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>Dee</strong> node on the docked Pocket Graph. Click <strong>"Show Cypher Proof"</strong> in the drawer.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Look at our Pocket Graph! Dee, Kofi, and Hana are all wrapped in <span class="speech-contradiction">red contradiction rays</span>. Mr. Okoye has a <span class="speech-clearance">green clearance shield</span>.<br>
            If we click Dee, the inspector displays plain-English deduction—and we can expand the <span class="speech-highlight">Live FalkorDB Cypher Proof</span> right in the client!"
          </p>
        </div>
      </div>

      <!-- Tabs, AI Inspector, and Verdict -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">Analytical Tabs, AI Inspector & Perfect Conviction</div>
          <span class="timestamp-pill">3:15 – 3:45</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>Timeline Tab</strong> &rarr; click <strong>Board Tab</strong> &rarr; click <strong>Inspector Tab</strong> &rarr; click <strong>"Run Analysis"</strong>.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Let's explore the analytical tabs. The <strong>Timeline Grid</strong> plots statements against hard anchors. The <strong>Evidence Board</strong> renders an interactive XYFlow canvas connected with red yarn threads.<br>
            And the <strong>AI Inspector</strong> is our autonomous copilot. It doesn't hallucinate; it executes graph traversal tools over our live FalkorDB graph, automatically writing verified Flags and Hypotheses onto our board."
          </p>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>Accuse</strong> in header. Select <strong>Dee, Kofi, and Hana</strong>. Submit indictment. Show Verdict screen.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Graph math proves Dee, Kofi, and Hana formed a conspiracy. We accuse all three and submit.<br>
            <span class="speech-highlight">Perfect 3-star conviction!</span> The verdict evaluates against the isolated truth graph, and the execution trace confirms zero information barrier leaks."
          </p>
        </div>
      </div>

      <!-- Scene 4: Season Scope -->
      <div class="section-card">
        <div class="section-header">
          <div class="section-title">🎬 Scene 4: Season Scope & The Bait Mechanic</div>
          <span class="timestamp-pill">3:45 – 4:15 (30s)</span>
        </div>
        <div class="action-box">
          <span class="action-label">ACTION</span>
          <span>Click <strong>"Back to Season 1"</strong> in header. Point cursor to Case 2 & Case 3.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Season 1 includes two more elaborate cases: <strong>Case 2: The Stopped Watch</strong>, requiring multi-hop physical room traversal across estate topologies; and <strong>Case 3: The Blackout Dinner</strong>, where suspects hold silent pacts.<br>
            Here players use our <span class="speech-highlight">Bait Mechanic</span>—dropping discovered physical items into interrogation to pressure suspects into revealing new corroborating graph nodes."
          </p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>ALIBI · Track 01 Video Demo Script</span>
      <span>Page 4 of 5</span>
    </div>
  </div>

  <!-- ==================== PAGE 5 ==================== -->
  <div class="page">
    <div class="page-content">
      <div class="header-bar">
        <div class="brand-group">
          ${logoBase64 ? `<img src="${logoBase64}" class="brand-logo" alt="Alibi Logo">` : ''}
          <div>
            <div class="brand-title">ALIBI</div>
            <div class="brand-subtitle">Scene 5: FalkorDB Deep Dive & Live Cypher Queries</div>
          </div>
        </div>
        <div class="meta-badge-group">
          <span class="timestamp-pill">4:15 – 5:30 (1m 15s)</span>
        </div>
      </div>

      <!-- FalkorDB Deep Dive -->
      <div class="section-card" style="border: 2px solid #c5a059;">
        <div class="section-header">
          <div class="section-title" style="color: #c5a059;">
            <span>🎬 Scene 5: FalkorDB Browser Deep Dive (The Secret Weapon)</span>
          </div>
          <span class="timestamp-pill">4:15 – 5:30</span>
        </div>
        <div class="action-box">
          <span class="action-label">SCREEN</span>
          <span>Switch tab to <strong>FalkorDB Browser</strong> at <code>http://localhost:3000</code>. Point cursor to left sidebar graph list.</span>
        </div>
        <div class="speech-box">
          <span class="speech-label">SPOKEN SCRIPT:</span>
          <p class="speech-text">
            "Now let's inspect the connected data structure in FalkorDB Browser. Notice our strict architectural <span class="speech-highlight">Information Barrier</span>:<br>
            <code>truth:l1-quiet-pact</code> stores the hidden ground truth that only search and verdicts can read.<br>
            <code>play:demo:l1-quiet-pact</code> is the player graph where statements and exhibits accumulate. Zero spoilers can ever leak."
          </p>
        </div>

        <div style="font-size: 8pt; font-weight: 700; color: #c5a059; margin-top: 4px;">1. Visual Schema Overview:</div>
        <div class="cypher-box">
          <span class="cypher-keyword">MATCH</span> (n) <span class="cypher-keyword">RETURN</span> n <span class="cypher-keyword">LIMIT</span> 40
        </div>
        <div class="speech-box" style="margin-bottom: 4px;">
          <p class="speech-text">
            "Running a simple MATCH displays our live graph: <code>(:Person)</code> nodes connect via <code>[:CLAIMED]</code> to statements, and physical evidence forms <code>(:Anchor)</code> nodes linked to room topologies."
          </p>
        </div>

        <div style="font-size: 8pt; font-weight: 700; color: #f87171; margin-top: 4px;">2. Core Contradiction Cypher (Q60):</div>
        <div class="cypher-box">
          <span class="cypher-keyword">MATCH</span> (s:<span class="cypher-type">Statement</span>)-[:<span class="cypher-type">AT_TIME</span>]->(t), (a:<span class="cypher-type">Anchor</span>)-[:<span class="cypher-type">AT_TIME</span>]->(t)<br>
          <span class="cypher-keyword">WHERE</span> s.subject = a.subject <span class="cypher-keyword">AND</span> s.room &lt;&gt; a.room<br>
          <span class="cypher-keyword">RETURN</span> s.by <span class="cypher-keyword">AS</span> suspect, s.room <span class="cypher-keyword">AS</span> claimed, a.room <span class="cypher-keyword">AS</span> actual, t.slot <span class="cypher-keyword">AS</span> slot
        </div>
        <div class="speech-box" style="margin-bottom: 4px;">
          <p class="speech-text">
            "Here is query <strong>Q60</strong>. In sub-millisecond execution, FalkorDB returns Dee, Kofi, and Hana claiming the Green Room while the keycard anchor proves they entered the Prop Store. Pure, deterministic graph math!"
          </p>
        </div>

        <div style="font-size: 8pt; font-weight: 700; color: #4ade80; margin-top: 4px;">3. Room Connectivity & Journey Feasibility:</div>
        <div class="cypher-box">
          <span class="cypher-keyword">MATCH</span> path = (r1:<span class="cypher-type">Room</span> {id: <span class="cypher-var">"box_office"</span>})-[:<span class="cypher-type">CONNECTED_TO</span>*1..3]-(r2:<span class="cypher-type">Room</span> {id: <span class="cypher-var">"prop_store"</span>})<br>
          <span class="cypher-keyword">RETURN</span> path
        </div>
        <div class="speech-box">
          <p class="speech-text">
            "And here is our room topology path, proving Mr. Okoye in the Box Office was physically separated from the crime scene, giving him a mathematically verified alibi.<br><br>
            <span class="speech-highlight">This is Alibi: bringing connected data, deterministic reasoning, and AI agents together on FalkorDB. Thank you!</span>"
          </p>
        </div>
      </div>
    </div>

    <div class="page-footer">
      <span>ALIBI · Track 01 Video Demo Script</span>
      <span>Page 5 of 5</span>
    </div>
  </div>

</body>
</html>`;

fs.writeFileSync(OUTPUT_HTML, htmlContent, 'utf8');
console.log('Generated HTML at:', OUTPUT_HTML);

// Execute google-chrome to render PDF without header/footer
try {
  const chromeCmd = `google-chrome --headless --disable-gpu --no-sandbox --no-pdf-header-footer --print-to-pdf="${OUTPUT_PDF}" "${OUTPUT_HTML}"`;
  console.log('Running Chrome PDF generator...');
  execSync(chromeCmd, { stdio: 'inherit' });
  console.log('Successfully generated PDF at:', OUTPUT_PDF);

  fs.copyFileSync(OUTPUT_PDF, COPY_ROOT_PDF);
  console.log('Copied PDF to workspace root at:', COPY_ROOT_PDF);
} catch (err) {
  console.error('Error generating PDF:', err.message);
  process.exit(1);
}
