const express = require('express');
const router = express.Router();
const db = require('../db');
const brandmeister = require('../services/brandmeister');

// GET /api/repeaters/search/local - Search local database for repeaters
router.get('/search/local', (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing search query (q)' });
    }
    const repeaters = db.searchRepeaters(q);
    res.json(repeaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repeaters/search - Search BrandMeister for repeaters by location
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Missing search query (q)' });
    }
    const searchTerms = q.split(',').map(t => t.trim());
    const repeaters = await brandmeister.searchRepeatersByLocation(searchTerms);
    res.json(repeaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repeaters/bm/us - Get all US repeaters from BrandMeister
router.get('/bm/us', async (req, res) => {
  try {
    const repeaters = await brandmeister.fetchUSRepeaters();
    res.json(repeaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repeaters/bm/:bmId/talkgroups - Get static talkgroups for a BrandMeister repeater
router.get('/bm/:bmId/talkgroups', async (req, res) => {
  try {
    const bmId = req.params.bmId;
    const talkgroups = await brandmeister.fetchDeviceTalkgroups(bmId);

    // Enrich with talkgroup names from local DB
    const enriched = talkgroups.map(tg => {
      const localTg = db.getTalkgroupByNumber(parseInt(tg.talkgroup));
      return {
        talkgroup: parseInt(tg.talkgroup),
        slot: parseInt(tg.slot),
        name: localTg ? localTg.name : `TG ${tg.talkgroup}`
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repeaters/import-with-channels - Import repeater and create channels from static TGs
router.post('/import-with-channels', async (req, res) => {
  try {
    const { bm_id } = req.body;
    if (!bm_id) {
      return res.status(400).json({ error: 'Missing bm_id' });
    }

    // Fetch repeater info
    const bmRepeater = await brandmeister.fetchDevice(bm_id);
    const repeaterData = brandmeister.transformRepeater(bmRepeater);
    const repeater = db.createRepeater(repeaterData);

    // Fetch static talkgroups
    const staticTGs = await brandmeister.fetchDeviceTalkgroups(bm_id);
    const channelsCreated = [];

    for (const tg of staticTGs) {
      let localTg = db.getTalkgroupByNumber(parseInt(tg.talkgroup));

      // Create talkgroup if it doesn't exist
      if (!localTg) {
        localTg = db.createTalkgroup({
          name: `TG ${tg.talkgroup}`,
          number: parseInt(tg.talkgroup),
          type: 'BrandMeister',
          description: null,
          bm_id: parseInt(tg.talkgroup),
          last_synced: new Date().toISOString()
        });
      }

      // Create channel
      const channel = db.createChannel({
        repeater_id: repeater.repeater_id,
        tg_id: localTg.tg_id,
        slot: parseInt(tg.slot),
        contact_name: localTg.name,
        rx_freq: repeater.rx_freq,
        tx_freq: repeater.tx_freq,
        color_code: repeater.color_code
      });
      channelsCreated.push(channel);
    }

    res.json({
      repeater,
      channels_created: channelsCreated.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repeaters/:id/auto-channels - Create channels from BrandMeister static TGs for existing repeater
router.post('/:id/auto-channels', async (req, res) => {
  try {
    const repeater = db.getRepeater(req.params.id);
    if (!repeater) {
      return res.status(404).json({ error: 'Repeater not found' });
    }

    // Extract BM ID from notes
    const bmIdMatch = repeater.notes && repeater.notes.match(/BM ID: (\d+)/);
    if (!bmIdMatch) {
      return res.status(400).json({ error: 'No BrandMeister ID found in repeater notes' });
    }
    const bmId = bmIdMatch[1];

    // Fetch static talkgroups
    const staticTGs = await brandmeister.fetchDeviceTalkgroups(bmId);
    const channelsCreated = [];

    for (const tg of staticTGs) {
      let localTg = db.getTalkgroupByNumber(parseInt(tg.talkgroup));

      if (!localTg) {
        localTg = db.createTalkgroup({
          name: `TG ${tg.talkgroup}`,
          number: parseInt(tg.talkgroup),
          type: 'BrandMeister',
          description: null,
          bm_id: parseInt(tg.talkgroup),
          last_synced: new Date().toISOString()
        });
      }

      const channel = db.createChannel({
        repeater_id: repeater.repeater_id,
        tg_id: localTg.tg_id,
        slot: parseInt(tg.slot),
        contact_name: localTg.name,
        rx_freq: repeater.rx_freq,
        tx_freq: repeater.tx_freq,
        color_code: repeater.color_code
      });
      channelsCreated.push(channel);
    }

    res.json({ channels_created: channelsCreated.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repeaters - List all repeaters
router.get('/', (req, res) => {
  try {
    const repeaters = db.getRepeaters();
    res.json(repeaters);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/repeaters/:id - Get single repeater
router.get('/:id', (req, res) => {
  try {
    const repeater = db.getRepeater(req.params.id);
    if (!repeater) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(repeater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repeaters - Create repeater
router.post('/', (req, res) => {
  try {
    const repeater = db.createRepeater(req.body);
    res.status(201).json(repeater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/repeaters/import - Import repeater from BrandMeister
router.post('/import', async (req, res) => {
  try {
    const { bm_id } = req.body;
    if (!bm_id) {
      return res.status(400).json({ error: 'Missing bm_id' });
    }

    const bmRepeater = await brandmeister.fetchDevice(bm_id);
    const repeaterData = brandmeister.transformRepeater(bmRepeater);
    const repeater = db.createRepeater(repeaterData);

    res.status(201).json(repeater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/repeaters/:id - Update repeater
router.put('/:id', (req, res) => {
  try {
    const repeater = db.updateRepeater(req.params.id, req.body);
    res.json(repeater);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/repeaters/:id - Delete repeater
router.delete('/:id', (req, res) => {
  try {
    db.deleteRepeater(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
