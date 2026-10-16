-- Q92: Record that a bait was used on the player board
CREATE (:BaitUsed {id: $id, baitId: $bait, outcome: $outcome, reactors: $reactors, tick: $tick})
