const express = require('express');
const cors = require('cors');
const path = require('path');

const repeatersRouter = require('./routes/repeaters');
const talkgroupsRouter = require('./routes/talkgroups');
const channelsRouter = require('./routes/channels');
const exportRouter = require('./routes/export');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes
app.use('/api/repeaters', repeatersRouter);
app.use('/api/talkgroups', talkgroupsRouter);
app.use('/api/channels', channelsRouter);
app.use('/api/export', exportRouter);

// Stats endpoint
app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API docs
app.get('/api', (req, res) => {
  res.json({
    name: 'DMR Builder API',
    version: '1.0.0',
    endpoints: {
      repeaters: {
        'GET /api/repeaters': 'List all repeaters',
        'GET /api/repeaters/:id': 'Get single repeater',
        'GET /api/repeaters/search?q=': 'Search BrandMeister repeaters by location',
        'GET /api/repeaters/search/local?q=': 'Search local repeaters',
        'GET /api/repeaters/bm/us': 'Get all US repeaters from BrandMeister',
        'GET /api/repeaters/bm/:bmId/talkgroups': 'Get static talkgroups for BM repeater',
        'POST /api/repeaters': 'Create repeater',
        'POST /api/repeaters/import': 'Import repeater from BrandMeister',
        'POST /api/repeaters/import-with-channels': 'Import repeater with auto-created channels',
        'POST /api/repeaters/:id/auto-channels': 'Create channels from BM static TGs',
        'PUT /api/repeaters/:id': 'Update repeater',
        'DELETE /api/repeaters/:id': 'Delete repeater'
      },
      talkgroups: {
        'GET /api/talkgroups': 'List all talkgroups',
        'GET /api/talkgroups/:id': 'Get single talkgroup',
        'GET /api/talkgroups/search?q=': 'Search talkgroups',
        'GET /api/talkgroups/sync-status': 'Get last sync info',
        'POST /api/talkgroups/sync': 'Sync from BrandMeister',
        'POST /api/talkgroups': 'Create talkgroup',
        'PUT /api/talkgroups/:id': 'Update talkgroup',
        'DELETE /api/talkgroups/:id': 'Delete talkgroup'
      },
      channels: {
        'GET /api/channels': 'List all channels',
        'GET /api/channels?repeater_id=X': 'List channels for repeater',
        'GET /api/channels/:id': 'Get single channel',
        'POST /api/channels': 'Create channel',
        'PUT /api/channels/:id': 'Update channel',
        'DELETE /api/channels/:id': 'Delete channel'
      },
      export: {
        'GET /api/export/tyt': 'Download TYT CSV codeplug',
        'GET /api/export/tyt?repeater_id=X': 'Download TYT CSV for specific repeater',
        'GET /api/export/tyt/preview': 'Preview TYT CSV export',
        'GET /api/export/contacts': 'Download contacts CSV'
      }
    }
  });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`DMR Builder running on http://localhost:${PORT}`);
  console.log(`Web UI: http://localhost:${PORT}`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});
