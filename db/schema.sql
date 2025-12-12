-- DMR Builder Database Schema

-- Repeaters table
CREATE TABLE IF NOT EXISTS repeaters (
  repeater_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  city TEXT,
  state TEXT,
  tx_freq REAL NOT NULL,
  rx_freq REAL NOT NULL,
  color_code INTEGER DEFAULT 1,
  default_slot INTEGER DEFAULT 1,
  notes TEXT
);

-- Talkgroups table
CREATE TABLE IF NOT EXISTS talkgroups (
  tg_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  bm_id INTEGER,
  last_synced TEXT
);

-- Channels table
CREATE TABLE IF NOT EXISTS channels (
  channel_id INTEGER PRIMARY KEY AUTOINCREMENT,
  repeater_id INTEGER NOT NULL,
  tg_id INTEGER NOT NULL,
  slot INTEGER NOT NULL,
  contact_name TEXT,
  rx_freq REAL,
  tx_freq REAL,
  color_code INTEGER,
  FOREIGN KEY (repeater_id) REFERENCES repeaters(repeater_id),
  FOREIGN KEY (tg_id) REFERENCES talkgroups(tg_id)
);

-- Sync log table
CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  records_synced INTEGER,
  status TEXT DEFAULT 'running'
);

-- Index for faster talkgroup lookups
CREATE INDEX IF NOT EXISTS idx_talkgroups_number ON talkgroups(number);
CREATE INDEX IF NOT EXISTS idx_channels_repeater ON channels(repeater_id);
