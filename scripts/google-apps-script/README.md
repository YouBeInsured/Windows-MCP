# Google Apps Script - Match Recordings to Sheet

## Overview

This script automatically matches audio recording files (MP3) from a Google Drive folder to phone numbers in a Google Sheet, creating clickable hyperlinks to the recordings.

## Problem Solved

**Original Issue:** The script was only matching recordings with filenames in the exact format `4155551234.mp3` (10 digits followed by .mp3), causing many recordings to be skipped if they had different naming patterns.

**Solution:** Updated the regex pattern to extract 10-digit phone numbers from **anywhere** in the filename, supporting various formats:
- ✅ `4155551234.mp3`
- ✅ `recording_4155551234.mp3`
- ✅ `call 4155551234 jan15.mp3`
- ✅ `2024-01-15_4155551234_customer.mp3`

## Setup Instructions

### 1. Open Google Apps Script

1. Open your Google Sheet
2. Click **Extensions → Apps Script**
3. Delete any existing code in the editor
4. Copy and paste the entire contents of `matchRecordingsToSheet.gs`

### 2. Configure the Script

Update these constants at the top of the script:

```javascript
const FOLDER_ID = 'YOUR_FOLDER_ID';  // See instructions below
const FIRST_NAME_COL = 2;             // Column B
const LAST_NAME_COL = 3;              // Column C
const PHONE_COL = 4;                  // Column D
const LINK_COL = 13;                  // Column M
const START_ROW = 2;                  // First data row (skips header)
```

**How to get your Folder ID:**
1. Open the Google Drive folder containing your recordings
2. Look at the URL: `https://drive.google.com/drive/folders/1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf`
3. The Folder ID is the long string at the end: `1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf`

### 3. Run the Script

1. Click the **Save** icon
2. Click **Run** (play button)
3. Grant permissions when prompted (first time only)
4. Wait for completion alert: "Done! Matched X recordings."

## How It Works

1. **Scans Drive Folder:** Reads all files in the specified folder
2. **Extracts Phone Numbers:** Uses regex to find 10-digit phone numbers in filenames
3. **Matches to Sheet:** Compares against phone numbers in your spreadsheet (Column D)
4. **Creates Hyperlinks:** Generates formatted links in Column M with format: `FirstName L. 4155551234 Recording`

## Features

- **Flexible Filename Matching:** Works with any filename containing a 10-digit phone number
- **Country Code Handling:** Automatically strips country codes (e.g., +1) to match last 10 digits
- **Name Formatting:** Creates clean labels with first name and last initial
- **Duplicate Prevention:** Uses first occurrence if multiple files match the same number
- **Special Character Escaping:** Handles quotes and special characters in names

## Troubleshooting

### Not All Recordings Matching?

Use the **debug version** included at the bottom of the script file:

1. Replace `matchRecordingsToSheet()` with `matchRecordingsToSheetDebug()`
2. Run the script
3. View detailed logs: **View → Logs** (or **Ctrl+Enter**)

The debug version shows:
- All filenames found in the folder
- How each phone number is being processed
- Which rows didn't match and why

### Common Issues

| Issue | Solution |
|-------|----------|
| **No matches found** | Check that FOLDER_ID is correct and folder contains .mp3 files |
| **Some matches missing** | Phone numbers in filenames must be exactly 10 consecutive digits |
| **Wrong column** | Verify column numbers match your sheet structure |
| **Permission errors** | Re-authorize the script: Run → Review Permissions |

## Example Data

### Spreadsheet Layout

| A | B (First) | C (Last) | D (Phone) | ... | M (Link) |
|---|-----------|----------|-----------|-----|----------|
| 1 | John | Doe | (415) 555-1234 | ... | *[Hyperlink created here]* |
| 2 | Jane | Smith | +1-510-555-9876 | ... | *[Hyperlink created here]* |

### Drive Folder Files

```
recording_4155551234.mp3
call_5105559876_2024-01-15.mp3
customer_4089991111.mp3
```

### Result

The script creates hyperlinks in Column M:
- `John D. 4155551234 Recording` → links to `recording_4155551234.mp3`
- `Jane S. 5105559876 Recording` → links to `call_5105559876_2024-01-15.mp3`

## Version History

- **v1.0 (Fixed)** - Changed regex from `/(\d{10})\.mp3$/i` to `/(\d{10})/` to match phone numbers anywhere in filename
- **v0.1 (Original)** - Only matched exact format `XXXXXXXXXX.mp3`

## License

This script is part of the Windows-MCP project and is licensed under the MIT License.

## Support

For issues or questions:
- Open an issue in the [Windows-MCP repository](https://github.com/CursorTouch/Windows-MCP)
- Join our [Discord Community](https://discord.com/invite/Aue9Yj2VzS)
