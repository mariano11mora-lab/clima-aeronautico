const input = document.getElementById("searchInput");
const resultado = document.getElementById("resultado");
const favoritosContainer = document.getElementById("favoritos");

// ==========================
// ⭐ FAVORITOS (LOCALSTORAGE)
// ==========================
function getFavoritos() {
  return JSON.parse(localStorage.getItem("favoritos")) || [];
}

function toggleFavorito(codigo) {
  let favs = getFavoritos();

  if (favs.includes(codigo)) {
    favs = favs.filter(f => f !== codigo);
  } else {
    favs.push(codigo);
  }

  localStorage.setItem("favoritos", JSON.stringify(favs));
  renderFavoritos();
  renderResultado(codigo); // refresca estrella
}

// ==========================
// 📊 RENDER FAVORITOS
// ==========================
function renderFavoritos() {
  const favs = getFavoritos();

  if (favs.length === 0) {
    favoritosContainer.innerHTML = "";
    return;
  }

  favoritosContainer.innerHTML = `
    <h2>⭐ Favoritos</h2>
    <div class="fav-list">
      ${favs.map(f => `
        <div class="fav-item" onclick="buscar('${f}')">
          ${f}
        </div>
      `).join("")}
    </div>
  `;
}

// ==========================
// 🔍 BUSCAR (API AVWX)
// ==========================
async function buscar(codigo) {
  input.value = codigo;
  renderResultado(codigo);
}

async function renderResultado(codigo) {
  const apiKey = "TU_API_KEY_AQUI";

  try {
    const metarRes = await fetch(`https://avwx.rest/api/metar/${codigo}?token=${apiKey}`);
    const tafRes = await fetch(`https://avwx.rest/api/taf/${codigo}?token=${apiKey}`);

    const metar = await metarRes.json();
    const taf = await tafRes.json();

    const esFav = getFavoritos().includes(codigo);

    resultado.innerHTML = `
      <h2>
        ${codigo}
        <span class="star ${esFav ? "active" : ""}" onclick="toggleFavorito('${codigo}')">
          ★
        </span>
      </h2>

      <p><strong>METAR:</strong> ${metar.raw || "No disponible"}</p>
      <p><strong>TAF:</strong> ${taf.raw || "No disponible"}</p>
    `;
  } catch (error) {
    resultado.innerHTML = "<p>Error al obtener datos</p>";
  }
}

// ==========================
// ⌨️ ENTER PARA BUSCAR
// ==========================
input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    buscar(input.value.toUpperCase());
  }
});

// ==========================
// 🚀 INIT
// ==========================
renderFavoritos();