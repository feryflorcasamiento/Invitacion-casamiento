// GOOGLE APPS SCRIPT
// Hoja: Hoja 1
// Columnas:
// A ID
// B Invitado 1
// C Invitado 2
// D Invitado 3
// E Invitado 4
// F Asiste 1
// G Asiste 2
// H Asiste 3
// I Asiste 4
// J Total
// K Canción
// L Restricciones
// M Fecha
// N Estado

const SHEET_NAME = "Hoja 1";
const EMAIL_DESTINO = "feryflorcasamiento@gmail.com";

function doGet(e) {
  const callback = e.parameter.callback || "callback";
  const result = e.parameter.action === "getGuest"
    ? getGuest_(e.parameter.id)
    : { ok:false, error:"Acción inválida" };

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(result)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const result = e.parameter.action === "rsvp"
    ? saveRsvp_(e.parameter)
    : { ok:false, error:"Acción inválida" };

  return ContentService
    .createTextOutput(JSON.stringify(result))
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

function getGuest_(id) {
  const values = getSheet_().getDataRange().getDisplayValues();
  const target = normalizeId_(id);

  for (let i = 1; i < values.length; i++) {
    if (normalizeId_(values[i][0]) === target) {
      return {
        ok: true,
        id: target,
        guests: values[i].slice(1, 5)
      };
    }
  }

  return { ok:false, error:"Invitación no encontrada" };
}

function saveRsvp_(params) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const target = normalizeId_(params.id);
  const attendance = JSON.parse(params.attendance || "[]");

  for (let i = 1; i < values.length; i++) {
    if (normalizeId_(values[i][0]) !== target) continue;

    const guests = values[i].slice(1, 5);
    const normalized = [0,1,2,3].map(index =>
      guests[index] ? (attendance[index] || "No") : ""
    );

    const total = normalized.filter(value => value === "Sí").length;
    const status = total > 0 ? "Confirmado" : "No asisten";
    const row = i + 1;

    sheet.getRange(row, 6, 1, 9).setValues([[
      normalized[0],
      normalized[1],
      normalized[2],
      normalized[3],
      total,
      params.song || "",
      params.food || "",
      new Date(),
      status
    ]]);

    const namesYes = guests.filter((name, index) => name && normalized[index] === "Sí");
    const namesNo = guests.filter((name, index) => name && normalized[index] === "No");

    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: `Confirmación boda · Invitación ${target}`,
      htmlBody: `
        <h2>Nueva confirmación</h2>
        <p><strong>Asisten:</strong> ${namesYes.join(", ") || "Nadie"}</p>
        <p><strong>No asisten:</strong> ${namesNo.join(", ") || "-"}</p>
        <p><strong>Canción:</strong> ${params.song || "-"}</p>
        <p><strong>Restricciones:</strong> ${params.food || "-"}</p>
      `
    });

    return { ok:true };
  }

  return { ok:false, error:"Invitación no encontrada" };
}
