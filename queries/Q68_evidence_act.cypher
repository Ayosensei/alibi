// Query act requirements for an evidence item
MATCH (e:Evidence {id: $eid}) RETURN e.actSlot AS slot, e.actRoom AS room, e.actRestrictsTo AS candidates
