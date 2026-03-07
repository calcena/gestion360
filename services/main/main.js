let currentCardId = null;
let actionPanel = null;
let closePanelBtn = null;
let overlay = null;
audioHabilitadoPorUsuario = false;
let tituloOriginal = document.title;
let intervaloFlash = null;
let refreshRoleGestor = 15000;
let refreshRoleCoodinador = 15000;
const sonidoAviso = new Audio("../assets/audio/aviso.mp3");
const MAIN_CONTAINER_ID = "card_main_container";
const CARD_SELECTOR = `#${MAIN_CONTAINER_ID} .card`;

const solicitarAutorizacionAudio = () => {
  const preferencia = localStorage.getItem("alertas_sonoras_activas");
  if (preferencia === "true") {
    iniciarIntervaloVerificacion();
    document.addEventListener("click", habilitarContextoAudio, { once: true });
  } else {
    // Primera vez: Invitamos a activar el sistema
    Swal.fire({
      title: "Alertas de Pedidos",
      text: "¿Deseas activar las notificaciones sonoras para nuevos envíos?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, activar",
      cancelButtonText: "No, gracias",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.setItem("alertas_sonoras_activas", "true");
        habilitarContextoAudio();
        iniciarIntervaloVerificacion();
      }
    });
  }
};

function habilitarContextoAudio() {
  if (audioHabilitadoPorUsuario) return;
  sonidoAviso
    .play()
    .then(() => {
      sonidoAviso.pause();
      sonidoAviso.currentTime = 0;
      audioHabilitadoPorUsuario = true;
      console.log("Audio desbloqueado para la sesión.");
    })
    .catch(() => {
      audioHabilitadoPorUsuario = false;
    });
}

function llamarAtencionVisual(mensaje) {
  if (intervaloFlash) return;
  intervaloFlash = setInterval(() => {
    document.title = document.title === mensaje ? tituloOriginal : mensaje;
  }, 1000);
}

function detenerAtencionVisual() {
  clearInterval(intervaloFlash);
  intervaloFlash = null;
  document.title = tituloOriginal;
}

function iniciarIntervaloVerificacion(rol = "default") {
  if (rol != "default") {
    console.log("gestor");
    setInterval(getListAllEnvios, refreshRoleGestor); //accede cada 30 segundos
  } else {
    console.log("coordinador");
    setInterval(comprobarNuevosEnvios, refreshRoleCoodinador); // accede cada 15 segundos
  }
}

const comprobarNuevosEnvios = async () => {
  if (localStorage.getItem("alertas_sonoras_activas") !== "true") return;

  const data = { usuario_id: sessionStorage.getItem("usuario_id") };

  try {
    const response = await axios.post(
      "../api/envios/envio.php?existsNuevosEnvios",
      { data }
    );

    if (response.data.content && response.data.content.counter_envio > 0) {
      await getListAllEnvios();
      sessionStorage.setItem("envios_nuevos", response.data.content.lista_ids);
      llamarAtencionVisual("⚠️ NUEVO ENVÍO");

      Swal.fire({
        text: `Hay ${response.data.content.counter_envio} gestion/es nuevas.`,
        icon: "warning",
        toast: true,
        position: "top-end",
        showConfirmButton: true,
        confirmButtonText: "Actualizar Lista",
        allowOutsideClick: false,
        didOpen: () => {
          // Intentamos sonar. Si ya hubo un clic previo, sonará solo.
          sonidoAviso.currentTime = 0;
          sonidoAviso
            .play()
            .catch(() => console.log("Audio en espera de interacción..."));
        },
      }).then((result) => {
        if (result.isConfirmed) {
          detenerAtencionVisual();
          habilitarContextoAudio();
          getListAllEnvios();
          validarEnviosRecibidos();
        }
      });
    }
  } catch (err) {
    console.error("Error comprobación:", err);
  }
};

const getListAllEnvios = async () => {
  const container = document.getElementById(MAIN_CONTAINER_ID);
  if (container) {
    container.innerHTML =
      '<div class="text-center p-5"><i class="fas fa-spinner fa-spin fa-2x"></i> Cargando...</div>';
  }
  const data = {
    usuario_id: sessionStorage.getItem("usuario_id"),
    filtro_estados: sessionStorage.getItem("filtro_estados"),
    buscador: sessionStorage.getItem("buscador") || "",
  };

  try {
    const response = await axios.post(
      "../api/envios/envio.php?getListAllEnvios",
      { data }
    );

    if (response.data.success) {
      container.innerHTML = await parseTableHtml(response.data.content);
      makeCardsClickable();
    } else {
      container.innerHTML = `<p class="text-center text-danger">Error: ${response.data.message}</p>`;
    }
  } catch (err) {
    console.error("Error API:", err);
    if (container)
      container.innerHTML =
        '<p class="text-center text-danger">Error de conexión.</p>';
  }
};

