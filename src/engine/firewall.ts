export interface FirewallResult {
  passed: boolean;
  violations: string[];
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function validateFirewall(
  reply: string,
  claimIds: string[],
  allowedClaimIds: string[],
  forbiddenKeywords: string[]
): FirewallResult {
  const violations: string[] = [];

  // 1. Length and non-empty check
  const words = reply.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    violations.push('Reply cannot be empty');
  } else if (words.length > 60) {
    violations.push(`Reply exceeds 60 words (found ${words.length})`);
  }

  // 2. Claim ID subset check
  const allowedSet = new Set(allowedClaimIds);
  for (const cid of claimIds) {
    if (!allowedSet.has(cid)) {
      violations.push(`Unauthorized claim id: "${cid}"`);
    }
  }

  // 3. Forbidden keywords check (whole-word, case-insensitive)
  for (const kw of forbiddenKeywords) {
    if (!kw || kw.trim().length === 0) continue;
    const regex = new RegExp(`\\b${escapeRegExp(kw.trim())}\\b`, 'i');
    if (regex.test(reply)) {
      violations.push(`Forbidden keyword detected: "${kw}"`);
    }
  }

  return {
    passed: violations.length === 0,
    violations,
  };
}
