// Record that a room was searched at a specific game tick
CREATE (:SearchLog {room: $room, tick: $tick})