const parseTableHtml = async (data) => {
  if (!data || data.length === 0)
    return '<p class="text-center text-muted">No se encontraron tareas.</p>';

  return data
    .map((item) => {
      const tareaDescripcion = item.envio_descripcion || "Sin descripción";
      const headerClass = item.recibido == 0 ? "bg-info" : item.bg_class;

      return `
       <div class="task-card mb-3" id="${item.id}">
            <div class="task-card-header ${headerClass} card-header-action d-flex justify-content-between align-items-center"
                 data-card-id="${item.id}" data-card-title="${item.num_envio}" data-card-status="${item.estado_nombre}" data-card-bg-status="${item.estado_color_bg}">
                <div class="d-flex align-items-center gap-2">
                    <span class="task-badge-num">${item.num_envio}</span>
                </div>
                <small class="task-date">${item.envio_registro}</small>
            </div>
            <div class="task-card-body card-body-detail">
                <p class="task-description mb-0">${tareaDescripcion}</p>
                ${item.adjunto ? `<div class="text-end mt-1"><img class="attached-card" src="../assets/images/icons/pdf_envio.png" style="cursor:pointer;width:22px;" onclick="viewAttachFile(event, '${item.adjunto}')" /></div>` : ''}
            </div>
            <div class="task-card-footer d-flex align-items-center">
                <img class="me-2" src="../assets/images/icons/${item.prioridad_icono}" style="width: 18px;">
                <span class="task-status-badge ${item.estado_color_bg} ${item.estado_color_text}">${item.estado_nombre}</span>
                <div class="d-flex align-items-center ms-auto gap-1">
                    <img src="../assets/images/icons/comment.png" style="width:14px;opacity:.7;">
                    <span class="task-comment-count">${item.count_comentarios}</span>
                </div>
            </div>
        </div> `;
    })
    .join("");
};

const validarEnviosRecibidos = async () => {
  const data = {
    envios_nuevos: sessionStorage.getItem("envios_nuevos"),
  };

  try {
    const response = await axios.post(
      "../api/envios/envio.php?enviosRecibidos",
      { data }
    );

    if (response.data.success) {
      await getListAllEnvios();
    }
  } catch (err) {}
};

function initMain() {
  actionPanel = document.getElementById("action-panel");
  closePanelBtn = document.getElementById("close-panel");
  if (closePanelBtn) closePanelBtn.onclick = closeActionPanel;

  if (
    parseInt(sessionStorage.getItem("role_id")) != 1 &&
    parseInt(sessionStorage.getItem("role_id")) != 2
  ) {
    solicitarAutorizacionAudio();
  } else {
    iniciarIntervaloVerificacion("gestor");
  }

  if (!sessionStorage.getItem("filtro_estados")) {
    sessionStorage.setItem("filtro_estados", "1,2");
  }

  getListAllEnvios();
}

function makeCardsClickable() {
  document.querySelectorAll(".card-header-action").forEach((el) => {
    el.onclick = (e) => {
      habilitarContextoAudio();
      handleHeaderClick(e);
    };
  });
  document.querySelectorAll(".card-body-detail").forEach((el) => {
    el.onclick = (e) => {
      habilitarContextoAudio();
      handleBodyClick(e);
    };
  });
}

const handleHeaderClick = (event) => {
  const header = event.currentTarget;
  currentCardId = header.getAttribute("data-card-id");
  const cardTitle = header.getAttribute("data-card-title");
  const cardStatus = header.getAttribute("data-card-status");
  const cardBgStatus = header.getAttribute("data-card-bg-status");
  console.log(cardBgStatus);
  sessionStorage.setItem("envio_id", currentCardId);
  showActionPanel(currentCardId, cardTitle, cardStatus, cardBgStatus);
};

const handleBodyClick = (event) => {
  const body = event.currentTarget;
  const card = body.closest(".card");
  const title = card
    .querySelector(".card-header-action")
    .getAttribute("data-card-title");
  Swal.fire({
    title: `Tarea: ${title}`,
    text: body.innerText,
    confirmButtonText: "Cerrar",
  });
};

function showActionPanel(cardId, cardTitle, cardStatus, cardBgStatus) {
  if (!actionPanel) return;
  actionPanel.style.transform = "translateX(0)";
  overlay =
    document.getElementById("action-panel-overlay") ||
    document.createElement("div");
  if (!overlay.id) {
    overlay.id = "action-panel-overlay";
    overlay.className =
      "position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-25";
    overlay.style.zIndex = "1040";
    overlay.onclick = closeActionPanel;
    document.body.appendChild(overlay);
  }
  overlay.style.display = "block";
  document.getElementById("menu_lateral_num_envio").innerText = cardTitle;
  document.getElementById("menu_lateral_estado").innerText = cardStatus;
  document.getElementById("menu_lateral_estado").classList.add(cardBgStatus);
}

