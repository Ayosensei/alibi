// Record a suspect statement on the player's evidence board
CREATE (s:Statement {id: $sid, claimId: $cid, by: $by, kind: $kind, subject: $subject, slot: $slot, room: $room, detail: $detail, text: $text, tick: $tick})
