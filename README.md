# DMR Builder

A desktop application for building DMR codeplugs with BrandMeister integration.

## Features

- **BrandMeister Integration** - Search and import repeaters directly from BrandMeister network
- **US Repeaters** - Browse all US DMR repeaters with one click
- **Auto Channels** - Automatically create channels from repeater's static talkgroups with correct timeslots
- **Talkgroup Sync** - Sync 1700+ talkgroups from BrandMeister
- **TYT Export** - Export codeplugs as TYT-compatible CSV files
- **Local Database** - All your data stored locally in SQLite

## Download

Download the latest release from the [Releases](../../releases) page.

1. Download `DMR-Builder-v1.0.0-win.zip`
2. Extract the zip file
3. Run `DMR Builder.exe`

## Usage

### Getting Started

1. **Sync Talkgroups** - Go to the Talkgroups tab and click "Sync from BrandMeister" to import all talkgroups
2. **Add Repeaters** - Search for repeaters by city or browse US repeaters
3. **Create Channels** - Use "Add + Channels" to import a repeater with auto-created channels from its static talkgroups
4. **Export** - Go to Export tab and download your TYT CSV codeplug

### Tabs

- **Repeaters** - Search BrandMeister, view your repeaters, auto-create channels
- **Talkgroups** - Sync and search talkgroups
- **Channels** - Browse US repeaters, manually create channels, view all channels
- **Export** - Download TYT-compatible CSV files

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
# Install dependencies
npm install

# Initialize database
npm run init-db

# Start development server
npm start
```

Open http://localhost:3000

### Build Desktop App

```bash
# Build Windows portable exe
npm run build:win
```

Output in `dist/win-unpacked/`

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: SQLite (better-sqlite3)
- **Frontend**: Vanilla HTML/CSS/JS
- **Desktop**: Electron
- **API**: BrandMeister Network API v2

## License

MIT

## 73!

Made for the amateur radio community.
