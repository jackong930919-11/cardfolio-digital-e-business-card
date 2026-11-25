CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS cards_created_at_idx ON cards(created_at DESC);
