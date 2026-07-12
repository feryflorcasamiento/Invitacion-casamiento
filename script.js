const CONFIG = {
  apiUrl: "PEGAR_URL_DE_APPS_SCRIPT_AQUI",
  weddingDate: "2026-10-16T20:00:00-03:00",
  confirmationDeadline: "2026-08-15T23:59:59-03:00",
  florWhatsApp: "5491132937869",
  ferWhatsApp: "5491134173998"
};

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const invitationId = params.get("id") || "001";
let guestData = { id: invitationId, guests: ["Invitado 1", "Invitado 2", "", ""] };

$("#openInvitation").addEventListener("click", () => {
  $("#opening").style.display = "none";
  $("#mainContent").hidden = false;
  window.scrollTo(0, 0);
});

function updateCountdown() {
  const diff = new Date(CONFIG.weddingDate) - new Date();
  const safe = Math.max(diff, 0);
  $("#days").textContent = Math.floor(safe / 86400000);
  $("#hours").textContent = Math.floor((safe % 86400000) / 3600000);
  $("#minutes").textContent = Math.floor((safe % 3600000) / 60000);
  $("#seconds").textContent = Math.floor((safe % 60000) / 1000);
}
updateCountdown();
setInterval(updateCountdown, 1000);

$("#copyAlias").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("FERYFLOR.BODA");
    $("#copyAlias").textContent = "Alias copiado";
    setTimeout(() => $("#copyAlias").textContent = "Copiar alias", 1800);
  } catch {
    alert("Alias: FERYFLOR.BODA");
  }
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function displayGuests(data) {
  guestData = data;
  const names = data.guests.filter(Boolean);
  $("#guestTitle").textContent = names.length ? names.join(" · ") : "Invitación";
  $("#guestChoices").innerHTML = names.map((name, index) => `
    <div class="guest-choice">
      <h3>${escapeHtml(name)}</h3>
      <label><input type="radio" name="guest_${index + 1}" value="Sí" required> Asiste</label>
      <label><input type="radio" name="guest_${index + 1}" value="No" required> No asiste</label>
    </div>
  `).join("");
}

window.receiveGuest = function(response) {
  if (response?.ok) {
    displayGuests(response);
  } else {
    $("#guestTitle").textContent = "Invitación no encontrada";
    $("#rsvpForm").style.display = "none";
  }
};

function loadGuest() {
  if (!CONFIG.apiUrl.startsWith("https://script.google.com/")) {
    displayGuests(guestData);
    return;
  }

  const tag = document.createElement("script");
  tag.src = `${CONFIG.apiUrl}?action=getGuest&id=${encodeURIComponent(invitationId)}&callback=receiveGuest`;
  tag.onerror = () => {
    $("#guestTitle").textContent = "No pudimos cargar la invitación";
    $("#rsvpForm").style.display = "none";
  };
  document.body.appendChild(tag);
}
loadGuest();

$("#rsvpForm").addEventListener("submit", async (event) => {
  event.preventDefault();
  const message = $("#formMessage");

  if (new Date() > new Date(CONFIG.confirmationDeadline)) {
    message.className = "form-message error";
    message.textContent = "El plazo de confirmación finalizó el 15 de agosto de 2026.";
    return;
  }

  const activeGuests = guestData.guests.filter(Boolean);
  const attendance = activeGuests.map((_, i) => {
    const checked = document.querySelector(`input[name="guest_${i + 1}"]:checked`);
    return checked ? checked.value : "";
  });

  if (attendance.some(value => !value)) {
    message.className = "form-message error";
    message.textContent = "Indicá si asiste o no cada persona invitada.";
    return;
  }

  const song = $("#song").value.trim();
  const food = $("#food").value.trim();
  const payload = new URLSearchParams({
    action: "rsvp",
    id: guestData.id,
    song,
    food,
    attendance: JSON.stringify(attendance)
  });

  const button = $("#submitRsvp");
  button.disabled = true;
  button.textContent = "Guardando...";

  if (CONFIG.apiUrl.startsWith("https://script.google.com/")) {
    try {
      await fetch(CONFIG.apiUrl, {
        method: "POST",
        mode: "no-cors",
        headers: {"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
        body: payload.toString()
      });
    } catch {
      message.className = "form-message error";
      message.textContent = "No pudimos guardar la respuesta. Probá nuevamente.";
      button.disabled = false;
      button.textContent = "Enviar confirmación";
      return;
    }
  }

  const attending = activeGuests.filter((_, i) => attendance[i] === "Sí");
  const notAttending = activeGuests.filter((_, i) => attendance[i] === "No");
  const text = [
    "Hola Flor y Fer, confirmamos nuestra asistencia al casamiento.",
    "",
    attending.length ? "✅ Asisten: " + attending.join(", ") : "✅ No asistirá ninguna persona de esta invitación.",
    notAttending.length ? "❌ No asisten: " + notAttending.join(", ") : "",
    song ? "🎵 Canción: " + song : "",
    food ? "🍽️ Restricciones: " + food : ""
  ].filter(Boolean).join("\n");

  $("#sendFlor").href = `https://wa.me/${CONFIG.florWhatsApp}?text=${encodeURIComponent(text)}`;
  $("#sendFer").href = `https://wa.me/${CONFIG.ferWhatsApp}?text=${encodeURIComponent(text)}`;

  message.className = "form-message success";
  message.textContent = "¡Gracias! La respuesta quedó guardada y también se envió al correo del casamiento.";
  button.textContent = "Confirmación enviada";
  $("#whatsappChoice").hidden = false;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: .12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const weddingMusic=document.getElementById("weddingMusic");
const musicToggle=document.getElementById("musicToggle");

async function startWeddingMusic(){
  try{
    weddingMusic.volume=.55;
    await weddingMusic.play();
    musicToggle.hidden=false;
    musicToggle.textContent="🔊";
  }catch(e){
    musicToggle.hidden=false;
    musicToggle.textContent="▶";
  }
}

document.getElementById("openInvitation").addEventListener("click",startWeddingMusic);

musicToggle.addEventListener("click",async()=>{
  if(weddingMusic.paused){
    await weddingMusic.play();
    musicToggle.textContent="🔊";
  }else{
    weddingMusic.pause();
    musicToggle.textContent="🔇";
  }
});
