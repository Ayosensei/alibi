# Cypher and FalkorDB Spike Results (Task A1)

Tested against FalkorDB `latest` (`v1.4.0` / container `falkordb/falkordb:latest` on port 6379, FalkorDB Browser on 3000) using the official Node client `falkordb` v6.8.0.

## Summary Matrix

| Construct | Status | Behaviour Observed | Fallback / Decision |
|---|---|---|---|
| **1. UNWIND list-of-maps params** | **PASS** | `UNWIND $rows AS r CREATE (n:Label { ... })` creates all nodes with params passed as an array of objects. | None needed. Used in all seeding queries (Q10–Q17). Chained updating UNWINDs must be separated (e.g. Q18a facts, Q18b baits) or bridge with `WITH`. |
| **2. `ALL(... IN array)`** | **PASS** | `WHERE ALL(r IN c.requires WHERE r IN $foundEvidenceIds)` filters correctly when matching array properties against parameter arrays. | None needed. Used in Q40 claim selection. |
| **3. `NOT x IN list`** | **PASS** | `WHERE NOT c.id IN $askedClaimIds` excludes queried items as expected. | None needed. Used in Q40 claim selection. |
| **4. String comparison `<` / `>`** | **PASS** | `a.src < b.src` performs lexicographical ordering on strings inside Cypher predicates. | None needed. Deduplicates pairs in Q60 (contradictions). |
| **5. `shortestPath` with WHERE and type alternation** | **FAIL** | FalkorDB throws: `FalkorDB currently only supports shortestPaths in WITH or RETURN clauses`, and throws: `FalkorDB does not currently support undirected shortestPath traversals`. | **Fallback used:** Query `Q64_map_edges` to retrieve graph edges, and compute shortest path and distance in TypeScript BFS. Exactly matches oracle `dist()` in `scripts/reference-engine.mjs`. |
| **6. List comprehension over `relationships(p)`** | **PASS** | Directed and undirected path traversals (`p = (a)-[:KNOWN_REL*1..3]-(b)`) with `[r IN relationships(p) \| r.id]` return expected relationship IDs and lengths. | None needed. Used in Q70 motive paths. |
| **7. `OPTIONAL MATCH` chains** | **PASS** | Chained `OPTIONAL MATCH` clauses referencing previously matched variables (e.g. matching statements then assertions on `sup.by`) execute and evaluate conditions correctly. | None needed. Used in Q71 alibi support. |
| **8. `GRAPH.COPY` carrying indexes** | **PASS** | Range indexes created on the source graph (e.g., via `createNodeRangeIndex`) are preserved in destination graph after `GRAPH.COPY`. `EXPLAIN` confirms `Node By Index Scan` on copied graphs. | Range indexes are established on `public:{case}` templates before copy; `startPlay` leverages pre-existing indexes after `GRAPH.COPY`. |
| **9. Null-vs-sentinel parameters** | **PASS** with Sentinel convention | FalkorDB supports `$param IS NULL` and scalar null properties, but FalkorDB / Redis protocol handles non-null sentinel types (`''`, `0`, `[]`) with zero ambiguity across OpenCypher expressions. | Sentinel values (`''` for empty strings, `0` for empty slots, `[]` for empty lists) are used exclusively, strictly following Rule 10 and query contracts. |
| **Empty graph `roQuery` behaviour** | **NOTE** | `roQuery` on a non-existent graph throws `ERR Invalid graph operation on empty key`. | The DB wrapper verifies graph existence or safely handles empty graph state when querying play graphs before creation. |
