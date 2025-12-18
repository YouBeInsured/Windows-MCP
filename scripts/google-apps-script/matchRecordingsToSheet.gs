/**
 * Match Recordings to Google Sheet
 *
 * This script matches audio recording files (MP3) from a Google Drive folder
 * to phone numbers in a Google Sheet and creates hyperlinks to the recordings.
 *
 * Features:
 * - Extracts 10-digit phone numbers from filenames (flexible naming)
 * - Matches phone numbers from spreadsheet column to recording files
 * - Creates formatted hyperlinks with person's name and phone number
 * - Handles various filename formats (e.g., "4155551234.mp3", "recording_4155551234.mp3", etc.)
 * - Supports multiple vendors with different folder locations
 *
 * Configuration:
 * - Update VENDOR_FOLDERS with your vendor names and folder IDs
 * - Adjust column numbers to match your spreadsheet structure
 *
 * @author Windows-MCP Project
 * @version 2.1 (Auto-Detect + Multi-Vendor Support)
 */

function matchRecordingsToSheet() {
  // ============================================
  // CONFIGURATION - Update these values
  // ============================================

  // Map vendor names to their Google Drive folder IDs
  const VENDOR_FOLDERS = {
    'Vendor A': '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf',
    'Vendor B': 'ANOTHER_FOLDER_ID_HERE',
    'Vendor C': 'YET_ANOTHER_FOLDER_ID_HERE',
    // Add more vendors as needed
  };

  // Column configuration
  const FIRST_NAME_COL = 2;  // Column B - First Name
  const LAST_NAME_COL = 3;   // Column C - Last Name
  const PHONE_COL = 4;       // Column D - Phone Number
  const VENDOR_COL = 5;      // Column E - Vendor Name (NEW!)
  const LINK_COL = 13;       // Column M - Where to place the hyperlink
  const START_ROW = 2;       // First data row (skip header)

  // ============================================
  // MAIN SCRIPT - No changes needed below
  // ============================================

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Build file maps for each vendor
  const vendorFileMaps = {};
  for (const [vendorName, folderId] of Object.entries(VENDOR_FOLDERS)) {
    try {
      const folder = DriveApp.getFolderById(folderId);
      const files = folder.getFiles();
      const fileMap = {};

      while (files.hasNext()) {
        const file = files.next();
        const name = file.getName();

        // FIXED: Match 10 consecutive digits ANYWHERE in the filename
        const phoneMatch = name.match(/(\d{10})/);
        if (phoneMatch) {
          const phone = phoneMatch[1];
          if (!fileMap[phone]) {
            fileMap[phone] = file.getUrl();
          }
        }
      }

      vendorFileMaps[vendorName] = fileMap;
    } catch (e) {
      Logger.log(`Warning: Could not access folder for vendor "${vendorName}": ${e.message}`);
    }
  }

  // Match phone numbers and create hyperlinks
  let matched = 0;
  let skipped = 0;

  for (let i = START_ROW - 1; i < data.length; i++) {
    const rawPhone = data[i][PHONE_COL - 1];
    const vendor = String(data[i][VENDOR_COL - 1] || '').trim();

    // Skip if no vendor specified
    if (!vendor) {
      skipped++;
      continue;
    }

    // Check if vendor exists in configuration
    if (!vendorFileMaps[vendor]) {
      Logger.log(`Row ${i+1}: Unknown vendor "${vendor}"`);
      skipped++;
      continue;
    }

    // Clean phone number
    const phone = String(rawPhone).replace(/\D/g, '');
    const phone10 = phone.slice(-10);

    // Look up in vendor's file map
    const fileMap = vendorFileMaps[vendor];
    if (fileMap[phone10]) {
      const firstName = data[i][FIRST_NAME_COL - 1] || '';
      const lastName = data[i][LAST_NAME_COL - 1] || '';
      const lastInitial = lastName.charAt(0).toUpperCase();

      // Create label: "John D. 4155551234 Recording"
      const label = `${firstName} ${lastInitial}. ${phone10} Recording`.replace(/"/g, '""');

      // Create hyperlink formula
      const formula = `=HYPERLINK("${fileMap[phone10]}","${label}")`;

      // Write to sheet
      sheet.getRange(i + 1, LINK_COL).setFormula(formula);
      matched++;
    }
  }

  // Show completion message
  const message = `Done!\n\nMatched: ${matched} recordings\nSkipped: ${skipped} rows (no vendor or unknown vendor)`;
  SpreadsheetApp.getUi().alert(message);
}

/**
 * TROUBLESHOOTING / DIAGNOSTIC VERSION
 *
 * Use this version if you need to debug matching issues.
 * It logs detailed information about files and phone numbers.
 *
 * To use:
 * 1. Replace the function above with this one
 * 2. Run the script
 * 3. View logs: View → Logs (or Ctrl+Enter)
 */
function matchRecordingsToSheetDebug() {
  const FOLDER_ID = '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf';
  const FIRST_NAME_COL = 2;
  const LAST_NAME_COL = 3;
  const PHONE_COL = 4;
  const LINK_COL = 13;
  const START_ROW = 2;

  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  const fileMap = {};
  const fileNames = [];
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    fileNames.push(name);
    const phoneMatch = name.match(/(\d{10})/);
    if (phoneMatch) {
      const phone = phoneMatch[1];
      if (!fileMap[phone]) {
        fileMap[phone] = file.getUrl();
      }
    }
  }

  Logger.log('=== FILES IN FOLDER ===');
  Logger.log('Total files: ' + fileNames.length);
  Logger.log('Matched files: ' + Object.keys(fileMap).length);
  Logger.log('Sample filenames: ' + fileNames.slice(0, 5).join(', '));

  Logger.log('\n=== PHONE NUMBERS IN SHEET ===');
  const unmatched = [];
  let matched = 0;

  for (let i = START_ROW - 1; i < data.length; i++) {
    const rawPhone = data[i][PHONE_COL - 1];
    const phone = String(rawPhone).replace(/\D/g, '');
    const phone10 = phone.slice(-10);

    Logger.log(`Row ${i+1}: Raw="${rawPhone}" | Cleaned="${phone}" | Last10="${phone10}"`);

    if (fileMap[phone10]) {
      const firstName = data[i][FIRST_NAME_COL - 1] || '';
      const lastName = data[i][LAST_NAME_COL - 1] || '';
      const lastInitial = lastName.charAt(0).toUpperCase();
      const label = `${firstName} ${lastInitial}. ${phone10} Recording`.replace(/"/g, '""');
      const formula = `=HYPERLINK("${fileMap[phone10]}","${label}")`;
      sheet.getRange(i + 1, LINK_COL).setFormula(formula);
      matched++;
    } else {
      unmatched.push({row: i+1, phone: phone10, raw: rawPhone});
    }
  }

  Logger.log('\n=== SUMMARY ===');
  Logger.log('Matched: ' + matched);
  Logger.log('Unmatched: ' + unmatched.length);
  if (unmatched.length > 0) {
    Logger.log('\nUnmatched phones:');
    unmatched.forEach(u => Logger.log(`  Row ${u.row}: ${u.phone} (raw: ${u.raw})`));
  }

  SpreadsheetApp.getUi().alert(`Done! Matched ${matched} recordings.\n\nCheck Logs (View → Logs) for details.`);
}

/**
 * AUTO-DETECT VENDOR BY SHEET NAME (RECOMMENDED FOR SEPARATE SHEETS)
 *
 * This version automatically detects which vendor based on the sheet name.
 * Perfect for when you have separate sheets for each vendor that you share externally.
 *
 * Setup:
 * 1. Name your sheets to match vendor names (e.g., "Vendor A", "Vendor B")
 * 2. Configure SHEET_TO_FOLDER mapping below
 * 3. Run this same function on any sheet - it auto-detects the right folder!
 */
function matchRecordingsAutoDetect() {
  // ============================================
  // CONFIGURATION - Map sheet names to folder IDs
  // ============================================
  const SHEET_TO_FOLDER = {
    'Vendor A': '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf',
    'Vendor B': 'ANOTHER_FOLDER_ID_HERE',
    'Vendor C': 'YET_ANOTHER_FOLDER_ID_HERE',
    // Add more as needed - sheet name must match exactly
  };

  const FIRST_NAME_COL = 2;  // Column B
  const LAST_NAME_COL = 3;   // Column C
  const PHONE_COL = 4;       // Column D
  const LINK_COL = 13;       // Column M
  const START_ROW = 2;

  // ============================================
  // AUTO-DETECTION - No changes needed below
  // ============================================

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const sheetName = sheet.getName();

  // Get folder ID based on sheet name
  const folderId = SHEET_TO_FOLDER[sheetName];

  if (!folderId) {
    SpreadsheetApp.getUi().alert(
      `Error: Sheet "${sheetName}" not configured.\n\n` +
      `Add this sheet to SHEET_TO_FOLDER mapping in the script.`
    );
    return;
  }

  // Get folder and files
  const folder = DriveApp.getFolderById(folderId);
  const files = folder.getFiles();
  const data = sheet.getDataRange().getValues();

  // Build map of phone numbers to file URLs
  const fileMap = {};
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();
    const phoneMatch = name.match(/(\d{10})/);
    if (phoneMatch) {
      const phone = phoneMatch[1];
      if (!fileMap[phone]) {
        fileMap[phone] = file.getUrl();
      }
    }
  }

  // Match phone numbers and create hyperlinks
  let matched = 0;
  for (let i = START_ROW - 1; i < data.length; i++) {
    const rawPhone = data[i][PHONE_COL - 1];
    const phone = String(rawPhone).replace(/\D/g, '');
    const phone10 = phone.slice(-10);

    if (fileMap[phone10]) {
      const firstName = data[i][FIRST_NAME_COL - 1] || '';
      const lastName = data[i][LAST_NAME_COL - 1] || '';
      const lastInitial = lastName.charAt(0).toUpperCase();
      const label = `${firstName} ${lastInitial}. ${phone10} Recording`.replace(/"/g, '""');
      const formula = `=HYPERLINK("${fileMap[phone10]}","${label}")`;
      sheet.getRange(i + 1, LINK_COL).setFormula(formula);
      matched++;
    }
  }

  SpreadsheetApp.getUi().alert(`Done! Matched ${matched} recordings in "${sheetName}".`);
}

/**
 * PROCESS ALL VENDOR SHEETS AT ONCE
 *
 * Runs matchRecordingsAutoDetect() on every configured sheet.
 * Use this to update all vendor sheets in one click!
 */
function matchRecordingsAllSheets() {
  const SHEET_TO_FOLDER = {
    'Vendor A': '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf',
    'Vendor B': 'ANOTHER_FOLDER_ID_HERE',
    'Vendor C': 'YET_ANOTHER_FOLDER_ID_HERE',
  };

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const results = [];

  for (const sheetName of Object.keys(SHEET_TO_FOLDER)) {
    const sheet = spreadsheet.getSheetByName(sheetName);
    if (sheet) {
      spreadsheet.setActiveSheet(sheet);
      matchRecordingsAutoDetect();
      results.push(`✓ ${sheetName}`);
    } else {
      results.push(`✗ ${sheetName} (sheet not found)`);
    }
  }

  SpreadsheetApp.getUi().alert(
    'Processed all sheets:\n\n' + results.join('\n')
  );
}
