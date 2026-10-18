import type { CaseType } from './schema';

export interface DialogueContext {
  caseData: CaseType;
  suspectId: string;
  topic: string;
  slot?: number;
  about?: string;
  isAlreadyAsked: boolean;
  isLockedByEvidence: boolean;
}

// Custom in-character responses for routine slots, sightings, motives, and deflections
const DIALOGUE_DATA: Record<
  string,
  {
    routineTime: (timeStr: string, slot: number) => string;
    noSighting: (targetName: string, timeStr: string) => string;
    lockedClaim: () => string;
    noConflict: (victimName: string) => string;
    general: () => string;
    alreadyAnswered: () => string;
  }
> = {
  // === CASE 1: The Quiet Pact ===
  dee: {
    routineTime: (timeStr) =>
      `At ${timeStr}? Rehearsals hadn't even started yet. I was in the production office alone reviewing stage cue sheets.`,
    noSighting: (targetName, timeStr) =>
      `I didn't cross paths with ${targetName} at ${timeStr}. If they were nearby, I certainly didn't notice them.`,
    lockedClaim: () =>
      `I have nothing further to disclose on that matter until you present concrete evidence.`,
    noConflict: (victimName) =>
      `${victimName} was demanding, but he kept the theatre open. We clashed over budgets, but nothing beyond ordinary business.`,
    general: () =>
      `I've recounted the events as clearly as possible. We need to find whoever did this and let the company finish the run.`,
    alreadyAnswered: () =>
      `As I told you earlier, I have already told you everything I know on that matter.`,
  },
  kofi: {
    routineTime: (timeStr) =>
      `Around ${timeStr}? Just setting up the control board and checking dimmer channels. Nothing strange happened then.`,
    noSighting: (targetName, timeStr) =>
      `Didn't see ${targetName} around ${timeStr}. I had my eyes on the lighting rig the whole time.`,
    lockedClaim: () =>
      `Look, I'm not speculating on anything else without seeing some actual proof.`,
    noConflict: (victimName) =>
      `${victimName} gave me my start here. We had our disagreements over equipment, but I respected him.`,
    general: () =>
      `That covers my whole evening. I hope whatever notes you're taking help sort this mess out.`,
    alreadyAnswered: () =>
      `Like I mentioned before, I have already told you everything I know on that matter.`,
  },
  hana: {
    routineTime: (timeStr) =>
      `Around ${timeStr}? I was in the workshop sorting timber. Nobody came by.`,
    noSighting: (targetName, timeStr) =>
      `I didn't see ${targetName} at ${timeStr}. I was focused on my work.`,
    lockedClaim: () =>
      `I don't know what you're implying, and I don't answer guesses without proof.`,
    noConflict: (victimName) =>
      `I only spoke with ${victimName} when getting materials approved. He was distant, but fair enough.`,
    general: () =>
      `I've shared everything I noticed. I'd rather not talk about this anymore.`,
    alreadyAnswered: () =>
      `I have already told you everything I know on that matter. Please don't ask again.`,
  },
  okoye: {
    routineTime: (timeStr) =>
      `At ${timeStr}? I was at the box office counters balancing the afternoon ticket sales. Everything was strictly in order.`,
    noSighting: (targetName, timeStr) =>
      `I did not see ${targetName} at ${timeStr}. Our paths did not cross during that period.`,
    lockedClaim: () =>
      `I cannot discuss confidential box-office matters without verified documentation.`,
    noConflict: (victimName) =>
      `${victimName} was an acquaintance and patron. Our relationship was strictly professional; I had no grievance with him.`,
    general: () =>
      `My accounts are accurate and complete. If you require further clarification, consult the ledger.`,
    alreadyAnswered: () =>
      `As I previously explained, I have already told you everything I know on that matter.`,
  },

  // === CASE 2: The Stopped Watch ===
  beatrix: {
    routineTime: (timeStr) =>
      `At ${timeStr}, I was occupied with cataloguing notes in the lower gallery. There were no disruptions.`,
    noSighting: (targetName, timeStr) =>
      `I did not observe ${targetName} at ${timeStr}. My attention was entirely on the lot entries.`,
    lockedClaim: () =>
      `I am not in the habit of entertaining idle speculation without physical documentation.`,
    noConflict: (victimName) =>
      `${victimName} was a discerning collector. Our dealings were strictly professional cataloguing and valuation.`,
    general: () =>
      `I have detailed everything relevant to tonight's auction. The rest is routine house management.`,
    alreadyAnswered: () =>
      `As I have already told you, my previous statement covers everything I know on that matter.`,
  },
  dorian: {
    routineTime: (timeStr) =>
      `Around ${timeStr}? Admiring the vintage glassware and having a quiet smoke. Quite dull until the drama began.`,
    noSighting: (targetName, timeStr) =>
      `No sign of ${targetName} at ${timeStr}. And believe me, I would certainly have remembered.`,
    lockedClaim: () =>
      `A tantalising theory, Detective, but produce some evidence before expecting a confession.`,
    noConflict: (victimName) =>
      `${victimName} and I were fierce rivals at auction, certainly, but murder is terribly vulgar for business.`,
    general: () =>
      `You've extracted every amusing scrap I have to offer. Go interrogate someone less interesting.`,
    alreadyAnswered: () =>
      `I have already told you everything I know on that matter, Detective. Do keep up.`,
  },
  rufus: {
    routineTime: (timeStr) =>
      `At ${timeStr}? Hauling packing crates out by the back alleyway. Same as any other night.`,
    noSighting: (targetName, timeStr) =>
      `Didn't see ${targetName} then. I don't keep tabs on who wanders through the hall.`,
    lockedClaim: () =>
      `I'm not saying another word about who was coming and going until you show me what you've actually got.`,
    noConflict: (victimName) =>
      `The boss paid my wages on time. I kept my head down and carried his heavy antiques.`,
    general: () =>
      `Told you what I know. Now let me get back to the crates.`,
    alreadyAnswered: () =>
      `I already told you everything I know on that matter, mate. Stop badgering me.`,
  },
  imogen: {
    routineTime: (timeStr) =>
      `At ${timeStr}, I was reviewing reserve prices in the reception office. Nothing was amiss.`,
    noSighting: (targetName, timeStr) =>
      `I did not see ${targetName} around ${timeStr}. The house was busy, but we didn't meet.`,
    lockedClaim: () =>
      `I must protect our consignors' confidentiality unless presented with formal proof.`,
    noConflict: (victimName) =>
      `${victimName} was our most esteemed client. His passing is a catastrophic tragedy for the house.`,
    general: () =>
      `Those are all the facts I can provide. Please ensure this inquiry is conducted with discretion.`,
    alreadyAnswered: () =>
      `As I stated earlier, I have already told you everything I know on that matter.`,
  },

  // === CASE 3: The Blackout Dinner ===
  clara: {
    routineTime: (timeStr) =>
      `At ${timeStr}, I was reviewing the estate's quarterly balance sheets in the private library.`,
    noSighting: (targetName, timeStr) =>
      `I had no interaction with ${targetName} at ${timeStr}. Our paths did not cross.`,
    lockedClaim: () =>
      `I don't respond to baseless inferences. Show me the documentation first.`,
    noConflict: (victimName) =>
      `My father and I had disagreements on company strategy, of course, but family is family.`,
    general: () =>
      `Those are all the verifiable details I possess. The board will require an update soon.`,
    alreadyAnswered: () =>
      `I have already told you everything I know on that matter, Inspector.`,
  },
  tobias: {
    routineTime: (timeStr) =>
      `At ${timeStr}? I was checking catering receipts and account ledgers in the small parlour.`,
    noSighting: (targetName, timeStr) =>
      `No, I... I did not see ${targetName} around ${timeStr}. I was alone with the books.`,
    lockedClaim: () =>
      `I... I would prefer not to discuss private accounts without seeing the records you are referencing.`,
    noConflict: (victimName) =>
      `${victimName} was a strict employer, but always fair with my salary. I had no reason to wish him harm.`,
    general: () =>
      `That is... that is truly all I know, Inspector. I swear it.`,
    alreadyAnswered: () =>
      `I have already told you everything I know on that matter, sir. Truly.`,
  },
  roz: {
    routineTime: (timeStr) =>
      `Around ${timeStr}? Freshening up and seeing to dinner preparations. Nothing scandalous, I assure you.`,
    noSighting: (targetName, timeStr) =>
      `I didn't run into ${targetName} at ${timeStr}, darling. I was mingling elsewhere.`,
    lockedClaim: () =>
      `Why would I share my private affairs without cause? If you suspect something, prove it first.`,
    noConflict: (victimName) =>
      `${victimName} gave me everything. We had our rows, like any married couple, but I cared for him deeply.`,
    general: () =>
      `You have picked my memory clean, darling. Now go catch the monster who did this.`,
    alreadyAnswered: () =>
      `As I already told you, darling, I've shared everything I know on that matter.`,
  },
  imani: {
    routineTime: (timeStr) =>
      `At ${timeStr}, I was resting in the guest quarters before dinner was served.`,
    noSighting: (targetName, timeStr) =>
      `I did not observe ${targetName} during that interval. My clinical notes reflect nothing unusual.`,
    lockedClaim: () =>
      `Medical and professional ethics prevent me from speculating without diagnostic evidence.`,
    noConflict: (victimName) =>
      `${victimName} was a long-time patient and close friend. My duty was to preserve his life, not end it.`,
    general: () =>
      `That is my complete clinical and personal recollection of the evening.`,
    alreadyAnswered: () =>
      `I have already told you everything I know on that matter. My statement stands.`,
  },
  gideon: {
    routineTime: (timeStr) =>
      `At ${timeStr}? Enjoying a scotch out on the terrace. A peaceful hour before everything fell apart.`,
    noSighting: (targetName, timeStr) =>
      `Didn't see a hair of ${targetName} at ${timeStr}. I was by myself.`,
    lockedClaim: () =>
      `Don't come at me with wild stories. Put the evidence on the table or move along.`,
    noConflict: (victimName) =>
      `${victimName} and I built Vale Shipping from a single tugboat. We argued like brothers, but that's business.`,
    general: () =>
      `That's the whole story from my end. Straight and plain.`,
    alreadyAnswered: () =>
      `Listen to me: I have already told you everything I know on that matter.`,
  },
  felix: {
    routineTime: (timeStr) =>
      `At ${timeStr}? Practising scales in the music room alone. Nobody bothered to come in.`,
    noSighting: (targetName, timeStr) =>
      `I didn't see ${targetName}. I was keeping to myself all evening.`,
    lockedClaim: () =>
      `I don't have to explain my personal movements to you unless you have actual proof.`,
    noConflict: (victimName) =>
      `My father cut me off, yes. We barely spoke. But wishing him dead won't bring back the music.`,
    general: () =>
      `I've told you everything I care to remember. Leave me alone.`,
    alreadyAnswered: () =>
      `I have already told you everything I know on that matter. We're done talking.`,
  },
};

