const SPREADSHEET_ID = "18LtK3AhvaYVkVluuvjSvWcL463XrT7ieMnh_wMoDzAw";

function doGet(e) {
  const requestedSheet = e && e.parameter && e.parameter.sheet
    ? e.parameter.sheet
    : "Wedding Songs";

  const sheet = SpreadsheetApp
    .openById(SPREADSHEET_ID)
    .getSheetByName(requestedSheet);

  if (!sheet) {
    return jsonResponse({
      error: `Sheet "${requestedSheet}" not found.`
    });
  }

  const values = sheet.getDataRange().getValues();
  const displayValues = sheet.getDataRange().getDisplayValues();

  if (!values.length) return jsonResponse([]);

  const headers = values.shift();
  displayValues.shift();

  const data = values.map((row, rowIndex) => {
    const item = {};
    headers.forEach((header, index) => {
      let value = row[index];
      // Keep duration as the displayed text from Sheets (e.g. 03:45 / 01:05:30).
      if (["Duration", "Durasi", "Durasi Aksi"].includes(String(header).trim())) {
        value = displayValues[rowIndex][index];
      }
      item[header] = value;
    });
    return item;
  }).filter(item => {
    const title = item.Title || item["Judul Lagu"] || item["Judul"] || "";
    return String(title).trim() !== "";
  });

  return jsonResponse(data);
}

function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
