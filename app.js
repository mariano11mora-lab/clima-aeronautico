const API_KEY = "RcIUo_t51KXc3pM-t2jA3XfanUvk-NB94lROeL-3u2I";

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

    // 📄 TEXTO METAR
    metarEl.textContent = resultado.texto;

    // 🎯 ICONO SEGÚN CLIMA
    let icono = "☀️";

    if (metarData.raw.includes("TS")) icono = "⛈️";
    else if (metarData.raw.includes("RA")) icono = "🌧️";
    else if (metarData.raw.includes("FG")) icono = "🌫️";
    else if (metarData.raw.includes("OVC") || metarData.raw.includes("BKN")) icono = "☁️";

    // 🎯 TEXTO STATUS
    let texto =
      resultado.categoria === "VFR" ? "VFR - Apto" :
      resultado.categoria === "MVFR" ? "MVFR - Precaución" :
      resultado.categoria === "IFR" ? "IFR - No apto" :
      "LIFR - No apto";

    // 👉 aplicar
    iconoEl.textContent = icono;
    textoStatusEl.textContent = texto;

    // 🎨 COLOR SEMÁFORO
    statusEl.style.background = "linear-gradient(135deg, #00c853, #009624)";
      resultado.categoria === "VFR" ? "#0a3" :
      resultado.categoria === "MVFR" ? "#cc0" :
      resultado.categoria === "IFR" ? "#c00" :
      "#800";

    // 📄 TAF traducido
    tafEl.textContent = traducirTaf(tafData.raw);

  } catch (error) {
    metarEl.textContent = "Error al obtener datos";
    tafEl.textContent = "Error al obtener datos";
    textoStatusEl.textContent = "Error";
    console.error(error);
  }
}

// ✈️ TRADUCCIÓN METAR
function traducirMetar(metar) {
  if (!metar) return { texto: "Sin datos", categoria: "DESCONOCIDO" };

  const partes = metar.split(" ");
  let resultado = [];

  let visibilidad = 10000;
  let ceiling = 9999;

  partes.forEach(p => {

    if (p.includes("KT")) {
      const dir = p.substring(0, 3);
      const vel = parseInt(p.substring(3, 5));
      resultado.push(`🌬️ Viento: ${dir}° a ${vel} kt`);
    }

    else if (!isNaN(p)) {
      visibilidad = parseInt(p);
      resultado.push(`👁️ Visibilidad: ${visibilidad} m`);
    }

    else if (p.match(/(FEW|SCT|BKN|OVC)\d{3}/)) {
      const tipo = p.substring(0, 3);
      const altura = parseInt(p.substring(3)) * 100;

      const tipos = {
        FEW: "Pocas",
        SCT: "Dispersas",
        BKN: "Fragmentadas",
        OVC: "Cubierto"
      };

      if (tipo === "BKN" || tipo === "OVC") {
        ceiling = altura;
      }

      resultado.push(`☁️ ${tipos[tipo]} a ${altura} ft`);
    }

    else if (p.includes("/")) {
      const [temp, dew] = p.split("/");
      resultado.push(`🌡️ Temp: ${temp}°C / Rocío: ${dew}°C`);
    }

    else if (p.startsWith("Q")) {
      resultado.push(`🔵 Presión: ${p.substring(1)} hPa`);
    }

    else if (p.includes("RA")) {
      resultado.push("🌧️ Lluvia");
    }

    else if (p.includes("TS")) {
      resultado.push("⛈️ Tormenta");
    }

    else if (p === "FG") {
      resultado.push("🌫️ Niebla");
    }

  });

  // 🟢 CLASIFICACIÓN
  let categoria = "VFR";

  if (visibilidad < 5000 || ceiling < 1500) categoria = "MVFR";
  if (visibilidad < 3000 || ceiling < 1000) categoria = "IFR";
  if (visibilidad < 1000 || ceiling < 500) categoria = "LIFR";

  resultado.push(`\n✈️ Condición: ${categoria}`);

  // ✈️ APTO
  let apto = "🟢 Apto";
  if (categoria === "IFR" || categoria === "LIFR") apto = "🔴 No apto VFR";
  else if (categoria === "MVFR") apto = "🟡 Precaución";

  resultado.push(apto);

  return {
    texto: resultado.join("\n"),
    categoria
  };
}

// 📄 TRADUCCIÓN TAF
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
statusEl.classList.remove("update");
void statusEl.offsetWidth; // reinicia animación
statusEl.classList.add("update");