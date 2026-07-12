// PEGAR EN GOOGLE SHEETS: Extensiones > Apps Script
// Estructura de columnas:
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

function doGet(e){
  const callback = e.parameter.callback || "callback";
  const result = e.parameter.action === "getGuest"
    ? getGuest_(e.parameter.id)
    : {ok:false,error:"Acción inválida"};

  return ContentService
    .createTextOutput(`${callback}(${JSON.stringify(result)})`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function doPost(e){
  const result = e.parameter.action === "rsvp"
    ? saveRsvp_(e.parameter)
    : {ok:false,error:"Acción inválida"};

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function sheet_(){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if(!sheet) throw new Error(`No existe la hoja "${SHEET_NAME}"`);
  return sheet;
}

function id_(value){
  return String(value || "").trim().padStart(3,"0");
}

function getGuest_(id){
  const values = sheet_().getDataRange().getDisplayValues();
  const target = id_(id);
  for(let i=1;i<values.length;i++){
    if(id_(values[i][0]) === target){
      return {ok:true,id:target,guests:values[i].slice(1,5)};
    }
  }
  return {ok:false,error:"Invitación no encontrada"};
}

function saveRsvp_(p){
  const sheet = sheet_();
  const values = sheet.getDataRange().getDisplayValues();
  const target = id_(p.id);
  const attendance = JSON.parse(p.attendance || "[]");

  for(let i=1;i<values.length;i++){
    if(id_(values[i][0]) !== target) continue;

    const guests = values[i].slice(1,5);
    const normalized = [0,1,2,3].map(x => guests[x] ? (attendance[x] || "No") : "");
    const total = normalized.filter(x => x === "Sí").length;
    const status = total ? "Confirmado" : "No asisten";
    const row = i + 1;

    sheet.getRange(row,6,1,9).setValues([[
      normalized[0], normalized[1], normalized[2], normalized[3],
      total, p.song || "", p.food || "", new Date(), status
    ]]);

    const namesYes = guests.filter((g,x)=>g && normalized[x]==="Sí");
    const namesNo = guests.filter((g,x)=>g && normalized[x]==="No");

    MailApp.sendEmail({
      to: EMAIL_DESTINO,
      subject: `Confirmación boda · Invitación ${target}`,
      htmlBody: `
        <h2>Nueva confirmación</h2>
        <p><strong>Asisten:</strong> ${namesYes.join(", ") || "Nadie"}</p>
        <p><strong>No asisten:</strong> ${namesNo.join(", ") || "-"}</p>
        <p><strong>Canción:</strong> ${p.song || "-"}</p>
        <p><strong>Restricciones:</strong> ${p.food || "-"}</p>`
    });

    return {ok:true};
  }
  return {ok:false,error:"Invitación no encontrada"};
}
