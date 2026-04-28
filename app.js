const API_KEY = "PdYzcUJxk02rm2Aoahb70iCdrT1v_RrgSxt2D_XvR28";

// ======================
// BUSCAR CLIMA
// ======================
async function buscarClima() {
  const icao = document
    .getElementById("inputICAO")
    .value.trim()
    .toUpperCase();

  if (!icao) return;

  setLoading();

  try {
    const metarRes = await fetch(
      `https://avwx.rest/api/metar/${icao}?token=${API_KEY}`
    );

    const tafRes = await fetch(
      `https://avwx.rest/api/taf/${icao}?token=${API_KEY}`
    );

    const metar = await metarRes.json();
    const taf = await tafRes.json();

    if (!metar.raw) {
      setError("Aeropuerto no encontrado");
      return;
    }

    renderData(metar, taf);
  } catch (error) {
    setError("Error al obtener datos");
  }
}

// ======================
// ESTADOS UI
// ======================
function setLoading() {
  document.getElementById("textoStatus").innerHTML = "✈️ Cargando...";
}

function setError(msg) {
  document.getElementById("textoStatus").innerHTML = msg;
}

// ======================
// RENDER PRINCIPAL
// ======================
function renderData(metar, taf) {
  const vis = getVisibility(metar);
  const ceiling = getCeiling(metar);
  const wind = metar.wind_speed?.value || 0;
  const windDir = metar.wind_direction?.value || "---";
  const temp = metar.temperature?.value ?? "--";
  const dew = metar.dewpoint?.value ?? "--";
  const qnh = metar.altimeter?.value ?? "--";

  const category = getFlightCategory(vis, ceiling);
  const categoryInfo = getCategoryVisual(category);

  document.getElementById("textoStatus").innerHTML = `
    <div style="font-size:26px;font-weight:700;">
      ${categoryInfo.icon} ${category}
    </div>
    <div style="margin-top:6px;font-size:14px;opacity:.8;">
      ${categoryInfo.text}
    </div>
  `;

  document.getElementById("resumen").innerHTML = `
    <div class="item"><span>🌬️</span>${windDir}° ${wind}kt</div>
    <div class="item"><span>👁️</span>${vis} m</div>
    <div class="item"><span>☁️</span>${ceiling} ft</div>
    <div class="item"><span>🌡️</span>${temp}° / ${dew}°</div>
    <div class="item"><span>🧭</span>${qnh}</div>
  `;

  document.getElementById("metar").innerText = metar.raw || "";
  document.getElementById("taf").innerText = taf?.raw || "Sin TAF";

  renderAlerts(metar, wind, vis);
}

// ======================
// CATEGORÍA DE VUELO
// ======================
function getFlightCategory(vis, ceiling) {
  if (vis < 3000 || ceiling < 1000) return "IFR";
  if (vis < 5000 || ceiling < 3000) return "MVFR";
  return "VFR";
}

function getCategoryVisual(cat) {
  if (cat === "VFR") {
    return {
      icon: "🟢",
      text: "Condiciones favorables para volar"
    };
  }

  if (cat === "MVFR") {
    return {
      icon: "🟡",
      text: "Precaución operativa"
    };
  }

  return {
    icon: "🔴",
    text: "Condiciones limitadas"
  };
}

// ======================
// VISIBILIDAD
// ======================
function getVisibility(metar) {
  if (metar.visibility?.value) {
    return metar.visibility.value;
  }

  return 9999;
}

// ======================
// TECHO
// ======================
function getCeiling(metar) {
  if (!metar.clouds || metar.clouds.length === 0) {
    return 9999;
  }

  const capas = metar.clouds.filter(
    c => c.type === "BKN" || c.type === "OVC"
  );

  if (capas.length === 0) return 9999;

  return capas[0].altitude * 100;
}

// ======================
// ALERTAS
// ======================
function renderAlerts(metar, wind, vis) {
  let html = "";

  const raw = metar.raw || "";

  if (wind >= 20) {
    html += `<div class="alerta">🌬️ Viento fuerte</div>`;
  }

  if (vis < 3000) {
    html += `<div class="alerta">👁️ Baja visibilidad</div>`;
  }

  if (raw.includes("TS")) {
    html += `<div class="alerta">⛈️ Tormenta reportada</div>`;
  }

  if (raw.includes("FG")) {
    html += `<div class="alerta">🌫️ Niebla presente</div>`;
  }

  if (html === "") {
    html = `<div class="ok">✅ Sin alertas relevantes</div>`;
  }

  document.getElementById("alertas").innerHTML = html;
}