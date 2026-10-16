// Add discovered evidence item to the player's board graph
CREATE (e:Evidence {id: $id, room: $room, title: $title, text: $text, window: $window, windowKind: $windowKind, actSlot: $actSlot, actRoom: $actRoom, actRestrictsTo: $actRestrictsTo, relationId: $relationId, revealsEdge: $revealsEdge, knowers: $knowers})
