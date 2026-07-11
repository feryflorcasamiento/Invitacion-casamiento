// GOOGLE APPS SCRIPT
// Pegá este código en Extensiones > Apps Script dentro de tu Google Sheet.
//
// La hoja debe tener estas columnas en la fila 1:
// A ID
// B Invitado 1
// C Invitado 2
// D Asiste 1
// E Asiste 2
// F Total
// G Canción
// H Fecha
// I Estado

const SHEET_NAME = "Hoja 1";

function doGet(e) {
  const action = e.parameter.action || "";
  const callback = e.parameter.callback || "callback";

  if (action === "getGuest") {
    const result = getGuestById_(e.parameter.id);
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(result)})`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: "Acción inválida" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const action = e.parameter.action || "";

  if (action === "rsvp") {
    const result = saveRsvp_(
      e.parameter.id,
      e.parameter.attendance,
      e.parameter.song || ""
    );

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: "Acción inválida" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No existe la hoja "${SHEET_NAME}"`);
  return sheet;
}

function normalizeId_(value) {
  return String(value || "").trim().padStart(3, "0");
}

function getGuestById_(id) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const targetId = normalizeId_(id);

  for (let i = 1; i < values.length; i++) {
    const rowId = normalizeId_(values[i][0]);
    if (rowId === targetId) {
      return {
        ok: true,
        id: rowId,
        guest1: values[i][1] || "",
        guest2: values[i][2] || ""
      };
    }
  }

  return { ok: false, error: "Invitación no encontrada" };
}

function saveRsvp_(id, attendance, song) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const targetId = normalizeId_(id);

  for (let i = 1; i < values.length; i++) {
    const rowId = normalizeId_(values[i][0]);

    if (rowId === targetId) {
      const guest1 = values[i][1] || "";
      const guest2 = values[i][2] || "";

      let attends1 = "No";
      let attends2 = guest2 ? "No" : "";
      let total = 0;
      let status = "No asisten";

      if (attendance === "both" && guest2) {
        attends1 = "Sí";
        attends2 = "Sí";
        total = 2;
        status = "Confirmado";
      } else if (attendance === "guest1") {
        attends1 = "Sí";
        attends2 = guest2 ? "No" : "";
        total = 1;
        status = "Confirmado";
      } else if (attendance === "guest2" && guest2) {
        attends1 = "No";
        attends2 = "Sí";
        total = 1;
        status = "Confirmado";
      }

      const rowNumber = i + 1;
      sheet.getRange(rowNumber, 4, 1, 6).setValues([[
        attends1,
        attends2,
        total,
        song,
        new Date(),
        status
      ]]);

      return { ok: true };
    }
  }

  return { ok: false, error: "Invitación no encontrada" };
}
