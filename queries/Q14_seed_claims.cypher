// Seed authored suspect claims with conditions, topics, truth value and metadata
UNWIND $claims AS c CREATE (:Claim {id: c.id, by: c.by, kind: c.kind, subject: c.subject, slot: c.slot, room: c.room, detail: c.detail, relationId: c.relationId, truth: c.truth, topics: c.topics, requires: c.requires, priority: c.priority, text: c.text})
