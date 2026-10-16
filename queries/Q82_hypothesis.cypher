// Record an investigative hypothesis with confidence score on the player board
CREATE (h:Hypothesis {id: $id, text: $text, person: $person, confidence: $confidence, by: $by})
