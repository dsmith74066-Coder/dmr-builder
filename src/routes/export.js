const express = require('express');
const router = express.Router();
const db = require('../db');
const tytExport = require('../services/tyt-export');

// GET /api/export/tyt - Download TYT CSV
router.get('/tyt', (req, res) => {
  try {
    const { repeater_id } = req.query;
    const channels = db.getChannels(repeater_id || null);

    if (channels.length === 0) {
      return res.status(404).json({ error: 'No channels to export' });
    }

    const csv = tytExport.generateTYTCSV(channels);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dmr-channels.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/tyt/preview - Preview TYT CSV
router.get('/tyt/preview', (req, res) => {
  try {
    const { repeater_id } = req.query;
    const channels = db.getChannels(repeater_id || null);

    if (channels.length === 0) {
      return res.json({ preview: '', count: 0 });
    }

    const csv = tytExport.generateTYTCSV(channels);
    const lines = csv.split('\n');
    const preview = lines.slice(0, 11).join('\n'); // Header + 10 rows

    res.json({
      preview,
      count: channels.length,
      total_lines: lines.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/export/contacts - Download contacts CSV
router.get('/contacts', (req, res) => {
  try {
    const talkgroups = db.getTalkgroups();

    if (talkgroups.length === 0) {
      return res.status(404).json({ error: 'No talkgroups to export' });
    }

    const csv = tytExport.generateContactsCSV(talkgroups);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="dmr-contacts.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