/**
 * Generates an in-character contextual response when a question yields no graph claims.
 */
export function getContextualReply(ctx: DialogueContext): string {
  const { caseData, suspectId, topic, slot, about, isAlreadyAsked, isLockedByEvidence } = ctx;
  const person = caseData.people.find((p) => p.id === suspectId);
  const target = about ? caseData.people.find((p) => p.id === about) : undefined;
  const targetName = target?.name ?? about ?? 'anyone';
  const victim = caseData.people.find((p) => p.victim);
  const victimName = victim?.name ?? 'the victim';

  const slotNum = slot && slot > 0 ? slot : undefined;
  const timeStr = slotNum && caseData.slots[slotNum - 1] ? caseData.slots[slotNum - 1] : slotNum ? `slot ${slotNum}` : '';

  const personaConfig = DIALOGUE_DATA[suspectId];

  // 1. Repeated question
  if (isAlreadyAsked) {
    if (personaConfig) return personaConfig.alreadyAnswered();
    return `I have already told you everything I know on that matter.`;
  }

  // 2. Claim locked behind undiscovered evidence
  if (isLockedByEvidence) {
    if (personaConfig) return personaConfig.lockedClaim();
    return `I am not discussing that matter without concrete evidence.`;
  }

  // 3. Witness sighting inquiry
  if (topic === 'witness' || (about && !slotNum)) {
    if (personaConfig) return personaConfig.noSighting(targetName, timeStr || 'that hour');
    return `I did not see ${targetName} at that time.`;
  }

  // 4. Whereabouts at uneventful routine time
  if (topic === 'whereabouts' && slotNum) {
    if (personaConfig) return personaConfig.routineTime(timeStr, slotNum);
    return `At ${timeStr}, nothing out of the ordinary occurred. My time was entirely routine.`;
  }

  // 5. Motive inquiry with victim/person where no conflict exists
  if (topic === 'motive') {
    if (personaConfig) return personaConfig.noConflict(victimName);
    return `I had no conflict with ${victimName}. Our relationship was strictly professional.`;
  }

  // 6. General inquiries ("About the night", "Anything else?")
  if (personaConfig) return personaConfig.general();
  return person?.persona
    ? `I have shared everything I can recall about the evening.`
    : `I have already told you everything I know on that matter.`;
}
