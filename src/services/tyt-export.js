/**
 * TYT CSV Export Service
 * Generates codeplug CSV files compatible with TYT radios
 */

/**
 * Generate TYT-compatible CSV from channels
 * @param {Array} channels - Array of channel objects
 * @returns {string} CSV content
 */
function generateTYTCSV(channels) {
  const headers = [
    'No.',
    'Channel Name',
    'Receive Frequency',
    'Transmit Frequency',
    'Channel Type',
    'Transmit Power',
    'Band Width',
    'CTCSS/DCS Decode',
    'CTCSS/DCS Encode',
    'Contact',
    'Contact Call Type',
    'Contact TG/DMR ID',
    'Radio ID',
    'Busy Lock/TX Permit',
    'Squelch Mode',
    'Optional Signal',
    'DTMF ID',
    '2Tone ID',
    '5Tone ID',
    'PTT ID',
    'Color Code',
    'Slot',
    'Scan List',
    'Receive Group List',
    'PTT Prohibit',
    'Reverse',
    'Simplex TDMA',
    'Slot Suit',
    'AES Digital Encryption',
    'Digital Encryption',
    'Call Confirmation',
    'Talk Around(Simplex)',
    'Work Alone',
    'Custom CTCSS',
    'DMR MODE',
    'DataACK Disable',
    'APRS RX',
    'Analog APRS PTT Mode',
    'Digital APRS PTT Mode',
    'APRS Report Type',
    'Digital APRS Report Channel',
    'Correct Frequency[Hz]',
    'SMS Confirmation',
    'Exclude channel from roaming',
    'DMR Encryption',
    'Multiple Key'
  ];

  const rows = channels.map((channel, index) => {
    const channelName = `${channel.repeater_name}-${channel.talkgroup_name}`.substring(0, 16);

    return [
      index + 1,                              // No.
      channelName,                            // Channel Name
      channel.rx_freq.toFixed(5),             // Receive Frequency
      channel.tx_freq.toFixed(5),             // Transmit Frequency
      'D-Digital',                            // Channel Type
      'High',                                 // Transmit Power
      '12.5K',                                // Band Width
      'Off',                                  // CTCSS/DCS Decode
      'Off',                                  // CTCSS/DCS Encode
      channel.contact_name || channel.talkgroup_name, // Contact
      'Group Call',                           // Contact Call Type
      channel.talkgroup_number,               // Contact TG/DMR ID
      1,                                      // Radio ID
      'Off',                                  // Busy Lock/TX Permit
      'Carrier',                              // Squelch Mode
      'Off',                                  // Optional Signal
      1,                                      // DTMF ID
      1,                                      // 2Tone ID
      1,                                      // 5Tone ID
      'Off',                                  // PTT ID
      channel.color_code,                     // Color Code
      channel.slot,                           // Slot
      'None',                                 // Scan List
      'None',                                 // Receive Group List
      'Off',                                  // PTT Prohibit
      'Off',                                  // Reverse
      'Off',                                  // Simplex TDMA
      'Off',                                  // Slot Suit
      'Normal Encryption',                    // AES Digital Encryption
      'Off',                                  // Digital Encryption
      'Off',                                  // Call Confirmation
      'Off',                                  // Talk Around
      'Off',                                  // Work Alone
      251.1,                                  // Custom CTCSS
      0,                                      // DMR MODE
      'Off',                                  // DataACK Disable
      'Off',                                  // APRS RX
      'Off',                                  // Analog APRS PTT Mode
      'Off',                                  // Digital APRS PTT Mode
      'Off',                                  // APRS Report Type
      1,                                      // Digital APRS Report Channel
      0,                                      // Correct Frequency[Hz]
      'Off',                                  // SMS Confirmation
      0,                                      // Exclude channel from roaming
      'Off',                                  // DMR Encryption
      'Off'                                   // Multiple Key
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

/**
 * Generate contacts CSV for TYT
 * @param {Array} talkgroups - Array of talkgroup objects
 * @returns {string} CSV content
 */
function generateContactsCSV(talkgroups) {
  const headers = ['No.', 'Radio ID', 'Callsign', 'Name', 'City', 'State', 'Country', 'Remarks', 'Call Type', 'Call Alert'];

  const rows = talkgroups.map((tg, index) => [
    index + 1,
    tg.number,
    '',
    tg.name.substring(0, 16),
    '',
    '',
    '',
    tg.type,
    'Group Call',
    'None'
  ]);

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

module.exports = {
  generateTYTCSV,
  generateContactsCSV
};
