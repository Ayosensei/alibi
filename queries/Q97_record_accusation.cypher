-- Q97: Record an accusation attempt on the player board
CREATE (:Accusation {id: $id, persons: $persons, result: $result, wrong: $wrong, tick: $tick})
