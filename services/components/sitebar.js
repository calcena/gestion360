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
