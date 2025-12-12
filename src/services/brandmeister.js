const axios = require('axios');

const BM_API_BASE = 'https://api.brandmeister.network/v2';

const client = axios.create({
  baseURL: BM_API_BASE,
  timeout: 30000,
  headers: {
    'Accept': 'application/json'
  }
});

/**
 * Fetch all talkgroups from BrandMeister (public endpoint)
 * @returns {Promise<Array>} Array of talkgroup objects [{id, name}]
 */
async function fetchTalkgroups() {
  const response = await client.get('/talkgroup');
  const data = response.data;
  return Object.entries(data).map(([id, name]) => ({
    id: parseInt(id, 10),
    name: name
  }));
}

/**
 * Fetch device/repeater info by ID
 * @param {number} deviceId - The BrandMeister device ID
 * @returns {Promise<Object>} Device information
 */
async function fetchDevice(deviceId) {
  const response = await client.get(`/device/${deviceId}`);
  return response.data;
}

/**
 * Fetch device profile including talkgroups
 * @param {number} deviceId - The BrandMeister device ID
 * @returns {Promise<Object>} Device profile
 */
async function fetchDeviceProfile(deviceId) {
  const response = await client.get(`/device/${deviceId}/profile`);
  return response.data;
}

/**
 * Fetch static talkgroups for a device
 * @param {number} deviceId - The BrandMeister device ID
 * @returns {Promise<Array>} Array of talkgroup assignments
 */
async function fetchDeviceTalkgroups(deviceId) {
  const response = await client.get(`/device/${deviceId}/talkgroup`);
  return response.data;
}

/**
 * Search devices by callsign
 * @param {string} callsign - The callsign to search for
 * @returns {Promise<Array>} Array of matching devices
 */
async function searchByCallsign(callsign) {
  const response = await client.get('/device/byCall', {
    params: { callsign }
  });
  return response.data;
}

/**
 * Fetch all repeaters from BrandMeister
 * @returns {Promise<Array>} Array of repeater objects
 */
async function fetchAllRepeaters() {
  const response = await client.get('/device', {
    params: { repeater: true }
  });
  return response.data;
}

/**
 * Fetch US-only repeaters from BrandMeister
 * US repeaters have IDs starting with 31 (US DMR country code)
 * @returns {Promise<Array>} Array of US repeater objects
 */
async function fetchUSRepeaters() {
  const allRepeaters = await fetchAllRepeaters();
  return allRepeaters.filter(r => String(r.id).startsWith('31'));
}

/**
 * Search repeaters by city/location
 * @param {string[]} searchTerms - Array of search terms (city names)
 * @returns {Promise<Array>} Array of matching repeaters
 */
async function searchRepeatersByLocation(searchTerms) {
  const allRepeaters = await fetchAllRepeaters();
  const terms = searchTerms.map(t => t.toLowerCase());

  return allRepeaters.filter(r => {
    if (!r.city) return false;
    const city = r.city.toLowerCase();
    return terms.some(term => city.includes(term));
  });
}

/**
 * Transform BrandMeister repeater to local format
 * @param {Object} bmRepeater - BrandMeister repeater object
 * @returns {Object} Transformed repeater for local DB
 */
function transformRepeater(bmRepeater) {
  let city = bmRepeater.city || '';
  let state = '';

  if (city.includes(',')) {
    const parts = city.split(',').map(p => p.trim());
    city = parts[0];
    state = parts[1] || '';
  }

  return {
    name: bmRepeater.callsign || `Repeater ${bmRepeater.id}`,
    city: city,
    state: state,
    tx_freq: parseFloat(bmRepeater.tx) || 0,
    rx_freq: parseFloat(bmRepeater.rx) || 0,
    color_code: bmRepeater.colorcode || 1,
    default_slot: 1,
    notes: `BM ID: ${bmRepeater.id}. ${bmRepeater.description || ''}`
  };
}

/**
 * Transform BrandMeister talkgroup to local format
 * @param {Object} bmTg - BrandMeister talkgroup object
 * @returns {Object} Transformed talkgroup for local DB
 */
function transformTalkgroup(bmTg) {
  return {
    name: bmTg.name || `TG ${bmTg.id}`,
    number: bmTg.id,
    type: 'BrandMeister',
    description: bmTg.description || null,
    bm_id: bmTg.id,
    last_synced: new Date().toISOString()
  };
}

module.exports = {
  fetchTalkgroups,
  fetchDevice,
  fetchDeviceProfile,
  fetchDeviceTalkgroups,
  searchByCallsign,
  fetchAllRepeaters,
  fetchUSRepeaters,
  searchRepeatersByLocation,
  transformRepeater,
  transformTalkgroup
};
