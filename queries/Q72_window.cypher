// Find all found evidence with murder window clues
MATCH (e:Evidence) WHERE size(e.window) > 0 RETURN e.id AS id, e.window AS window, e.windowKind AS kind
