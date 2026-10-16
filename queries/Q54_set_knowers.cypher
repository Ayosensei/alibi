// Update list of people who know of the hidden passage
MATCH (:Room)-[h:HIDDEN_KNOWN]->(:Room) SET h.knowers = $knowers
