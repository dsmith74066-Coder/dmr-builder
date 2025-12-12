const express = require('express');
const router = express.Router();
const db = require('../db');
const brandmeister = require('../services/brandmeister');

// GET /api/talkgroups/sync-status - Get last sync info
router.get('/sync-status', (req, res) => {
  try {
    const lastSync = db.getLastSync('talkgroups');
    res.json(lastSync || { message: 'Never synced' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talkgroups/search - Search talkgroups
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing search query (q)' });
    }
    const talkgroups = db.searchTalkgroups(q);
    res.json(talkgroups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/talkgroups/sync - Sync from BrandMeister
router.post('/sync', async (req, res) => {
  const syncId = db.createSyncLog('talkgroups');

  try {
    const bmTalkgroups = await brandmeister.fetchTalkgroups();
    let synced = 0;

    for (const tg of bmTalkgroups) {
      const tgData = brandmeister.transformTalkgroup(tg);
      db.upsertTalkgroup(tgData);
      synced++;
    }

    db.completeSyncLog(syncId, synced, 'completed');
    res.json({ message: 'Sync completed', records_synced: synced });
  } catch (err) {
    db.completeSyncLog(syncId, 0, 'failed');
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talkgroups - List all talkgroups
router.get('/', (req, res) => {
  try {
    const talkgroups = db.getTalkgroups();
    res.json(talkgroups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/talkgroups/:id - Get single talkgroup
router.get('/:id', (req, res) => {
  try {
    const talkgroup = db.getTalkgroup(req.params.id);
    if (!talkgroup) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(talkgroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/talkgroups - Create talkgroup
router.post('/', (req, res) => {
  try {
    const talkgroup = db.createTalkgroup(req.body);
    res.status(201).json(talkgroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/talkgroups/:id - Update talkgroup
router.put('/:id', (req, res) => {
  try {
    const talkgroup = db.updateTalkgroup(req.params.id, req.body);
    res.json(talkgroup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/talkgroups/:id - Delete talkgroup
router.delete('/:id', (req, res) => {
  try {
    db.deleteTalkgroup(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
