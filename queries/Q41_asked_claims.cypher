// Retrieve all claim IDs that have already been made into statements
MATCH (s:Statement) RETURN s.claimId AS id
