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
 *
 * Configuration:
 * - Update FOLDER_ID with your Google Drive folder ID
 * - Adjust column numbers to match your spreadsheet structure
 *
 * @author Windows-MCP Project
 * @version 1.0 (Fixed)
 */

function matchRecordingsToSheet() {
  // ============================================
  // CONFIGURATION - Update these values
  // ============================================
  const FOLDER_ID = '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf'; // Google Drive folder containing recordings
  const FIRST_NAME_COL = 2; // Column B - First Name
  const LAST_NAME_COL = 3;  // Column C - Last Name
  const PHONE_COL = 4;      // Column D - Phone Number
  const LINK_COL = 13;      // Column M - Where to place the hyperlink
  const START_ROW = 2;      // First data row (skip header)

  // ============================================
  // MAIN SCRIPT - No changes needed below
  // ============================================

  // Get folder and files
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const files = folder.getFiles();
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = sheet.getDataRange().getValues();

  // Build map of phone numbers to file URLs
  const fileMap = {};
  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    // FIXED: Match 10 consecutive digits ANYWHERE in the filename
    // This handles various formats:
    // - "4155551234.mp3"
    // - "recording_4155551234.mp3"
    // - "call 4155551234 jan15.mp3"
    const phoneMatch = name.match(/(\d{10})/);
    if (phoneMatch) {
      const phone = phoneMatch[1];
      // Store the first occurrence (avoid duplicates)
      if (!fileMap[phone]) {
        fileMap[phone] = file.getUrl();
      }
    }
  }

  // Match phone numbers and create hyperlinks
  let matched = 0;
  for (let i = START_ROW - 1; i < data.length; i++) {
    const rawPhone = data[i][PHONE_COL - 1];

    // Clean phone number: remove all non-digits
    const phone = String(rawPhone).replace(/\D/g, '');

    // Use last 10 digits to handle country codes
    // e.g., "+1 (415) 555-1234" becomes "14155551234", then "4155551234"
    const phone10 = phone.slice(-10);

    if (fileMap[phone10]) {
      const firstName = data[i][FIRST_NAME_COL - 1] || '';
      const lastName = data[i][LAST_NAME_COL - 1] || '';
      const lastInitial = lastName.charAt(0).toUpperCase();

      // Create label: "John D. 4155551234 Recording"
      // Escape double quotes to prevent formula breakage
      const label = `${firstName} ${lastInitial}. ${phone10} Recording`.replace(/"/g, '""');

      // Create hyperlink formula
      const formula = `=HYPERLINK("${fileMap[phone10]}","${label}")`;

      // Write to sheet
      sheet.getRange(i + 1, LINK_COL).setFormula(formula);
      matched++;
    }
  }

  // Show completion message
  SpreadsheetApp.getUi().alert(`Done! Matched ${matched} recordings.`);
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
