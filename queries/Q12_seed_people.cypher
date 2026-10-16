// Seed suspect and victim person nodes with both Person and Party labels
UNWIND $people AS p CREATE (:Person:Party {id: p.id, name: p.name, role: p.role, persona: p.persona, victim: p.victim})
