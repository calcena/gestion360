const INACTIVITY_TIMEOUT = 29 * 60 * 1000; // 30 minutos en milisegundos

let sessionTimer;

let arrFiltros = [];

/**
 * Reinicia el temporizador de inactividad.
 */
function resetTimer(deep) {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(function () {
    logoutDueToInactivity(deep);
  }, INACTIVITY_TIMEOUT);
}

/**
 * Función que se ejecuta cuando el temporizador expira.
 */
function logoutDueToInactivity(deep) {
  console.log("Sesión expirada por inactividad. Redirigiendo a login.");
  if (deep == 0) {
    basePath = "";
  } else if (deep == 1) {
    basePath = "../";
  } else if (deep == 2) {
    basePath = "../../";
  }
  // Opcional: Mostrar una alerta amigable antes de redirigir
  Swal.fire({
    icon: "warning",
    title: "Sesión Expirada",
    text: "Tu sesión ha expirado por inactividad. Por favor, vuelve a iniciar sesión.",
    showConfirmButton: false,
    timer: 3000, // Da 3 segundos para leer el mensaje
  }).then(() => {
    console.log(basePath);
    window.location.href = `${basePath}index.php`;
    // Nota: Asegúrate de que 'index.php' sea la ruta correcta a tu login.
  });
}

/**
 * Inicializa el manejo de eventos para detectar la actividad.
 */
function startSessionWatcher(deep) {
  const events = ["mousemove", "mousedown", "keypress", "scroll", "touchstart"];

  events.forEach((event) => {
    // CORRECCIÓN 2: Envolver la llamada en una función anónima.
    document.addEventListener(
      event,
      function () {
        resetTimer(deep);
      },
      true
    );
  });

  // El inicio también debe ser llamado directamente, sin envolverlo en el DOMContentLoaded
  resetTimer(deep);
  console.log("Watcher de sesión iniciado.");
}

// ##################################################################################################################

const loadDefaultDate = async () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // +1 porque getMonth() es 0-11
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function obtenerFechaHoyConHora() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const hh = String(hoy.getHours()).padStart(2, "0");
  const min = String(hoy.getMinutes()).padStart(2, "0");
  const ss = String(hoy.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

const formatFechaISO = (fecha) => {
  if (!fecha || typeof fecha !== "string" || fecha.length < 10) {
    return "";
  }
  const [datePart, timePart] = fecha.split(" ");
  const [year, month, day] = datePart.split("-");
  let hours = "";
  let minutes = "";

  if (timePart) {
    const timeComponents = timePart.split(":");
    if (timeComponents.length >= 2) {
      hours = timeComponents[0];
      minutes = timeComponents[1];
    }
  }
  if (
    !year ||
    !month ||
    !day ||
    isNaN(Number(year)) ||
    isNaN(Number(month)) ||
    isNaN(Number(day))
  ) {
    return "";
  }

  const dia = String(day).padStart(2, "0");
  const mes = String(month).padStart(2, "0");

  const formattedDate = `${dia}/${mes}/${year}`;
  if (hours && minutes) {
    return `${formattedDate} ${hours}:${minutes}`;
  }

  return formattedDate;
};

const formatFechaTimeISO = (fecha) => {
  if (!fecha) return "";

  try {
    const dateObj = new Date(fecha);
    if (isNaN(dateObj.getTime())) {
      return "";
    }
    const dia = String(dateObj.getDate()).padStart(2, "0");
    const mes = String(dateObj.getMonth() + 1).padStart(2, "0"); // Los meses van de 0-11
    const año = dateObj.getFullYear();
    const horas = String(dateObj.getHours()).padStart(2, "0");
    const minutos = String(dateObj.getMinutes()).padStart(2, "0");
    return `${dia}/${mes}/${año} ${horas}:${minutos}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return "";
  }
};

function selectContainsText(selectId, subcadena) {
  const select = document.getElementById(selectId);
  const textoBuscado = subcadena.trim().toLowerCase(); // normalizado para búsqueda insensible a mayúsculas

  for (let i = 0; i < select.options.length; i++) {
    const textoOpcion = select.options[i].textContent.trim().toLowerCase();
    if (textoOpcion.includes(textoBuscado)) {
      select.selectedIndex = i;
      return;
    }
  }

  console.warn(`No se encontró ninguna opción que contenga: "${subcadena}"`);
}

const getPrioridades = async (deep = 1) => {
  var baseUrl = "..";
  if (deep == 2) {
    baseUrl = "../..";
  }
  const data = {};
  try {
    const response = await axios.post(
      `${baseUrl}/api/helpers/helper.php?getPrioridades`,
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.success) {
      const select = document.getElementById("operacion_select");
      select.innerHTML = null;
      const option = document.createElement("option");
      option.value = 0;
      option.textContent = "Selecciona...";
      select.appendChild(option);
      await response.data.content.forEach((element) => {
        const option = document.createElement("option");
        option.value = element.id;
        option.textContent = element.nombre;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.log("getPrioridades", err.response.data.error);
  }
};

const getEstados = async (deep = 1) => {
  var baseUrl = "..";
  if (deep == 2) {
    baseUrl = "../..";
  }
  const data = {};
  try {
    const response = await axios.post(
      `${baseUrl}/api/helpers/helper.php?getEstados`,
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.success) {
      const select = document.getElementById("operacion_select");
      select.innerHTML = null;
      const option = document.createElement("option");
      option.value = 0;
      option.textContent = "Selecciona...";
      select.appendChild(option);
      await response.data.content.forEach((element) => {
        const option = document.createElement("option");
        option.value = element.id;
        option.textContent = element.nombre;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.log("getEstados", err.response.data.error);
  }
};

const removeSessionItems = (keys) => {
  const keyArray = Array.isArray(keys) ? keys : [keys];
  keyArray.forEach((key) => sessionStorage.removeItem(key));
};

const formatNumberTask = async (data, padSpaces) => {
  const tareaId = Number(data) + 1;
  const paddedId = tareaId.toString().padStart(padSpaces, "0");
  const currentYear = new Date().getFullYear();
  const abbreviatedYear = currentYear.toString().slice(-2);
  const formattedNumber = `${paddedId}/${abbreviatedYear}`;
  return formattedNumber;
};

const formatNumberSubtask = async (data) => {
  const subtareaId = Number(data) + 1;
  console.log(subtareaId)
  const paddedId = subtareaId.toString().padStart(2, "0");
  const formattedNumber = `${paddedId}`;
  return formattedNumber;
};

const crearBackup = async () => {
  const urlEndpoint = "../../helpers/backup.php";
  try {
    const response = await fetch(urlEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        throw new Error(
          `Error de servidor (${response.status}): Respuesta no JSON.`
        );
      }
      throw new Error(
        `Error de servidor (${response.status}): ${
          errorData.message || "Error desconocido del backend"
        }`
      );
    }
    const data = await response.json();
    if (data.success) {
      console.log("✅ Backup finalizado con éxito:", data.message);
    } else {
      console.error("❌ Error lógico al realizar el backup:", data.message);
    }
  } catch (error) {
    console.error("❌ Fallo crítico en el backup:", error.message);
  }
};

const convertirTiempo = async (totalSegundos) => {
  const segundos = Math.max(0, Math.floor(totalSegundos));
  const horas = Math.floor(segundos / 3600);
  const minutos = Math.floor((segundos % 3600) / 60);
  const horasFormateadas = String(horas).padStart(2, "0");
  const minutosFormateados = String(minutos).padStart(2, "0");
  return `${horasFormateadas}h:${minutosFormateados}m`;
};
