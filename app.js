const API_KEY = "TU_API_KEY_AQUI";

// 🔍 BUSCAR CLIMA
async function buscarClima() {
  const icao = document.getElementById("icao").value.toUpperCase();

  const metarEl = document.getElementById("metar");
  const tafEl = document.getElementById("taf");
  const statusEl = document.getElementById("status");
  const iconoEl = document.getElementById("icono");
  const textoStatusEl = document.getElementById("textoStatus");

  metarEl.textContent = "Cargando...";
  tafEl.textContent = "Cargando...";
  textoStatusEl.textContent = "...";

  try {
    const metarRes = await fetch(`https://avwx.rest/api/metar/${icao}?token=${API_KEY}`);
    const metarData = await metarRes.json();

    const tafRes = await fetch(`https://avwx.rest/api/taf/${icao}?token=${API_KEY}`);
    const tafData = await tafRes.json();

    const resultado = traducirMetar(metarData.raw);

    // 📄 METAR traducido
    metarEl.textContent = resultado.texto;

    // 🎯 ICONO GENERAL
    let icono = "☀️";
    if (metarData.raw.includes("TS")) icono = "⛈️";
    else if (metarData.raw.includes("RA")) icono = "🌧️";
    else if (metarData.raw.includes("FG")) icono = "🌫️";
    else if (metarData.raw.includes("OVC") || metarData.raw.includes("BKN")) icono = "☁️";

    iconoEl.textContent = icono;

    // 🎯 TEXTO STATUS
    let texto =
      resultado.categoria === "VFR" ? "VFR - Apto" :
      resultado.categoria === "MVFR" ? "MVFR - Precaución" :
      resultado.categoria === "IFR" ? "IFR - No apto" :
      "LIFR - No apto";

    textoStatusEl.textContent = texto;

    // 🎨 COLOR SEGÚN CONDICIÓN
    if (resultado.categoria === "VFR") {
      statusEl.style.background = "linear-gradient(135deg, #00c853, #009624)";
    } else if (resultado.categoria === "MVFR") {
      statusEl.style.background = "linear-gradient(135deg, #ffd600, #ffab00)";
    } else {
      statusEl.style.background = "linear-gradient(135deg, #d50000, #9b0000)";
    }

    // 📊 RESUMEN
    document.getElementById("resumen").innerHTML = `
      <div class="item"><span>🌬️</span>${resultado.viento || "-"}</div>
      <div class="item"><span>👁️</span>${resultado.visibilidad || "-"}</div>
      <div class="item"><span>☁️</span>${resultado.nubes || "-"}</div>
      <div class="item"><span>⚠️</span>${resultado.fenomenos || "Sin fenómenos"}</div>
    `;

    // 🚨 ALERTAS
    document.getElementById("alertas").innerHTML =
      resultado.alertas.length
        ? resultado.alertas.map(a => `<div class="alerta">${a}</div>`).join("")
        : "<div class='ok'>✅ Sin alertas</div>";

    // 📄 TAF traducido
    tafEl.textContent = traducirTaf(tafData.raw);

    // ✨ ANIMACIÓN
    statusEl.classList.remove("update");
    void statusEl.offsetWidth;
    statusEl.classList.add("update");

  } catch (error) {
    metarEl.textContent = "Error al obtener datos";
    tafEl.textContent = "Error al obtener datos";
    textoStatusEl.textContent = "Error";
    console.error(error);
  }
}

// ✈️ TRADUCIR METAR
function traducirMetar(metar) {
  if (!metar) return { texto: "Sin datos", categoria: "DESCONOCIDO" };

  const partes = metar.split(" ");
  let resultado = [];

  let visibilidad = "";
  let ceiling = 9999;
  let viento = "";
  let nubes = "";
  let fenomenos = "";

  partes.forEach(p => {

    // 🌬️ VIENTO
    if (p.includes("KT")) {
      const dir = p.substring(0, 3);
      const vel = parseInt(p.substring(3, 5));
      viento = `${dir}° ${vel}kt`;
      resultado.push(`🌬️ Viento: ${viento}`);
    }

    // 👁️ VISIBILIDAD
    else if (!isNaN(p)) {
      visibilidad = `${parseInt(p)} m`;
      resultado.push(`👁️ Visibilidad: ${visibilidad}`);
    }

    // ☁️ NUBES
    else if (p.match(/(FEW|SCT|BKN|OVC)\d{3}/)) {
      const tipo = p.substring(0, 3);
      const altura = parseInt(p.substring(3)) * 100;

      const tipos = {
        FEW: "Pocas",
        SCT: "Dispersas",
        BKN: "Fragmentadas",
        OVC: "Cubierto"
      };

      nubes = `${tipos[tipo]} ${altura} ft`;

      if (tipo === "BKN" || tipo === "OVC") {
        ceiling = altura;
      }

      resultado.push(`☁️ ${nubes}`);
    }

    // 🌡️ TEMP
    else if (p.includes("/")) {
      const [temp, dew] = p.split("/");
      resultado.push(`🌡️ Temp: ${temp}°C / Rocío: ${dew}°C`);
    }

    // 🔵 PRESIÓN
    else if (p.startsWith("Q")) {
      resultado.push(`🔵 Presión: ${p.substring(1)} hPa`);
    }

    // ⚠️ FENÓMENOS (independiente)
    if (p.includes("RA")) fenomenos += "🌧️ ";
    if (p.includes("TS")) fenomenos += "⛈️ ";
    if (p === "FG") fenomenos += "🌫️ ";
  });

  // 🟢 CATEGORÍA
  let categoria = "VFR";
  const visNum = parseInt(visibilidad) || 10000;

  if (visNum < 5000 || ceiling < 1500) categoria = "MVFR";
  if (visNum < 3000 || ceiling < 1000) categoria = "IFR";
  if (visNum < 1000 || ceiling < 500) categoria = "LIFR";

  resultado.push(`\n✈️ Condición: ${categoria}`);

  let apto = "🟢 Apto";
  if (categoria === "IFR" || categoria === "LIFR") apto = "🔴 No apto VFR";
  else if (categoria === "MVFR") apto = "🟡 Precaución";

  resultado.push(apto);

  // 🚨 ALERTAS
  let alertas = [];

  if (visNum < 3000) alertas.push("🚨 Visibilidad crítica");
  else if (visNum < 5000) alertas.push("⚠️ Visibilidad reducida");

  if (ceiling < 500) alertas.push("🚨 Techo muy bajo");
  else if (ceiling < 1000) alertas.push("⚠️ Techo bajo");

  if (fenomenos.includes("⛈️")) alertas.push("⛈️ Tormenta activa");
  if (fenomenos.includes("🌫️")) alertas.push("🌫️ Niebla presente");

  const vientoNum = parseInt(viento.split(" ")[1]) || 0;
  if (vientoNum > 25) alertas.push("💨 Viento fuerte");

  return {
    texto: resultado.join("\n"),
    categoria,
    viento,
    visibilidad,
    nubes,
    fenomenos,
    alertas
  };
}

// 📄 TRADUCIR TAF
function traducirTaf(taf) {
  if (!taf) return "Sin datos";

  return taf
    .replace(/TEMPO/g, "\n⏱️ Temporalmente:")
    .replace(/BECMG/g, "\n🔄 Cambiando a:")
    .replace(/FM/g, "\n➡️ Desde:")
    .replace(/RA/g, "🌧️ Lluvia")
    .replace(/TS/g, "⛈️ Tormenta")
    .replace(/FG/g, "🌫️ Niebla");
}

// ⌨️ ENTER PARA BUSCAR
document.getElementById("icao").addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    buscarClima();
  }
});