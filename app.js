// =======================
// CONFIG API
// =======================
const API_KEY = "7QaTMHGqVWTff57_z1Vmvlf5C_CwwZtlBAVdXd0LKSs";

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
    console.error(error);
    document.getElementById("textoStatus").innerText = "Error al obtener datos";
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

  let resumenTexto = "Condiciones generales buenas";
  let icono = "✈️";

  // VISIBILIDAD
  let vis = 9999;

if (metar.visibility) {
  if (metar.visibility.value) {
    vis = metar.visibility.value;
  } else if (metar.visibility.repr?.includes("SM")) {
    const millas = parseFloat(metar.visibility.repr);
    vis = millas * 1600; // convertir a metros aprox
  }
}

  let visTexto = "👁️ Visibilidad desconocida";
  if (vis >= 8000) visTexto = "👁️ Visibilidad excelente";
  else if (vis >= 5000) visTexto = "👁️ Buena visibilidad";
  else if (vis >= 3000) visTexto = "👁️ Visibilidad reducida";
  else visTexto = "👁️ Baja visibilidad";

  // VIENTO
  let vientoVel = metar.wind_speed?.value || 0;

  let vientoTexto = "🌬️ Sin datos de viento";
  if (vientoVel > 0) {
    if (vientoVel < 10) vientoTexto = "🌬️ Viento leve";
    else if (vientoVel < 20) vientoTexto = "🌬️ Viento moderado";
    else vientoTexto = "🌬️ Viento fuerte";
  }

  // NUBES
  let nubesTexto = "☀️ Cielo despejado";
  let ceiling = 9999;

  if (metar.clouds && metar.clouds.length > 0) {
    const capa = metar.clouds[0];
    ceiling = capa.altitude || 9999;

    if (capa.type === "FEW") nubesTexto = "🌤️ Pocas nubes";
    else if (capa.type === "SCT") nubesTexto = "⛅ Nubosidad dispersa";
    else if (capa.type === "BKN") nubesTexto = "☁️ Nubosidad significativa";
    else if (capa.type === "OVC") nubesTexto = "☁️ Cielo cubierto";
  }

  // FENÓMENOS
  const raw = metar.raw;

  if (raw.includes("TS")) {
    resumenTexto = "Tormenta en la zona";
    icono = "⛈️";
  } else if (raw.includes("RA")) {
    resumenTexto = "Condiciones lluviosas";
    icono = "🌧️";
  } else if (raw.includes("FG")) {
    resumenTexto = "Niebla presente";
    icono = "🌫️";
    const tendencia = obtenerTrendTAF(taf);
  }

 
// 👇 ACÁ PEGÁS ESTO
function obtenerTrendTAF(taf) {
  if (!taf || !taf.raw) return "Sin TAF";

  const texto = taf.raw;

  const malo = ["TS", "RA", "FG", "BKN", "OVC"];
  const bueno = ["NSC", "SKC", "FEW", "SCT"];

  let empeora = malo.some(cond => texto.includes(cond));
  let mejora = bueno.some(cond => texto.includes(cond));

  if (empeora && !mejora) return "📉 Empeora";
  if (mejora && !empeora) return "📈 Mejora";
  if (empeora && mejora) return "⚠️ Variable";

  return "➖ Sin cambios";
}
  // =======================
// UI SIN INTERPRETACIÓN
// =======================

document.getElementById("textoStatus").innerHTML = `
  <div>${resumenTexto}</div>
  <div style="font-size:13px; margin-top:5px; opacity:0.8;">
    ${vientoTexto} • ${visTexto} • ${nubesTexto}
  </div>
  <div style="font-size:12px; margin-top:6px; opacity:0.6;">
    ${tendencia}
  </div>
`;

document.getElementById("status").style.background = "#1e1e1e";

  // =======================
  // UI
  // =======================

  // METAR / TAF
  document.getElementById("metar").innerText = metar.raw || "Sin METAR";
  document.getElementById("taf").innerText = taf?.raw || "Sin TAF";

  // RESUMEN CARDS
  const viento = metar.wind_speed
    ? `${metar.wind_direction?.value || ""}° ${metar.wind_speed.value}kt`
    : "N/D";

  let visibilidad = "N/D";

if (metar.visibility) {
  const vis = metar.visibility;

  if (vis.repr && vis.repr.includes("SM")) {
    // Está en millas
    const millas = parseFloat(vis.repr);
    const km = Math.round(millas * 1.6);
    visibilidad = `${millas} SM (~${km} km)`;
  } else if (vis.value) {
    // Está en metros
    if (vis.value >= 9999) {
      visibilidad = "10 km o más";
    } else {
      visibilidad = `${vis.value} m`;
    }
  }
}

  const nubes = metar.clouds?.length
    ? `${metar.clouds[0].type} ${metar.clouds[0].altitude} ft`
    : "N/D";

  document.getElementById("resumen").innerHTML = `
    <div class="card">🌬️ ${viento}</div>
    <div class="card">👁️ ${visibilidad}</div>
    <div class="card">☁️ ${nubes}</div>
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