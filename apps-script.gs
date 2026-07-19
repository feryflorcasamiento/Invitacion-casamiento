const SHEET_NAME = "Hoja 1";
const EMAIL_DESTINO = "feryflorcasamiento@gmail.com";
const SITE_URL = "https://fernandoyflorencia.vercel.app";

function doGet(e) {
  const callback = safeCallback_(e.parameter.callback || "callback");
  const result = e.parameter.action === "getGuest"
    ? getGuest_(e.parameter.key || e.parameter.slug || e.parameter.id)
    : { ok: false, error: "Acción inválida" };

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(result)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e) {
  const result = e.parameter.action === "rsvp"
    ? saveRsvp_(e.parameter)
    : { ok: false, error: "Acción inválida" };

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Invitaciones")
    .addItem("Crear enlaces personalizados", "crearEnlacesPersonalizados")
    .addToUi();
}

/**
 * Ejecutar una vez desde Apps Script o desde el menú Invitaciones.
 * Agrega/actualiza las columnas Slug y Link personalizado en la misma hoja.
 */
function crearEnlacesPersonalizados() {
  const sheet = sheet_();
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return;

  let headers = values[0].map(normalizeHeader_);
  let slugCol = headers.indexOf("slug") + 1;
  let linkCol = headers.indexOf("link personalizado") + 1;

  if (!slugCol) {
    slugCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, slugCol).setValue("Slug");
  }
  if (!linkCol) {
    linkCol = sheet.getLastColumn() + 1;
    sheet.getRange(1, linkCol).setValue("Link personalizado");
  }

  const map = headerMap_(sheet);
  const used = new Set();
  const outputSlugs = [];
  const outputLinks = [];

  for (let row = 2; row <= sheet.getLastRow(); row++) {
    const id = normalizeId_(sheet.getRange(row, map.id).getDisplayValue());
    const guests = [1, 2, 3, 4]
      .map(n => sheet.getRange(row, map[`invitado ${n}`]).getDisplayValue().trim())
      .filter(Boolean);

    let slug = slugify_(guests.join(" y ") || `invitacion-${id}`);
    if (!slug) slug = `invitacion-${id}`;

    const baseSlug = slug;
    let counter = 2;
    while (used.has(slug)) slug = `${baseSlug}-${counter++}`;
    used.add(slug);

    outputSlugs.push([slug]);
    outputLinks.push([`${SITE_URL}/${slug}`]);
  }

  sheet.getRange(2, slugCol, outputSlugs.length, 1).setValues(outputSlugs);
  sheet.getRange(2, linkCol, outputLinks.length, 1).setValues(outputLinks);
  sheet.autoResizeColumn(slugCol);
  sheet.autoResizeColumn(linkCol);
}

function getGuest_(key) {
  const sheet = sheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const map = headerMap_(sheet);
  const wanted = String(key || "").trim();
  const wantedId = normalizeId_(wanted);
  const wantedSlug = slugify_(wanted);

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = normalizeId_(row[map.id - 1]);
    const slug = map.slug ? slugify_(row[map.slug - 1]) : "";

    if ((slug && slug === wantedSlug) || id === wantedId) {
      return {
        ok: true,
        id,
        slug,
        guests: [1, 2, 3, 4].map(n => row[map[`invitado ${n}`] - 1] || "")
      };
    }
  }
  return { ok: false };
}

function saveRsvp_(params) {
  const sheet = sheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const map = headerMap_(sheet);
  const wantedId = normalizeId_(params.id);
  const attendance = JSON.parse(params.attendance || "[]");

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const id = normalizeId_(row[map.id - 1]);
    if (id !== wantedId) continue;

    const rowNumber = i + 1;
    const guests = [1, 2, 3, 4].map(n => row[map[`invitado ${n}`] - 1] || "");
    const answers = guests.map((guest, index) => guest ? (attendance[index] || "No") : "");
    const total = answers.filter(value => value === "Sí").length;
    const status = total ? "Confirmado" : "No asisten";

    [1, 2, 3, 4].forEach((n, index) => {
      sheet.getRange(rowNumber, map[`asiste ${n}`]).setValue(answers[index]);
    });
    sheet.getRange(rowNumber, map.total).setValue(total);
    sheet.getRange(rowNumber, map["canción"]).setValue(params.song || "");
    sheet.getRange(rowNumber, map.restricciones).setValue(params.food || "");
    sheet.getRange(rowNumber, map.fecha).setValue(new Date());
    sheet.getRange(rowNumber, map.estado).setValue(status);

    const yes = guests.filter((guest, index) => guest && answers[index] === "Sí");
    const no = guests.filter((guest, index) => guest && answers[index] === "No");

    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: `Confirmación boda · Invitación ${id}`,
      htmlBody:
        `<h2>Nueva confirmación</h2>` +
        `<p><b>Asisten:</b> ${yes.join(", ") || "Nadie"}</p>` +
        `<p><b>No asisten:</b> ${no.join(", ") || "-"}</p>` +
        `<p><b>Canción:</b> ${params.song || "-"}</p>` +
        `<p><b>Restricciones:</b> ${params.food || "-"}</p>`
    });

    return { ok: true };
  }
  return { ok: false };
}

function sheet_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error(`No existe la hoja “${SHEET_NAME}”`);
  return sheet;
}

function headerMap_(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn())
    .getDisplayValues()[0]
    .map(normalizeHeader_);
  const required = [
    "id", "invitado 1", "invitado 2", "invitado 3", "invitado 4",
    "asiste 1", "asiste 2", "asiste 3", "asiste 4", "total",
    "canción", "restricciones", "fecha", "estado"
  ];
  const map = {};
  headers.forEach((header, index) => { if (header) map[header] = index + 1; });
  required.forEach(header => {
    if (!map[header]) throw new Error(`Falta la columna “${header}” en la fila 1`);
  });
  return map;
}

function normalizeHeader_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeId_(value) {
  return String(value || "").trim().padStart(3, "0");
}

function slugify_(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function safeCallback_(value) {
  const callback = String(value || "callback");
  return /^[A-Za-z_$][0-9A-Za-z_$\.]*$/.test(callback) ? callback : "callback";
}
