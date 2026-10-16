// Seed background case facts and who knows them for bait evaluation
UNWIND $facts AS f CREATE (:Fact {id: f.id, text: f.text, knownBy: f.knownBy})
