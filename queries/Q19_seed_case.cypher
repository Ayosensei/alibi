// Seed case metadata, crime scene, and serialized solution in the truth graph
CREATE (:Case {id: $id, level: $level, title: $title, crimeScene: $scene, solutionJson: $solutionJson})
