# FNVerse Wedding Music Planner — Google Sheet Staging

Staging ini sudah disiapkan agar sumber data Wedding Song bisa dibaca dari Google Sheets melalui Google Apps Script Web App.

## 1. Struktur Google Sheet

Gunakan header baris pertama:

`ID | Title | Artist | Duration | Personal Notes | Category | Performer | Status | Chord | Reference | Notes | Section`

Contoh nilai Status:
- Confirmed
- Quite Good
- So So
- Cancelled

Contoh Section:
- Opening
- Main Event
- Closing

## 2. Apps Script

Apps Script harus mengembalikan JSON. Format paling sederhana:

```js
function doGet() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Wedding Songs');
  const values = sheet.getDataRange().getDisplayValues();
  const headers = values.shift();
  const data = values.filter(row => row.join('').trim()).map(row => {
    const item = {};
    headers.forEach((header, i) => item[header] = row[i]);
    return item;
  });
  return ContentService
    .createTextOutput(JSON.stringify({ data }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

Deploy sebagai **Web app** dengan akses yang memungkinkan website membaca endpoint tersebut.

## 3. Sambungkan ke website

Buka `js/app.js`, cari:

```js
const GOOGLE_SHEET_API_URL = "";
```

Isi dengan URL Web App Apps Script:

```js
const GOOGLE_SHEET_API_URL = "URL_WEB_APP_APPS_SCRIPT";
```

Jangan taruh spreadsheet ID atau credential rahasia di JavaScript frontend.

## 4. Fallback aman

Kalau URL kosong, Apps Script error, timeout, atau response tidak valid, website otomatis tetap memakai `songs.js` / data lokal yang sudah ada.

## 5. Played Checklist

Status Played tetap menggunakan `localStorage` browser, sehingga tidak ikut berubah ketika data lagu di Google Sheet diperbarui.

## 6. Catatan staging

- `songs.js` sengaja dipertahankan sebagai fallback.
- Google Sheet menjadi sumber data saat `GOOGLE_SHEET_API_URL` diisi.
- Data Google Sheet akan dinormalisasi ke format internal aplikasi.
- Admin edit/add pada staging masih tersimpan lokal; perubahan master lagu sebaiknya dilakukan di Google Sheet.
