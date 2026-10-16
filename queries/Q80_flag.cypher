// Record an analytical flag on the player's evidence board
CREATE (f:Flag {id: $id, kind: $kind, refs: $refs, note: $note, by: $by})
