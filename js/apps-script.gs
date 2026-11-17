const SPREADSHEET_ID = "18LtK3AhvaYVkVluuvjSvWcL463XrT7ieMnh_wMoDzAw";

function doGet(e) {
  try {
    const requested = String(e?.parameter?.sheet || "songs").trim().toLowerCase();
    const sheetName = requested === "guest" || requested === "guest-requests" || requested === "guest request"
      ? "Guest Request"
      : "Wedding Songs";

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);

    if (!sheet) {
      return jsonResponse({ success: false, error: `Sheet "${sheetName}" not found.` });
    }

    return jsonResponse(readSheetObjects(sheet));
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e?.postData?.contents || "{}");
    const action = String(body.action || "").trim();

    if (action === "addGuestRequest") {
      const sheet = getSheet_("Guest Request");
      const request = body;
      const id = request.id || `req-${Date.now()}`;

      const row = objectToRow_(sheet, {
        ID: id,
        "Judul Lagu": request.title || "",
        "Band / Artis": request.artist || "",
        Requester: request.name || request.requester || "",
        Notes: request.note || request.notes || "",
        Status: request.status || "Pending",
        Chord: request.key || request.chord || "",
        "Reference Arrangement": request.reference || "",
        Durasi: request.duration || request["Durasi Aksi"] || "",
        Performer: request.performer || "",
      });

      sheet.appendRow(row);
      return jsonResponse({ success: true, action, id });
    }

    if (action === "updateGuestRequest") {
      const sheet = getSheet_("Guest Request");
      const id = String(body.id || "").trim();
      const status = String(body.status || "").trim();
      if (!id || !status) throw new Error("ID dan status wajib diisi.");

      const result = updateById_(sheet, id, { Status: status });
      if (!result.updated) throw new Error(`Request dengan ID "${id}" tidak ditemukan.`);
      return jsonResponse({ success: true, action, id, status });
    }

    if (action === "addToMainPlaylist") {
      const guestSheet = getSheet_("Guest Request");
      const songsSheet = getSheet_("Wedding Songs");
      const request = body.request || {};

      const title = String(request.title || "").trim();
      if (!title) throw new Error("Judul lagu kosong.");

      // Prevent duplicate main-playlist entries by title.
      const existing = readSheetObjects(songsSheet).some(r =>
        String(r.Title || r["Judul Lagu"] || "").trim().toLowerCase() === title.toLowerCase()
      );

      if (!existing) {
        const nextId = nextSongId_(songsSheet);
        objectToAppend_(songsSheet, {
          ID: nextId,
          Title: title,
          Artist: request.artist || "",
          Duration: request.duration || "",
          "Personal Notes": "",
          Category: "Guest Request",
          Performer: request.performer || "TBD",
          Status: "Quite Good",
          Chord: request.key || "",
          Reference: request.reference || "",
          Notes: request.note || "",
          Section: "Main Event"
        });
      }

      const guestId = String(request.id || "").trim();
      if (guestId) updateById_(guestSheet, guestId, { Status: "Approved" });

      return jsonResponse({ success: true, action, title, added: !existing });
    }

    throw new Error(`Action "${action}" tidak dikenal.`);
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

function getSheet_(name) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(name);
  if (!sheet) throw new Error(`Sheet "${name}" not found.`);
  return sheet;
}

function readSheetObjects(sheet) {
  const values = sheet.getDataRange().getValues();
  const display = sheet.getDataRange().getDisplayValues();
  if (!values.length) return [];

  const headers = values[0];
  return values.slice(1).map((row, i) => {
    const item = {};
    headers.forEach((header, j) => {
      const key = String(header).trim();
      if (!key) return;
      let value = row[j];
      if (["Duration", "Durasi", "Durasi Aksi"].includes(key)) value = display[i + 1][j];
      item[key] = value == null ? "" : value;
    });
    return item;
  }).filter(item => {
    const title = item.Title || item["Judul Lagu"] || item["Judul"] || "";
    return String(title).trim() !== "";
  });
}

function updateById_(sheet, id, updates) {
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return { updated: false };

  const headers = values[0].map(h => String(h).trim());
  const idIndex = headers.findIndex(h => h.toLowerCase() === "id");
  if (idIndex < 0) throw new Error(`Kolom ID tidak ditemukan di sheet "${sheet.getName()}".`);

  const rowIndex = values.findIndex((row, i) => i > 0 && String(row[idIndex]).trim() === id);
  if (rowIndex < 0) return { updated: false };

  Object.entries(updates).forEach(([key, value]) => {
    const colIndex = headers.findIndex(h => h.toLowerCase() === String(key).toLowerCase());
    if (colIndex >= 0) sheet.getRange(rowIndex + 1, colIndex + 1).setValue(value);
  });

  return { updated: true };
}

function objectToRow_(sheet, obj) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0]
    .map(h => String(h).trim());
  return headers.map(header => obj[header] ?? "");
}

function objectToAppend_(sheet, obj) {
  sheet.appendRow(objectToRow_(sheet, obj));
}

function nextSongId_(sheet) {
  const rows = readSheetObjects(sheet);
  let max = 0;
  rows.forEach(row => {
    const id = String(row.ID || row.Id || "").trim();
    const m = id.match(/^song-(\d+)$/i);
    if (m) max = Math.max(max, Number(m[1]));
  });
  return `song-${String(max + 1).padStart(3, "0")}`;
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
