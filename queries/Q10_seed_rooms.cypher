// Seed all room nodes in the case map
UNWIND $rooms AS r CREATE (:Room {id: r.id, name: r.name})
