// Clear all previously inferred assertions before re-running elimination
MATCH (a:Assertion) WHERE a.src STARTS WITH 'inferred:' DELETE a
