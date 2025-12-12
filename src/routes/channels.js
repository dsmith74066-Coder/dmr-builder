const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/channels - List all channels (optionally filtered by repeater)
router.get('/', (req, res) => {
  try {
    const { repeater_id } = req.query;
    const channels = db.getChannels(repeater_id || null);
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/channels/:id - Get single channel
router.get('/:id', (req, res) => {
  try {
    const channel = db.getChannel(req.params.id);
    if (!channel) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/channels - Create channel
router.post('/', (req, res) => {
  try {
    const channel = db.createChannel(req.body);
    res.status(201).json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/channels/:id - Update channel
router.put('/:id', (req, res) => {
  try {
    const channel = db.updateChannel(req.params.id, req.body);
    res.json(channel);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/channels/:id - Delete channel
router.delete('/:id', (req, res) => {
  try {
    db.deleteChannel(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
