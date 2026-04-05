const API_KEY = "7QaTMHGqVWTff57_z1Vmvlf5C_CwwZtlBAVdXd0LKSs";

// =======================
// BUSCAR METAR + TAF
// =======================
async function buscarClima() {
  const icao = document.getElementById("inputICAO").value.toUpperCase();

  document.getElementById("textoStatus").innerText = "Cargando...";

  try {
    const metarRes = await fetch(`https://avwx.rest/api/metar/${icao}?token=${API_KEY}`);
    const tafRes = await fetch(`https://avwx.rest/api/taf/${icao}?token=${API_KEY}`);

    const metar = await metarRes.json();
    const taf = await tafRes.json();

    mostrarDatos(metar, taf);
  } catch (error) {
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

  // =======================
  // VISIBILIDAD
  // =======================
  let vis = 9999;

  if (metar.visibility) {
    if (metar.visibility.value) {
      vis = metar.visibility.value;
    } else if (metar.visibility.repr?.includes("SM")) {
      const millas = parseFloat(metar.visibility.repr);
      vis = millas * 1600;
    }
  }

  let visTexto = "👁️ Visibilidad desconocida";

  if (vis >= 8000) visTexto = "👁️ Visibilidad excelente";
  else if (vis >= 5000) visTexto = "👁️ Buena visibilidad";
  else if (vis >= 3000) visTexto = "👁️ Visibilidad reducida";
  else visTexto = "👁️ Baja visibilidad";

  // =======================
  // VIENTO
  // =======================
  let vientoVel = metar.wind_speed?.value || 0;

  let vientoTexto = "🌬️ Sin datos de viento";

  if (vientoVel > 0) {
    if (vientoVel < 10) vientoTexto = "🌬️ Viento leve";
    else if (vientoVel < 20) vientoTexto = "🌬️ Viento moderado";
    else vientoTexto = "🌬️ Viento fuerte";
  }

  // =======================
  // NUBES
  // =======================
  let nubesTexto = "☀️ Cielo despejado";

  if (metar.clouds && metar.clouds.length > 0) {
    const capa = metar.clouds[0];

    if (capa.type === "FEW") nubesTexto = "🌤️ Pocas nubes";
    else if (capa.type === "SCT") nubesTexto = "⛅ Nubosidad dispersa";
    else if (capa.type === "BKN") nubesTexto = "☁️ Nubosidad significativa";
    else if (capa.type === "OVC") nubesTexto = "☁️ Cielo cubierto";
  }

  // =======================
  // FENÓMENOS
  // =======================
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
  }

  // =======================
  // UI FINAL
  // =======================
  document.getElementById("textoStatus").innerHTML = `
    <div style="font-size:18px;">
      ${icono} ${resumenTexto}
    </div>
    <div style="font-size:13px; margin-top:5px; opacity:0.8;">
      ${vientoTexto} • ${visTexto} • ${nubesTexto}
    </div>
  `;

  // RAW (opcional)
  document.getElementById("metar").innerText = metar.raw || "";
  document.getElementById("taf").innerText = taf?.raw || "Sin TAF";
}