// =======================
// CONFIG API
// =======================
const API_KEY = "RcIUo_t51KXc3pM-t2jA3XfanUvk-NB94lROeL-3u2I"; // ← dejá la tuya

// =======================
// FETCH METAR + TAF
// =======================
async function buscarClima() {
  const icao = document.getElementById("icao").value.toUpperCase();
  if (!icao) return;

  document.getElementById("textoStatus").innerText = "Cargando...";

  try {
    const metarRes = await fetch(`https://avwx.rest/api/metar/${icao}?token=${API_KEY}`);
    const tafRes = await fetch(`https://avwx.rest/api/taf/${icao}?token=${API_KEY}`);

    const metarData = await metarRes.json();
    const tafData = await tafRes.json();

    mostrarDatos(metarData, tafData);
    actualizarBotonFav();

  } catch (error) {
    document.getElementById("textoStatus").innerText = "Error al obtener datos";
    console.error(error);
  }
}

// =======================
// MOSTRAR DATOS
// =======================
function mostrarDatos(metar, taf) {
  if (!metar || !metar.raw) {
    document.getElementById("textoStatus").innerText = "Sin datos";
    return;
  }

  // METAR RAW
  document.getElementById("metar").innerText = metar.raw || "Sin METAR";

  // TAF RAW
  document.getElementById("taf").innerText = taf.raw || "Sin TAF";

  // =======================
  // PARSEO BÁSICO
  // =======================
  const viento = metar.wind_speed ? `${metar.wind_direction.value}° ${metar.wind_speed.value}kt` : "N/D";
  const visibilidad = metar.visibility ? `${metar.visibility.value} m` : "N/D";
  const nubes = metar.clouds?.length
    ? `${metar.clouds[0].type} ${metar.clouds[0].altitude} ft`
    : "N/D";

  // =======================
  // LÓGICA VFR / IFR
  // =======================
// =======================
// LÓGICA VFR / IFR MEJORADA
// =======================

// VISIBILIDAD
let vis = metar.visibility?.value;

if (!vis) {
  // fallback si no viene visibilidad clara
  vis = 9999;
}

// CEILING (solo BKN / OVC cuentan)
let ceiling = null;

if (metar.clouds && metar.clouds.length > 0) {
  const capas = metar.clouds.filter(c =>
    c.type === "BKN" || c.type === "OVC"
  );

  if (capas.length > 0) {
    ceiling = capas[0].altitude;
  }
}

// Si no hay techo → lo consideramos alto (cielo OK)
if (!ceiling) {
  ceiling = 9999;
}

// =======================
// CLASIFICACIÓN
// =======================
let estado = "IFR";
let color = "#e74c3c";
let icono = "⛔";

if (vis >= 5000 && ceiling >= 3000) {
  estado = "VFR - Apto";
  color = "#00c853";
  icono = "☀️";
} else if (vis >= 3000 && ceiling >= 1000) {
  estado = "MVFR";
  color = "#ff9800";
  icono = "⚠️";
}

  // =======================
  // UI
  // =======================
  document.getElementById("textoStatus").innerText = estado;
  document.getElementById("icono").innerText = icono;
  document.getElementById("status").style.background = color;

  document.getElementById("resumen").innerHTML = `
    <div class="card">
      🌬️ ${viento}
    </div>
    <div class="card">
      👁️ ${visibilidad}
    </div>
    <div class="card">
      ☁️ ${nubes}
    </div>
  `;
}

// =======================
// ⭐ FAVORITOS
// =======================

function getFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function guardarFavoritos(favs) {
  localStorage.setItem("favoritos", JSON.stringify(favs));
}

function toggleFavorito() {
  const icao = document.getElementById("icao").value.toUpperCase();
  if (!icao) return;

  let favs = getFavoritos();

  if (favs.includes(icao)) {
    favs = favs.filter(f => f !== icao);
  } else {
    favs.push(icao);
  }

  guardarFavoritos(favs);
  renderFavoritos();
  actualizarBotonFav();
}

function renderFavoritos() {
  const cont = document.getElementById("favoritos");
  const favs = getFavoritos();

  if (favs.length === 0) {
    cont.innerHTML = "";
    return;
  }

  cont.innerHTML = `
    <div class="favoritos-inner">
      ${favs.map(f => `
        <div class="fav-item" onclick="seleccionarFavorito('${f}')">
          ✈️ ${f}
        </div>
      `).join("")}
    </div>
  `;
}

function seleccionarFavorito(icao) {
  document.getElementById("icao").value = icao;
  buscarClima();
  actualizarBotonFav();
}

function actualizarBotonFav() {
  const icao = document.getElementById("icao").value.toUpperCase();
  const favs = getFavoritos();
  const btn = document.getElementById("btnFav");

  if (!btn) return;

  btn.innerText = favs.includes(icao) ? "★" : "☆";
}

// =======================
// INIT
// =======================
renderFavoritos();