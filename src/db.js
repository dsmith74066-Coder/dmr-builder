const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Schema embedded for packaged app
const SCHEMA = `
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

CREATE TABLE IF NOT EXISTS talkgroups (
  tg_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  bm_id INTEGER,
  last_synced TEXT
);

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

CREATE TABLE IF NOT EXISTS sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  records_synced INTEGER,
  status TEXT DEFAULT 'running'
);

CREATE INDEX IF NOT EXISTS idx_talkgroups_number ON talkgroups(number);
CREATE INDEX IF NOT EXISTS idx_channels_repeater ON channels(repeater_id);
`;

// Determine database path based on environment
let dbPath;
const isPackaged = process.resourcesPath && !process.resourcesPath.includes('node_modules');

if (process.env.PORTABLE_EXECUTABLE_DIR) {
  // Running as portable exe - store db next to exe
  dbPath = path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'dmr-builder.db');
} else if (isPackaged) {
  // Running in packaged Electron app - use AppData
  const userDataPath = process.env.APPDATA || process.env.HOME || '.';
  const appDataDir = path.join(userDataPath, 'DMR Builder');
  if (!fs.existsSync(appDataDir)) {
    fs.mkdirSync(appDataDir, { recursive: true });
  }
  dbPath = path.join(appDataDir, 'dmr-builder.db');
} else {
  // Development mode
  dbPath = path.join(__dirname, '..', 'db', 'dmr-builder.db');
}

console.log('Database path:', dbPath);

const needsInit = !fs.existsSync(dbPath);
const db = new Database(dbPath);

if (needsInit) {
  console.log('Initializing database...');
  db.exec(SCHEMA);
  console.log('Database initialized');
}

// Repeaters
const getRepeaters = () => db.prepare('SELECT * FROM repeaters').all();
const getRepeater = (id) => db.prepare('SELECT * FROM repeaters WHERE repeater_id = ?').get(id);
const searchRepeaters = (query) => db.prepare(`
  SELECT * FROM repeaters
  WHERE name LIKE ? OR city LIKE ? OR state LIKE ?
`).all(`%${query}%`, `%${query}%`, `%${query}%`);

const createRepeater = (data) => {
  const stmt = db.prepare(`
    INSERT INTO repeaters (name, city, state, tx_freq, rx_freq, color_code, default_slot, notes)
    VALUES (@name, @city, @state, @tx_freq, @rx_freq, @color_code, @default_slot, @notes)
  `);
  const result = stmt.run(data);
  return getRepeater(result.lastInsertRowid);
};

const updateRepeater = (id, data) => {
  const stmt = db.prepare(`
    UPDATE repeaters SET name = @name, city = @city, state = @state,
    tx_freq = @tx_freq, rx_freq = @rx_freq, color_code = @color_code,
    default_slot = @default_slot, notes = @notes
    WHERE repeater_id = @repeater_id
  `);
  stmt.run({ repeater_id: id, ...data });
  return getRepeater(id);
};

const deleteRepeater = (id) => {
  // Delete associated channels first
  db.prepare('DELETE FROM channels WHERE repeater_id = ?').run(id);
  db.prepare('DELETE FROM repeaters WHERE repeater_id = ?').run(id);
};

// Talkgroups
const getTalkgroups = () => db.prepare('SELECT * FROM talkgroups').all();
const getTalkgroup = (id) => db.prepare('SELECT * FROM talkgroups WHERE tg_id = ?').get(id);
const getTalkgroupByNumber = (number) => db.prepare('SELECT * FROM talkgroups WHERE number = ?').get(number);
const searchTalkgroups = (query) => db.prepare(`
  SELECT * FROM talkgroups
  WHERE name LIKE ? OR CAST(number AS TEXT) LIKE ?
`).all(`%${query}%`, `%${query}%`);

const createTalkgroup = (data) => {
  const stmt = db.prepare(`
    INSERT INTO talkgroups (name, number, type, description, bm_id, last_synced)
    VALUES (@name, @number, @type, @description, @bm_id, @last_synced)
  `);
  const result = stmt.run(data);
  return getTalkgroup(result.lastInsertRowid);
};

