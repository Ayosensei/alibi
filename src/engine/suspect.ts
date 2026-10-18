import type { CaseType } from './schema';

export interface SuspectClaim {
  id: string;
  by: string;
  kind: string;
  subject?: string;
  slot?: number;
  room?: string;
  detail?: string;
  relationId?: string;
  text: string;
  priority?: number;
}

export function buildForbiddenKeywords(
  caseData: CaseType,
  allowedClaims: SuspectClaim[],
  questionText: string,
  suspectId: string
): string[] {
  const allowedCorpus = [
    ...allowedClaims.map((c) => c.text),
    questionText,
    caseData.people.find((p) => p.id === suspectId)?.name ?? '',
    caseData.people.find((p) => p.id === suspectId)?.role ?? '',
  ]
    .join(' ')
    .toLowerCase();

  const isAllowed = (term: string): boolean => {
    if (!term || term.trim().length === 0) return true;
    const cleanTerm = term.toLowerCase().trim();
    // Check if the term appears in the allowed corpus as a whole phrase/word
    return allowedCorpus.includes(cleanTerm);
  };

  const forbidden: Set<string> = new Set();

  // 1. Person names
  for (const p of caseData.people) {
    if (!isAllowed(p.name)) {
      forbidden.add(p.name);
      // Also add individual parts of name (e.g. "Imani", "Okafor", "Walter")
      for (const part of p.name.split(/\s+/)) {
        const clean = part.replace(/[^a-zA-Z]/g, '');
        if (clean.length > 2 && !isAllowed(clean)) {
          forbidden.add(clean);
        }
      }
    }
  }

  // 2. Room names
  for (const r of caseData.rooms) {
    if (!isAllowed(r.name)) {
      forbidden.add(r.name);
      for (const part of r.name.split(/\s+/)) {
        const clean = part.replace(/[^a-zA-Z]/g, '');
        if (clean.length > 3 && !isAllowed(clean)) {
          forbidden.add(clean);
        }
      }
    }
  }

  // 3. Evidence titles & weapon
  if (caseData.truth?.murder?.weapon && !isAllowed(caseData.truth.murder.weapon)) {
    forbidden.add(caseData.truth.murder.weapon);
  }

  for (const e of caseData.evidence) {
    if (!isAllowed(e.title)) {
      forbidden.add(e.title);
    }
  }

  return Array.from(forbidden);
}

export function buildSuspectPrompt(
  suspectName: string,
  suspectRole: string,
  suspectPersona: string,
  victimName: string,
  claims: SuspectClaim[],
  isRetry = false
): string {
  const claimLines = claims.map((c) => `- [${c.id}] ${c.text}`).join('\n');

  let prompt = `You are ${suspectName}, ${suspectRole}. ${suspectPersona}
You are being questioned by the Consultant about the night ${victimName} died. Reply in character in at most 40 words.
Say ONLY what the following statements say, in your own voice. Do not add facts, names, places or times. Do not confess.
STATEMENTS TO CONVEY (ids and meaning):
${claimLines}
Return JSON: {"reply": string, "claimIds": string[]}`;

  if (isRetry) {
    prompt += `\n\nIMPORTANT: Your previous reply contained unauthorized information or exceeded restrictions.
Stick STRICTLY and ONLY to the exact facts in the statements above. Do not mention any other rooms, people, or details. Keep under 40 words.`;
  }

  return prompt;
}

export function getBrushOff(suspectName: string, persona: string): string {
  return `I have already told you everything I know on that matter.`;
}

export function buildNegativeDialoguePrompt(
  suspectName: string,
  suspectRole: string,
  suspectPersona: string,
  questionContext: string,
  templateText: string
): string {
  return `You are ${suspectName}, ${suspectRole}. ${suspectPersona}
You are being questioned by the Consultant: "${questionContext}".
You have nothing suspicious, unusual, or new to report regarding this inquiry.
Say the following in your own natural character voice in under 35 words. Do NOT add any room names, do NOT mention any murder weapons, and do NOT confess or make accusations:
"${templateText}"
Return JSON: {"reply": string, "claimIds": []}`;
}
