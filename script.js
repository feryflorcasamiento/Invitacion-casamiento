// 1) Pegá aquí la URL de la aplicación web de Google Apps Script.
// Ejemplo: https://script.google.com/macros/s/XXXXXXXXXXXX/exec
const API_URL = "PEGAR_URL_DE_APPS_SCRIPT_AQUI";

// 2) Completaremos estos datos más adelante.
const CBU = "CBU A COMPLETAR";
const INSTAGRAM_URL = "";

const weddingDate = new Date("2026-10-16T20:00:00-03:00");

const params = new URLSearchParams(window.location.search);
const guestId = params.get("id") || "";

const welcome = document.getElementById("welcome");
const invitation = document.getElementById("invitation");
const openInvitation = document.getElementById("openInvitation");
const guestNames = document.getElementById("guestNames");
const onlyGuest1Label = document.getElementById("onlyGuest1Label");
const onlyGuest2Label = document.getElementById("onlyGuest2Label");
const cbuText = document.getElementById("cbuText");
const instagramButton = document.getElementById("instagramButton");
const form = document.getElementById("rsvpForm");
const formMessage = document.getElementById("formMessage");
const submitButton = document.getElementById("submitButton");

let guestData = {
  id: guestId,
  guest1: "Invitado 1",
  guest2: "Invitado 2"
};

openInvitation.addEventListener("click", () => {
  welcome.classList.add("hidden");
  invitation.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

function updateCountdown() {
  const now = new Date();
  const diff = weddingDate - now;

  if (diff <= 0) {
    ["days", "hours", "minutes", "seconds"].forEach(id => {
      document.getElementById(id).textContent = "0";
    });
    return;
  }

  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  document.getElementById("days").textContent = days;
  document.getElementById("hours").textContent = hours;
  document.getElementById("minutes").textContent = minutes;
  document.getElementById("seconds").textContent = seconds;
}

updateCountdown();
setInterval(updateCountdown, 1000);

function applyGuestData(data) {
  guestData = data;

  if (data.guest2) {
    guestNames.textContent = `${data.guest1} y ${data.guest2}`;
    onlyGuest1Label.innerHTML = `<input type="radio" name="attendance" value="guest1"> Asiste solo ${data.guest1}`;
    onlyGuest2Label.innerHTML = `<input type="radio" name="attendance" value="guest2"> Asiste solo ${data.guest2}`;
  } else {
    guestNames.textContent = data.guest1;
    document.querySelector('input[value="both"]').closest("label").style.display = "none";
    onlyGuest1Label.innerHTML = `<input type="radio" name="attendance" value="guest1"> Sí, asistiré`;
    onlyGuest2Label.style.display = "none";
  }
}

window.receiveGuest = function(data) {
  if (data && data.ok) {
    applyGuestData(data);
  } else {
    guestNames.textContent = "Invitación no encontrada";
    form.style.display = "none";
  }
};

function loadGuest() {
  if (!guestId) {
    guestNames.textContent = "Falta el código de invitación";
    form.style.display = "none";
    return;
  }

  if (!API_URL.startsWith("https://script.google.com/")) {
    guestNames.textContent = "Invitación de prueba";
    applyGuestData({
      id: guestId,
      guest1: "Invitado 1",
      guest2: "Invitado 2"
    });
    return;
  }

  const script = document.createElement("script");
  script.src = `${API_URL}?action=getGuest&id=${encodeURIComponent(guestId)}&callback=receiveGuest`;
  script.onerror = () => {
    guestNames.textContent = "No pudimos cargar esta invitación";
    form.style.display = "none";
  };
  document.body.appendChild(script);
}

loadGuest();

cbuText.textContent = CBU;

document.getElementById("copyCbu").addEventListener("click", async () => {
  if (CBU === "CBU A COMPLETAR") {
    alert("Todavía falta cargar el CBU.");
    return;
  }
  await navigator.clipboard.writeText(CBU);
  alert("CBU copiado.");
});

if (INSTAGRAM_URL) {
  instagramButton.href = INSTAGRAM_URL;
  instagramButton.classList.remove("disabled");
  instagramButton.removeAttribute("aria-disabled");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const attendance = formData.get("attendance");
  const song = formData.get("song") || "";

  if (!attendance) return;

  if (!API_URL.startsWith("https://script.google.com/")) {
    formMessage.textContent = "La invitación está en modo de prueba. Falta conectar Google Sheets.";
    formMessage.className = "form-message error";
    return;
  }

  const payload = new URLSearchParams({
    action: "rsvp",
    id: guestData.id,
    attendance,
    song
  });

  submitButton.disabled = true;
  submitButton.textContent = "Enviando...";

  try {
    await fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: payload.toString()
    });

    form.reset();
    formMessage.textContent = "¡Gracias por confirmar! Estamos muy felices de compartir este día con ustedes.";
    formMessage.className = "form-message success";
  } catch (error) {
    formMessage.textContent = "No pudimos guardar la respuesta. Probá nuevamente.";
    formMessage.className = "form-message error";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Enviar confirmación";
  }
});