const upsertTalkgroup = (data) => {
  const existing = getTalkgroupByNumber(data.number);
  if (existing) {
    db.prepare(`
      UPDATE talkgroups SET name = @name, type = @type, description = @description,
      bm_id = @bm_id, last_synced = @last_synced
      WHERE number = @number
    `).run(data);
    return getTalkgroupByNumber(data.number);
  }
  return createTalkgroup(data);
};

const updateTalkgroup = (id, data) => {
  const stmt = db.prepare(`
    UPDATE talkgroups SET name = @name, number = @number, type = @type,
    description = @description, bm_id = @bm_id, last_synced = @last_synced
    WHERE tg_id = @tg_id
  `);
  stmt.run({ tg_id: id, ...data });
  return getTalkgroup(id);
};

const deleteTalkgroup = (id) => {
  db.prepare('DELETE FROM talkgroups WHERE tg_id = ?').run(id);
};

// Channels
const getChannels = (repeaterId = null) => {
  if (repeaterId) {
    return db.prepare(`
      SELECT c.*, r.name as repeater_name, t.name as talkgroup_name, t.number as talkgroup_number
      FROM channels c
      JOIN repeaters r ON c.repeater_id = r.repeater_id
      JOIN talkgroups t ON c.tg_id = t.tg_id
      WHERE c.repeater_id = ?
    `).all(repeaterId);
  }
  return db.prepare(`
    SELECT c.*, r.name as repeater_name, t.name as talkgroup_name, t.number as talkgroup_number
    FROM channels c
    JOIN repeaters r ON c.repeater_id = r.repeater_id
    JOIN talkgroups t ON c.tg_id = t.tg_id
  `).all();
};

const getChannel = (id) => db.prepare(`
  SELECT c.*, r.name as repeater_name, t.name as talkgroup_name, t.number as talkgroup_number
  FROM channels c
  JOIN repeaters r ON c.repeater_id = r.repeater_id
  JOIN talkgroups t ON c.tg_id = t.tg_id
  WHERE c.channel_id = ?
`).get(id);

const createChannel = (data) => {
  const stmt = db.prepare(`
    INSERT INTO channels (repeater_id, tg_id, slot, contact_name, rx_freq, tx_freq, color_code)
    VALUES (@repeater_id, @tg_id, @slot, @contact_name, @rx_freq, @tx_freq, @color_code)
  `);
  const result = stmt.run(data);
  return getChannel(result.lastInsertRowid);
};

const updateChannel = (id, data) => {
  const stmt = db.prepare(`
    UPDATE channels SET repeater_id = @repeater_id, tg_id = @tg_id, slot = @slot,
    contact_name = @contact_name, rx_freq = @rx_freq, tx_freq = @tx_freq, color_code = @color_code
    WHERE channel_id = @channel_id
  `);
  stmt.run({ channel_id: id, ...data });
  return getChannel(id);
};

const deleteChannel = (id) => {
  db.prepare('DELETE FROM channels WHERE channel_id = ?').run(id);
};

// Sync Log
const createSyncLog = (syncType) => {
  const stmt = db.prepare(`
    INSERT INTO sync_log (sync_type, started_at, status)
    VALUES (?, datetime('now'), 'running')
  `);
  return stmt.run(syncType).lastInsertRowid;
};

const completeSyncLog = (id, recordsSynced, status = 'completed') => {
  db.prepare(`
    UPDATE sync_log SET completed_at = datetime('now'), records_synced = ?, status = ?
    WHERE id = ?
  `).run(recordsSynced, status, id);
};

const getLastSync = (syncType) => db.prepare(`
  SELECT * FROM sync_log WHERE sync_type = ? ORDER BY id DESC LIMIT 1
`).get(syncType);

// Stats
const getStats = () => ({
  repeaters: db.prepare('SELECT COUNT(*) as count FROM repeaters').get().count,
  talkgroups: db.prepare('SELECT COUNT(*) as count FROM talkgroups').get().count,
  channels: db.prepare('SELECT COUNT(*) as count FROM channels').get().count
});

module.exports = {
  getRepeaters, getRepeater, searchRepeaters, createRepeater, updateRepeater, deleteRepeater,
  getTalkgroups, getTalkgroup, getTalkgroupByNumber, searchTalkgroups, createTalkgroup, upsertTalkgroup, updateTalkgroup, deleteTalkgroup,
  getChannels, getChannel, createChannel, updateChannel, deleteChannel,
  createSyncLog, completeSyncLog, getLastSync,
  getStats
};
