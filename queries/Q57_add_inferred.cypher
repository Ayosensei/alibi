// Add single-survivor inferred hard assertion to player board
CREATE (:Assertion {id: $id, src: $src, subject: $subject, slot: $slot, room: $room, hard: true})
