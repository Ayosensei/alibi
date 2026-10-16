// Seed physical evidence items discovered in rooms with act and window properties
UNWIND $evidence AS e CREATE (ev:Evidence {id: e.id, room: e.room, title: e.title, text: e.text, window: e.window, windowKind: e.windowKind, revealsEdge: e.revealsEdge, knowers: e.knowers, actSlot: e.actSlot, actRoom: e.actRoom, actRestrictsTo: e.actRestrictsTo, relationId: e.relationId})
