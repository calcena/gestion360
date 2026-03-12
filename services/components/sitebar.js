function showLateralMenu() {
  document.getElementById("lateral-menu").classList.add("open");
  document.getElementById("menu-overlay").classList.add("active");
  document.body.style.overflow = "hidden";
}

function hideLateralMenu() {
  document.getElementById("lateral-menu").classList.remove("open");
  document.getElementById("menu-overlay").classList.remove("active");
  document.body.style.overflow = ""; // Restaura scroll
}

function menuAction(action, deep) {
  hideLateralMenu();
  var basePath = ".";
  if (deep == 1) {
    basePath = "..";
  } else if (deep == 2) {
    basePath = "../..";
  } else if (deep == 3) {
    basePath = "../../..";
  }
  // Aquí puedes redirigir, cargar contenido, etc.
  switch (action) {
    case "inicio":
      window.location.href = `${basePath}/main.php`;
      break;
    case "crear_tarea":
      window.location.href = `${basePath}/envios/envio.php?modo=nuevo`;
      break;
    case "salir":
      window.location.href = `${basePath}/../index.php`;
      break;
    // Añade más casos según necesites
    default:
      alert('Función "' + action + '" no implementada aún.');
  }
}

// Cerrar menú al pulsar Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    hideLateralMenu();
  }
});


const searchParam = async (newValue) => {
  sessionStorage.setItem("buscador", newValue);
  await getListAllTareas();
};

// Event listeners assigned on DOMContentLoaded (replaces inline handlers)
document.addEventListener("DOMContentLoaded", () => {
  // Search input keyup listener (replaces onkeyup)
  const searchInput = document.getElementById("buscador");
  if (searchInput) {
    searchInput.addEventListener("keyup", (e) => {
      searchParam(e.target.value);
    });
  }

  // Menu items click delegation (replaces onclick)
  document.querySelectorAll(".menu-item").forEach(item => {
    item.addEventListener("click", () => {
      const action = item.getAttribute("data-action");
      const deep = parseInt(item.getAttribute("data-nav-deep"));
      menuAction(action, deep);
    });
  });

  // Overlay click listener (replaces onclick)
  const overlay = document.getElementById("menu-overlay");
  if (overlay) {
    overlay.addEventListener("click", hideLateralMenu);
  }
});
