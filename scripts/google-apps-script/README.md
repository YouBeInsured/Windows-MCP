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

### 2. Choose Your Version

The script includes **multiple versions** for different use cases:

| Function | Best For | Description |
|----------|----------|-------------|
| `matchRecordingsAutoDetect()` | **⭐ Separate sheets per vendor** | Auto-detects vendor by sheet name - RECOMMENDED for shared sheets |
| `matchRecordingsAllSheets()` | **⚡ Batch processing** | Updates all vendor sheets at once |
| `matchRecordingsToSheet()` | **Single sheet, vendor column** | Reads vendor from column, matches to different folders |
| `matchRecordingsToSheetDebug()` | **🔍 Troubleshooting** | Logs detailed information for debugging |

### 3A. Configure Auto-Detect (⭐ RECOMMENDED for Shared Sheets)

**Best for: Separate sheets per vendor that you share with vendors/clients**

This is the **ideal setup when you share sheets externally** because each vendor only sees their own data.

1. **Create separate sheet tabs** for each vendor:
   - Right-click sheet tab → Duplicate
   - Rename to vendor names: "Vendor A", "Vendor B", etc.

2. **Configure the mapping in `matchRecordingsAutoDetect()`:**

```javascript
const SHEET_TO_FOLDER = {
  'Vendor A': '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf',
  'Vendor B': '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456',
  'Vendor C': '1ZyXwVuTsRqPoNmLkJiHgFeDcBa9876543',
};
```

3. **Run the script:**
   - Open any vendor sheet
   - Run `matchRecordingsAutoDetect()` - it automatically knows which folder!
   - OR run `matchRecordingsAllSheets()` to update ALL sheets at once

**Benefits:**
✅ Complete data segregation
✅ Share individual sheets with vendors/clients
✅ Same script works on all sheets
✅ Can process all sheets with one click

### 3B. Configure Vendor Column Version

**Best for: All data in one sheet with internal use only**

1. **Add vendor column** to your spreadsheet (e.g., Column E)
2. **Update the configuration:**

```javascript
const VENDOR_FOLDERS = {
  'Vendor A': '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf',
  'Vendor B': '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456',
};

const VENDOR_COL = 5;  // Column E - Vendor Name
```

---

**How to get your Folder ID:**
1. Open the Google Drive folder containing your recordings
2. Look at the URL: `https://drive.google.com/drive/folders/1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf`
3. The Folder ID is the long string at the end: `1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf`

### 4. Run the Script

1. Click the **Save** icon
2. Select the function to run from the dropdown (e.g., `matchRecordingsToSheet`)
3. Click **Run** (play button)
4. Grant permissions when prompted (first time only)
5. Wait for completion alert: "Done! Matched X recordings."

## How It Works

### Multi-Vendor Version:
1. **Loads Vendor Configuration:** Reads all vendor folders from `VENDOR_FOLDERS`
2. **Scans Each Folder:** Builds a phone-to-URL map for each vendor
3. **Processes Each Row:**
   - Reads vendor name from Column E
   - Looks up recording in that vendor's folder
   - Creates hyperlink if match found
4. **Creates Hyperlinks:** Generates formatted links with format: `FirstName L. 4155551234 Recording`

### Single-Vendor Version:
1. **Scans Drive Folder:** Reads all files in the specified folder
2. **Extracts Phone Numbers:** Uses regex to find 10-digit phone numbers in filenames
3. **Matches to Sheet:** Compares against phone numbers in your spreadsheet (Column D)
4. **Creates Hyperlinks:** Generates formatted links in Column M

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

## Multi-Vendor Setup Options

### ⭐ Option 1: Auto-Detect by Sheet Name (RECOMMENDED for External Sharing)

**Perfect when you share sheets with vendors and clients.**

**How it works:**
- Create separate sheet tabs for each vendor
- Name sheets to match vendor names exactly
- Script auto-detects which folder based on active sheet
- Can update all sheets at once with `matchRecordingsAllSheets()`

**Setup:**
```javascript
// In matchRecordingsAutoDetect() function:
const SHEET_TO_FOLDER = {
  'Vendor A': '1qsirGBSm3Zgx11Ah5LVzMAmKSmiwZDzf',
  'Vendor B': '1AbCdEfGhIjKlMnOpQrStUvWxYz0123456',
};
```

**Sharing workflow:**
1. Share "Vendor A" sheet → `vendor-a@example.com` (read-only)
2. Share "Vendor B" sheet → `vendor-b@example.com` (read-only)
3. Each vendor only sees their own data ✅

---

### Option 2: Single Sheet with Vendor Column (Internal Use)

**Best for internal tracking where you don't share with vendors.**

- All data in one sheet
- Column E specifies vendor name
- Script matches to appropriate folder based on vendor
- **Pros:** Easier to manage, one view of all data
- **Cons:** All vendors in same sheet (can't share externally)

## Version History

- **v2.1 (Auto-Detect)** - Added auto-detection by sheet name for external sharing, batch processing function
- **v2.0 (Multi-Vendor)** - Added support for multiple vendors with separate folders
- **v1.0 (Fixed)** - Changed regex from `/(\d{10})\.mp3$/i` to `/(\d{10})/` to match phone numbers anywhere in filename
- **v0.1 (Original)** - Only matched exact format `XXXXXXXXXX.mp3`

## License

This script is part of the Windows-MCP project and is licensed under the MIT License.

## Support

For issues or questions:
- Open an issue in the [Windows-MCP repository](https://github.com/CursorTouch/Windows-MCP)
- Join our [Discord Community](https://discord.com/invite/Aue9Yj2VzS)
