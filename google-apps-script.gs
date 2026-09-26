/**
 * ============================================================
 *  InfiSource Global - Form Backend (Google Apps Script)
 * ============================================================
 *
 *  Receives vendor registrations and website inquiries from the
 *  website and writes them into this Google Sheet.
 *
 *  HOW TO INSTALL (5 minutes):
 *  1. Open your Google Sheet (the one vendors should land in).
 *  2. Menu: Extensions -> Apps Script.
 *  3. Delete any code there and paste this entire file.
 *  4. Click Deploy -> New deployment.
 *  5. Select type "Web app".
 *     - Execute as: Me
 *     - Who has access: Anyone
 *  6. Click Deploy, authorize when asked, and copy the Web app URL.
 *  7. Open the website file assets/js/config.js and paste the URL:
 *       var CONFIG = { FORM_ENDPOINT: "PASTE_URL_HERE" };
 *  8. Done. Form submissions now write rows into this sheet, and
 *     uploaded files are saved in Google Drive with links added
 *     to the row.
 *
 *  Sheets used (created automatically): "Vendors", "Inquiries"
 *  Drive folder used (created automatically): "InfiSource Website Uploads"
 */

var VENDOR_SHEET = 'Vendors';
var INQUIRY_SHEET = 'Inquiries';
var FOLDER_NAME = 'InfiSource Website Uploads';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var p = e && e.parameter ? e.parameter : {};
    var isInquiry = (p.form_type === 'inquiry');
    var sheetName = isInquiry ? INQUIRY_SHEET : VENDOR_SHEET;
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);

    // ordered field keys sent by the website
    var keys = (p.keys || '').split(',').filter(String);
    if (!keys.length) return json_({ ok: false, error: 'no keys' });

    // ---- build header row if needed (new fields add new columns) ----
    var header = ['Timestamp'].concat(keys.slice());
    if (!isInquiry) header.push('Files');
    var cur = sheet.getLastRow();
    if (cur === 0 || sheet.getLastColumn() < header.length) {
      var existing = cur > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
      var merged = existing.slice();
      header.forEach(function (h) { if (merged.indexOf(h) === -1) merged.push(h); });
      sheet.getRange(1, 1, 1, merged.length).setValues([merged]).setFontWeight('bold');
      sheet.setFrozenRows(1);
    }

    // ---- collect values ----
    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headerRow.map(function (h) {
      if (h === 'Timestamp') return new Date();
      var key = keys.indexOf(h);
      return key === -1 ? '' : (p[h] || '');
    });

    // ---- save uploaded files to Drive ----
    if (!isInquiry) {
      var urls = [];
      var i = 0;
      while (p['file_' + i + '_name']) {
        try {
          var name = String(p['file_' + i + '_name']);
          var mime = String(p['file_' + i + '_mime'] || 'application/octet-stream');
          var data = String(p['file_' + i + '_data'] || '');
          if (data && data.length < 11000000) { // ~8 MB binary
            var blob = Utilities.newBlob(Utilities.base64Decode(data), mime, name);
            var folder = getUploadFolder_(String(p.company_name || 'Vendor'));
            var file = folder.createFile(blob);
            file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
            urls.push(file.getName() + ' - ' + file.getUrl());
          }
        } catch (err) { /* skip this file, keep the row */ }
        i++;
      }
      var fIdx = headerRow.indexOf('Files');
      if (fIdx !== -1 && urls.length) row[fIdx] = urls.join('\n');
    }

    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function doGet() {
  return json_({ ok: true, service: 'InfiSource form backend', time: new Date() });
}

/** Folder: InfiSource Website Uploads / <Company> */
function getUploadFolder_(company) {
  var safe = String(company || 'Vendor').replace(/[\\/:*?"<>|]/g, '-').substring(0, 80);
  var it = DriveApp.getFoldersByName(FOLDER_NAME);
  var root = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
  var sub = root.getFoldersByName(safe);
  return sub.hasNext() ? sub.next() : root.createFolder(safe);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Optional: run once from the editor to test. */
function test() {
  var e = { parameter: { form_type: 'inquiry', keys: 'name,email,message', name: 'Test User', email: 'test@example.com', message: 'Hello' } };
  Logger.log(doPost(e));
}
