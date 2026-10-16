// src/lib/copy.ts — Copy deck per docs/07-ui-spec.md section 9

export const copy = {
  tagline: 'Every lie leaves a path.',
  ask: {
    where: (time: string | number) => `Where were you at ${time}?`,
    saw: (time: string | number) => `Who did you see at ${time}?`,
    motive: (victim: string) => `What was your history with ${victim}?`,
    night: 'Tell me about the night.',
    more: 'Is there anything else?',
  },
  nothingNew: (name: string) => `${name} has nothing more to add on that.`,
  searchDone: 'You have already searched here.',
  windowRevised: (time: string | number) => `Window revised: the murder happened at ${time}.`,
  passageFound: 'A passage nobody drew on the plan.',
  baitConfirm: (n: number) => `You can use ${n} more. Choose carefully.`,
  baitAmbiguous: 'Several people reacted. This tells you little.',
  inspectorRecorded: 'Recorded run, re-executed live against the graph.',
  noPath: 'No path found. That is an answer, not an error.',
  accuseConfirm: (n: number) => `You have ${n} accusations left.`,
  partial: 'You have the hand, not the head.',
  wrong: 'Not quite. Something on the board says otherwise.',
  closed: 'Case closed.',
  fw: 'A reply was replaced because it said more than the suspect was cleared to say.',
  llmDown: "The language model is unavailable. Using the suspect's prepared statement.",
  error: 'Something went wrong. Try again.',
} as const;
