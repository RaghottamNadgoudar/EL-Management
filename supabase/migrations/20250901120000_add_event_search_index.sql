CREATE INDEX events_search_idx ON events USING GIN (to_tsvector('english', name || ' ' || description));