function closeActionPanel() {
  if (actionPanel) actionPanel.style.transform = "translateX(-100%)";
  if (overlay) overlay.style.display = "none";
}

const viewAttachFile = async (event, pdfUrl) => {
  event.stopPropagation();
  habilitarContextoAudio();
  // Configuración inicial de PDF.js
  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDoc = null,
    pageNum = 1,
    scale = 0.7,
    canvas = null,
    ctx = null;

  // Función para renderizar una página específica
  const renderPage = async (num) => {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };
    await page.render(renderContext).promise;
    document.getElementById("page_num").textContent = num;
  };

  Swal.fire({
    html: `
            <div id="pdf-toolbar" class="mb-2 d-flex justify-content-center align-items-center gap-2">
                <button id="prev" class="btn btn-sm btn-secondary"><i class="fas fa-arrow-left"></i></button>
                <span class="viewer-pdf"><span id="page_num"></span> / <span class="viewer-pdf" id="page_count"></span></span>
                <button id="next" class="btn btn-sm btn-secondary"><i class="fas fa-arrow-right"></i></button>
                <div class="vr mx-2"></div>
                <button id="zoom_out" class="btn btn-sm btn-outline-dark"><i class="fas fa-search-minus"></i></button>
                <button id="zoom_in" class="btn btn-sm btn-outline-dark"><i class="fas fa-search-plus"></i></button>
                <button id="zoom_reset" class="btn btn-sm btn-outline-danger viewer-pdf">100%</button>
            </div>
            <div id="pdf-container" style="overflow: auto; max-height: 70vh; border: 1px solid #ccc; background: #eee;">
                <canvas id="pdf-canvas"></canvas>
            </div>
        `,
    width: "90%",
    showCloseButton: true,
    showConfirmButton: false,
    didOpen: async () => {
      canvas = document.getElementById("pdf-canvas");
      ctx = canvas.getContext("2d");

      try {
        // Cargar el documento
        pdfDoc = await pdfjsLib.getDocument(`../attachments/${pdfUrl}`).promise;
        document.getElementById("page_count").textContent = pdfDoc.numPages;

        // Renderizar primera página
        renderPage(pageNum);

        // Eventos de Navegación
        document.getElementById("prev").addEventListener("click", () => {
          if (pageNum <= 1) return;
          pageNum--;
          renderPage(pageNum);
        });

        document.getElementById("next").addEventListener("click", () => {
          if (pageNum >= pdfDoc.numPages) return;
          pageNum++;
          renderPage(pageNum);
        });

        // Eventos de Zoom
        document.getElementById("zoom_in").addEventListener("click", () => {
          scale += 0.2;
          renderPage(pageNum);
        });

        document.getElementById("zoom_out").addEventListener("click", () => {
          if (scale <= 0.5) return;
          scale -= 0.2;
          renderPage(pageNum);
        });

        document.getElementById("zoom_reset").addEventListener("click", () => {
          scale = 1.0;
          renderPage(pageNum);
        });
      } catch (error) {
        console.error("Error al cargar PDF:", error);
        Swal.showValidationMessage(
          `No se pudo cargar el PDF: ${error.message}`
        );
      }
    },
  });
};

// Globalización
window.initMain = initMain;
window.viewAttachFile = viewAttachFile;
window.editarTarea = () => {
  window.location.href = "envios/envio.php?modo=edit";
};
window.gotoComentarioTarea = () => {
  window.location.href = "./envios/comentario.php";
};

const eliminarEnvio = async () => {
  const data = {
    envio: sessionStorage.getItem("envio_id"),
  };
  urlBase = "../api/envios/envio.php?eliminarEnvio";
  try {
    const response = await axios.post(
      urlBase,
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.success) {
      window.location.href = "./main.php";
    }
  } catch (error) {
    console.error("error");
  }
};

const changeStatus = async (status) => {
  const data = {
    envio: sessionStorage.getItem("envio_id"),
  };
  switch (status) {
    case "pendiente":
      data.estado = 1
      break;
    case "en_curso":
      data.estado = 2
      break;
    case "finalizado":
      data.estado =3
      break;
  }

  urlBase = "../api/envios/envio.php?editEnvio";
  try {
    const response = await axios.post(
      urlBase,
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    if (response.data.success) {
      window.location.href = "./main.php";
    }
  } catch (error) {
    console.error("error");
  }
};

const checkFinalizado = () => {
    let filtrosRaw = sessionStorage.getItem("filtro_estados") || "1,2";
    let filtros = filtrosRaw.split(',').map(Number);
    const isChecked = document.getElementById('checkFinalizado').checked;
    if (isChecked) {
        if (!filtros.includes(3)) {
            filtros.push(3);
        }
    } else {
        filtros = filtros.filter(item => item !== 3);
    }
    sessionStorage.setItem("filtro_estados", filtros.join(','));
     getListAllEnvios();
};
