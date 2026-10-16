// Seed slot nodes with time labels for public board inspection
UNWIND $slots AS s CREATE (:Slot {n: s.n, label: s.label})
