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

  // Always refresh the card data to update counts
  await getListAllEnvios();

  const data = { usuario_id: sessionStorage.getItem("usuario_id") };

  try {
    const response = await axios.post(
      "../api/envios/envio.php?existsNuevosEnvios",
      { data },
    );

    if (response.data.content && response.data.content.counter_envio > 0) {
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
    console.error("Error checking new envios:", err);
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
      { data },
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

  const getPriorityOrder = (bg_class) => {
    if (bg_class === "bg-bug") return 1; // Urgente
    if (bg_class === "bg-low") return 2; // Normal
    if (bg_class === "bg-medium") return 3; // Baja
    return 4;
  };

  const sorted = [...data].sort((a, b) => {
    const priorityA = getPriorityOrder(a.bg_class);
    const priorityB = getPriorityOrder(b.bg_class);
    if (priorityA !== priorityB) return priorityA - priorityB;
    return new Date(a.envio_registro) - new Date(b.envio_registro);
  });

  return sorted
    .map((item) => {
      const tareaDescripcion = item.envio_descripcion || "Sin descripción";
      const headerClass =
        item.recibido == 0
          ? "task-header-new"
          : item.bg_class === "bg-danger"
            ? "bg-danger"
            : "";

      const cardId = item.id || "";
      const numEnvio = item.num_envio || "";
      const envioRegistro = item.envio_registro || "";
      const prioridadIcono = item.prioridad_icono || "low_level.png";
      const estadoNombre = item.estado_nombre || "";
      const estadoColorBg = item.estado_color_bg || "";
      const estadoColorText = item.estado_color_text || "";
      const adjunto = item.adjunto || "";

       return `
       <div class="task-card mb-3 d-flex flex-column" id="${cardId}">
            <div class="task-card-header ${headerClass} card-header-action flex-shrink-0"
                 data-card-id="${cardId}" data-card-title="${numEnvio}" data-card-status="${estadoNombre}" data-card-bg-status="${estadoColorBg}">
                <span class="task-badge-num">${numEnvio}</span>
                <span class="task-date">${envioRegistro}</span>
            </div>
            <div class="task-card-body card-body-detail flex-grow-1">
                <p class="task-description mb-0">${tareaDescripcion}</p>
                ${adjunto ? `<div class="text-end mt-1"><img class="attached-card attached-card-clickable" src="../assets/images/icons/pdf_envio.png" alt="PDF" onclick="viewAttachFile(event, '${adjunto}', '${cardId}')" /></div>` : ""}
            </div>
            <div class="task-card-footer flex-shrink-0">
                <div class="task-footer-left">
                    <img class="task-icon task-priority-icon" src="../assets/images/icons/${prioridadIcono}" alt="prioridad">
                </div>
                <div class="task-footer-center">
                    <span class="task-status-badge ${estadoColorBg} ${estadoColorText}">${estadoNombre}</span>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <div class="d-flex align-items-center gap-1 card-footer-action" onclick="openComments(event, ${cardId}, '${numEnvio}')">
                        <img class="task-icon task-comment-icon" src="../assets/images/icons/comment.png" alt="comentarios">
                        <span class="task-comment-count">${item.count_comentarios || 0}</span>
                    </div>
                    <div class="d-flex align-items-center gap-1 card-footer-action" onclick="openPhotos(event, ${cardId}, '${numEnvio}')">
                        <i class="fas fa-camera task-camera-icon"></i>
                        <span class="task-comment-count">${item.count_fotos || 0}</span>
                    </div>
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
      { data },
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
  sessionStorage.setItem("num_envio", cardTitle);
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
  document.getElementById("menu_lateral_estado").className = "badge";
  document.getElementById("menu_lateral_estado").classList.add(cardBgStatus);
  
  // Load additional envio data
  loadEnvioData(cardId);
}

async function loadEnvioData(envioId) {
  try {
    const response = await axios.post("../api/envios/envio.php?getEnvioData", {
      data: { envio_id: envioId }
    });
    
    if (response.data.success && response.data.envio) {
      const envio = response.data.envio;
      document.getElementById("menu_lateral_emisor_id").value = envio.emisor_id || '';
      document.getElementById("menu_lateral_descripcion").value = envio.descripcion || '';
      document.getElementById("menu_lateral_prioridad_id").value = envio.prioridad_id || '';
      document.getElementById("menu_lateral_adjunto").value = envio.adjunto || '';
    }
  } catch (error) {
    console.error("Error loading envio data:", error);
  }
}

function closeActionPanel() {
  if (actionPanel) actionPanel.style.transform = "translateX(-100%)";
  if (overlay) overlay.style.display = "none";
}

const viewAttachFile = async (event, pdfUrl, envioIdFromCard) => {
  event.stopPropagation();
  if (envioIdFromCard) sessionStorage.setItem("envio_id", envioIdFromCard);

  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  // Variables de estado
  let pdfDoc = null, pageNum = 1, scale = 1.0;
  let canvas, ctx, overlayCanvas, overlayCtx;
  let isEditMode = false, isDrawing = false, currentTool = "pen";
  let drawColor = "#2196f3", baseLineWidth = 3;
  let lastX = 0, lastY = 0;
  let highlightStartX = 0, highlightStartY = 0;
  let highlightPoints = [];
  let savedCanvasData = null;
  const annotations = {}; // { pageNum: dataURL }

  // Función para obtener el ancho de línea proporcional al zoom
  const getLineWidth = () => baseLineWidth / scale;
  const getHighlightThickness = () => (baseLineWidth * 3) / scale;

  const saveCurrentAnnotation = () => {
    if (overlayCanvas) {
      annotations[pageNum] = overlayCanvas.toDataURL();
      highlightPoints = [];
    }
  };

  const redrawHighlight = () => {
    overlayCtx.fillStyle = drawColor.includes('40') ? drawColor : drawColor + '40';
    const thickness = getHighlightThickness();
    for (let i = 0; i < highlightPoints.length - 1; i += 2) {
      const x1 = highlightPoints[i];
      const y1 = highlightPoints[i + 1];
      const x2 = highlightPoints[i + 2];
      const y2 = highlightPoints[i + 3];
      const minX = Math.min(x1, x2) - thickness;
      const minY = Math.min(y1, y2) - thickness;
      const w = Math.abs(x2 - x1) + thickness * 2;
      const h = Math.abs(y2 - y1) + thickness * 2;
      overlayCtx.fillRect(minX, minY, w, h);
    }
  };

  // Función de renderizado ajustada
  const renderPage = async (num) => {
    const page = await pdfDoc.getPage(num);

    // Auto-ajuste de escala en el primer render
    if (pageNum === 1 && scale === 1.0) {
        const containerWidth = document.getElementById('pdf-container').clientWidth;
        const unscaledViewport = page.getViewport({ scale: 1 });
        scale = (containerWidth - 40) / unscaledViewport.width;
    }

    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    overlayCanvas.height = viewport.height;
    overlayCanvas.width = viewport.width;

    // Ajustar el wrapper para que tenga las dimensiones correctas
    const wrapper = document.getElementById('canvas-wrapper');
    if (wrapper) {
      wrapper.style.width = viewport.width + 'px';
      wrapper.style.height = viewport.height + 'px';
    }

    await page.render({ canvasContext: ctx, viewport }).promise;
    document.getElementById("page_num").textContent = num;

    // Redibujar anotaciones de esta página
    if (annotations[num]) {
      const img = new Image();
      img.onload = () => overlayCtx.drawImage(img, 0, 0);
      img.src = annotations[num];
    }
  };

  const setupDrawingEvents = () => {
    const getPos = (e) => {
      const rect = overlayCanvas.getBoundingClientRect();
      const scaleX = overlayCanvas.width / rect.width;
      const scaleY = overlayCanvas.height / rect.height;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return [(clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY];
    };

    overlayCanvas.addEventListener('mousedown', (e) => {
      if (!isEditMode) return;
      isDrawing = true;
      [lastX, lastY] = getPos(e);
      if (currentTool === 'text') {
        isDrawing = false;
        const text = prompt('Introduce el texto:');
        if (text) {
          overlayCtx.font = `${(baseLineWidth * 6) / scale}px Arial`;
          overlayCtx.fillStyle = drawColor;
          overlayCtx.fillText(text, lastX, lastY);
          saveCurrentAnnotation();
        }
      }
      if (currentTool === 'highlight') {
        highlightPoints = [lastX, lastY];
        savedCanvasData = overlayCtx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
      }
    });

    overlayCanvas.addEventListener('mousemove', (e) => {
      if (!isDrawing || !isEditMode) return;
      const [x, y] = getPos(e);
      if (currentTool === 'eraser') {
        overlayCtx.globalCompositeOperation = 'destination-out';
        overlayCtx.lineWidth = (baseLineWidth * 5) / scale;
        overlayCtx.beginPath();
        overlayCtx.lineCap = 'round';
        overlayCtx.lineJoin = 'round';
        overlayCtx.moveTo(lastX, lastY);
        overlayCtx.lineTo(x, y);
        overlayCtx.stroke();
      } else if (currentTool === 'highlight') {
        highlightPoints.push(x, y);
        overlayCtx.putImageData(savedCanvasData, 0, 0);
        redrawHighlight();
      } else {
        overlayCtx.globalCompositeOperation = 'source-over';
        overlayCtx.beginPath();
        overlayCtx.strokeStyle = drawColor;
        overlayCtx.lineWidth = getLineWidth();
        overlayCtx.lineCap = 'round';
        overlayCtx.lineJoin = 'round';
        overlayCtx.moveTo(lastX, lastY);
        overlayCtx.lineTo(x, y);
        overlayCtx.stroke();
      }
      [lastX, lastY] = [x, y];
    });

    const stopDraw = () => {
      if (isDrawing) {
        isDrawing = false;
        saveCurrentAnnotation();
      }
    };
    overlayCanvas.addEventListener('mouseup', stopDraw);
    overlayCanvas.addEventListener('mouseleave', stopDraw);
    overlayCanvas.addEventListener('touchstart', (e) => { e.preventDefault(); overlayCanvas.dispatchEvent(new MouseEvent('mousedown', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })); }, { passive: false });
    overlayCanvas.addEventListener('touchmove', (e) => { e.preventDefault(); overlayCanvas.dispatchEvent(new MouseEvent('mousemove', { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY })); }, { passive: false });
    overlayCanvas.addEventListener('touchend', stopDraw);
  };

  const savePdfWithAnnotations = async () => {
    try {
      Swal.showLoading();
      saveCurrentAnnotation();

      const pdfBytes = await fetch(`../attachments/${pdfUrl}`).then(r => r.arrayBuffer());
      const pdfLibDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const pages = pdfLibDoc.getPages();

      for (const [pageIndex, dataUrl] of Object.entries(annotations)) {
        const idx = parseInt(pageIndex) - 1;
        if (!pages[idx]) continue;
        const imgData = dataUrl.split(',')[1];
        const imgBytes = Uint8Array.from(atob(imgData), c => c.charCodeAt(0));
        const pngImage = await pdfLibDoc.embedPng(imgBytes);
        const pdfPage = pages[idx];
        const { width, height } = pdfPage.getSize();
        pdfPage.drawImage(pngImage, { x: 0, y: 0, width, height });
      }

      const savedBytes = await pdfLibDoc.save();
      const blob = new Blob([savedBytes], { type: 'application/pdf' });

      const now = new Date();
      const versionTimestamp = now.getTime();

      const formData = new FormData();
      formData.append('pdf_file', blob, pdfUrl);
      formData.append('file_name', pdfUrl);
      formData.append('version_timestamp', versionTimestamp);
      try {
        const envioId = sessionStorage.getItem('envio_id');
        if (envioId) formData.append('envio_id', envioId);
      } catch (e) {
        console.warn('No envio_id available in sessionStorage', e);
      }

      try {
        const annotationsMeta = {};
        for (const [p, dataUrl] of Object.entries(annotations)) {
          annotationsMeta[p] = {
            length: dataUrl ? dataUrl.length : 0,
            preview: dataUrl ? dataUrl.slice(0, 200) : null
          };
        }
        formData.append('annotations_meta', JSON.stringify(annotationsMeta));
      } catch (e) {
        console.warn('Failed to add annotations meta', e);
      }

      const response = await axios.post('../controllers/save_pdf.php', formData);

      if (response.data.success) {
        isEditMode = false;
        const btnEdit = document.getElementById('btn_edit_mode');
        if (btnEdit && btnEdit.classList) {
          btnEdit.classList.remove('btn-warning');
          btnEdit.classList.add('btn-outline-warning');
        }
        const editToolbar = document.getElementById('edit-toolbar');
        if (editToolbar && editToolbar.style) {
          editToolbar.style.display = 'none';
        }
        if (typeof overlayCanvas !== 'undefined' && overlayCanvas && overlayCanvas.style) {
          overlayCanvas.style.pointerEvents = 'none';
        }

        try {
          const serverPdf = await fetch(`../attachments/${pdfUrl}`);
          const serverBuf = await serverPdf.arrayBuffer();
          const clientSize = savedBytes.byteLength || savedBytes.length || (new Uint8Array(savedBytes)).length;
          const serverSize = serverBuf.byteLength;
          if (clientSize !== serverSize) {
            console.warn('Saved PDF size differs from uploaded bytes', { clientSize, serverSize });
          }
        } catch (verifyErr) {
          console.error('Verification error:', verifyErr);
        }

        try {
          if (typeof getListAllEnvios === 'function') getListAllEnvios();
        } catch(e) {
          console.warn('refresh list failed', e);
        }

        Swal.close();
        window.location.href = "./main.php";
      } else {
        Swal.fire('Error', response.data.message, 'error');
      }
    } catch (err) {
      console.error('Error saving PDF:', err);
      Swal.fire('Error', 'No se pudo guardar el PDF: ' + (err.message || 'Error desconocido'), 'error');
    }
  };

  Swal.fire({
    html: `
      <div id="pdf-toolbar" class="d-flex flex-wrap justify-content-center align-items-center gap-2">
        <div class="btn-group">
            <button id="prev" class="btn btn-sm btn-outline-secondary"><i class="fas fa-chevron-left"></i></button>
            <button id="next" class="btn btn-sm btn-outline-secondary"><i class="fas fa-chevron-right"></i></button>
        </div>
        <span class="badge bg-dark px-3 py-2"><span id="page_num">1</span> / <span id="page_count">-</span></span>
        <div class="vr"></div>
        <div class="btn-group">
            <button id="zoom_out" class="btn btn-sm btn-light"><i class="fas fa-minus"></i></button>
            <button id="zoom_reset" class="btn btn-sm btn-light">100%</button>
            <button id="zoom_in" class="btn btn-sm btn-light"><i class="fas fa-plus"></i></button>
        </div>
        <div class="vr"></div>
        <button id="btn_edit_mode" class="btn btn-sm btn-success"><i class="fas fa-edit"></i> Editar</button>
        <button id="btn_save_pdf" class="btn btn-sm btn-primary" style="display:none"><i class="fas fa-save"></i> Guardar</button>
        <button id="btn_versions" class="btn btn-sm btn-outline-info"><i class="fas fa-history"></i></button>
      </div>

      <div id="edit-toolbar" class="mt-2 d-flex flex-wrap justify-content-center align-items-center gap-2" style="display:none !important;">
        <button id="tool_pen" class="btn btn-sm btn-dark active-tool"><i class="fas fa-pencil-alt"></i></button>
        <button id="tool_highlight" class="btn btn-sm btn-outline-dark"><i class="fas fa-highlighter"></i></button>
        <button id="tool_text" class="btn btn-sm btn-outline-dark"><i class="fas fa-font"></i></button>
        <button id="tool_eraser" class="btn btn-sm btn-outline-danger"><i class="fas fa-eraser"></i></button>
        <input type="color" id="draw_color" value="#2196f3" title="Color" style="width:36px;height:32px;padding:2px;border-radius:4px;cursor:pointer;">
        <select id="line_width" class="form-select form-select-sm" style="width:80px">
          <option value="2">Fino</option>
          <option value="4" selected>Normal</option>
          <option value="8">Grueso</option>
        </select>
        <button id="btn_clear_page" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash-alt"></i> Limpiar</button>
      </div>

      <div id="pdf-container">
        <div id="canvas-wrapper" style="position:relative; display:inline-block;">
          <canvas id="pdf-canvas"></canvas>
          <canvas id="overlay-canvas" style="position:absolute; top:0; left:0; pointer-events:none;"></canvas>
        </div>
      </div>
    `,
    grow: 'fullscreen',
    showCloseButton: true,
    showConfirmButton: false,
    customClass: {
      popup: "maximize-modal",
      htmlContainer: "maximize-html-container",
    },
    didOpen: async () => {
      canvas = document.getElementById("pdf-canvas");
      ctx = canvas.getContext("2d");
      overlayCanvas = document.getElementById("overlay-canvas");
      overlayCtx = overlayCanvas.getContext("2d");

      try {
        pdfDoc = await pdfjsLib.getDocument(`../attachments/${pdfUrl}`).promise;
        document.getElementById("page_count").textContent = pdfDoc.numPages;
        await renderPage(pageNum);

        // Eventos de Navegación
        document.getElementById("prev").onclick = () => { if (pageNum > 1) { annotations[pageNum] = overlayCanvas.toDataURL(); pageNum--; renderPage(pageNum); } };
        document.getElementById("next").onclick = () => { if (pageNum < pdfDoc.numPages) { annotations[pageNum] = overlayCanvas.toDataURL(); pageNum++; renderPage(pageNum); } };

        // Zoom
        document.getElementById("zoom_in").onclick = () => { scale += 0.2; renderPage(pageNum); };
        document.getElementById("zoom_out").onclick = () => { scale = Math.max(0.4, scale - 0.2); renderPage(pageNum); };
        document.getElementById("zoom_reset").onclick = () => { scale = 1.0; renderPage(pageNum); };

        // Setup drawing events
        setupDrawingEvents();

        // Edit mode toggle
        document.getElementById("btn_edit_mode").addEventListener("click", () => {
          isEditMode = !isEditMode;
          const btn = document.getElementById("btn_edit_mode");
          const editBar = document.getElementById("edit-toolbar");
          const saveBtn = document.getElementById("btn_save_pdf");
          if (isEditMode) {
            btn.classList.remove('btn-success');
            btn.classList.add('btn-warning');
            editBar.style.display = 'flex';
            saveBtn.style.display = 'inline-block';
            overlayCanvas.style.pointerEvents = 'auto';
            overlayCanvas.style.cursor = 'crosshair';
          } else {
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-success');
            editBar.style.display = 'none';
            saveBtn.style.display = 'none';
            overlayCanvas.style.pointerEvents = 'none';
            overlayCanvas.style.cursor = 'default';
          }
        });

        // Save PDF
        document.getElementById("btn_save_pdf").addEventListener("click", savePdfWithAnnotations);

        // Versions listing
        document.getElementById("btn_versions").addEventListener("click", async () => {
          const envioId = sessionStorage.getItem('envio_id');
          if (!envioId) {
            Swal.fire('Error', 'No hay envío seleccionado', 'error');
            return;
          }
          try {
            const response = await axios.post('../api/attach/versions.php', { data: { envio_id: envioId } });
            if (!response.data.success) {
              Swal.fire('Error', response.data.message || 'No se pudieron obtener versiones', 'error');
              return;
            }
            const rows = response.data.data || [];
            if (rows.length === 0) {
              Swal.fire('Info', 'No hay versiones disponibles', 'info');
              return;
            }
            let html = '<div class="list-group">';
            for (const r of rows) {
              if (!r.archivo) continue;
              const url = '../attachments/' + encodeURIComponent(r.archivo);

              let displayDate;
              if (r.version_timestamp) {
                const date = new Date(parseInt(r.version_timestamp));
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                const ms = String(date.getMilliseconds()).padStart(3, '0');
                displayDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.${ms}`;
              } else if (r.registro) {
                const date = new Date(r.registro);
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                const seconds = String(date.getSeconds()).padStart(2, '0');
                displayDate = `${day}-${month}-${year} ${hours}:${minutes}:${seconds}.000`;
              } else {
                displayDate = 'Sin fecha';
              }

              html += `<a class="list-group-item list-group-item-action d-flex justify-content-between align-items-center" href="${url}" target="_blank">`;
              html += `<div><strong>${displayDate}</strong></div>`;
              html += `<div>
                        <button data-file="${r.archivo}" class="btn btn-sm btn-outline-success ms-2 restore-version">Restaurar</button>
                       </div>`;
              html += `</a>`;
            }
            html += '</div>';
            // Show the modal and attach handlers for download/restore buttons
            Swal.fire({
              title: 'Versiones del adjunto',
              html,
              width: '90%',
              showConfirmButton: false,
              showCloseButton: true,
              customClass: {
                popup: 'versiones-modal'
              },
              didOpen: () => {
                // Attach delegated click handlers inside the Swal content
                const container = document.querySelector('.swal2-html-container');
                if (!container) return;
                container.addEventListener('click', async (ev) => {
                  const rbtn = ev.target.closest('.restore-version');
                  if (rbtn) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    const file = rbtn.getAttribute('data-file');
                    if (!file) return;
                    const envioId = sessionStorage.getItem('envio_id');
                    try {
                      Swal.showLoading();
                      const resp = await axios.post('../api/attach/restore.php', { envio_id: envioId, archivo: file });
                      Swal.close();
                      if (resp.data && resp.data.success) {
                        Swal.fire({ icon: 'success', title: 'Restaurado', text: 'La versión ha sido restaurada correctamente', toast: true, position: 'top-end', timer: 2000 });
                        try { if (typeof getListAllEnvios === 'function') getListAllEnvios(); } catch(e){ console.warn('refresh list failed', e); }
                      } else {
                        Swal.fire('Error', resp.data.message || 'No se pudo restaurar', 'error');
                      }
                    } catch (err) {
                      console.error(err);
                      Swal.fire('Error', 'No se pudo restaurar la versión', 'error');
                    }
                    return;
                  }
                });
              }
            });
          } catch (err) {
            console.error(err);
            Swal.fire('Error', 'No se pudieron obtener versiones', 'error');
          }
        });

        // Tool buttons
        const setActiveTool = (tool) => {
          currentTool = tool;
          ['tool_pen','tool_highlight','tool_text','tool_eraser'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
              btn.classList.toggle('btn-dark', id === `tool_${tool}`);
              btn.classList.toggle('btn-outline-dark', id !== `tool_${tool}`);
            }
          });
          overlayCanvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';

          // Cambiar color predefinido según la herramienta
          const colorInput = document.getElementById("draw_color");
          if (colorInput) {
            switch(tool) {
              case 'pen':
                drawColor = '#2196f3'; // Azul medio
                colorInput.value = '#2196f3';
                break;
              case 'highlight':
                drawColor = '#ffeb3b40'; // Amarillo claro con 25% transparencia
                colorInput.value = '#ffeb3b';
                baseLineWidth = 20; // El resaltador es más grueso
                break;
              case 'text':
                drawColor = '#2196f3'; // Azul medio para texto
                colorInput.value = '#2196f3';
                break;
              case 'eraser':
                break;
            }
          }
        };
        document.getElementById("tool_pen").addEventListener("click", () => setActiveTool('pen'));
        document.getElementById("tool_highlight").addEventListener("click", () => setActiveTool('highlight'));
        document.getElementById("tool_text").addEventListener("click", () => setActiveTool('text'));
        document.getElementById("tool_eraser").addEventListener("click", () => setActiveTool('eraser'));

        document.getElementById("draw_color").addEventListener("input", (e) => { drawColor = e.target.value; });
        document.getElementById("line_width")?.addEventListener("change", (e) => { lineWidth = parseInt(e.target.value); });

        document.getElementById("btn_clear_page").addEventListener("click", () => {
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          delete annotations[pageNum];
        });

      } catch (err) {
        console.error("Error PDF:", err);
      }
    }
  });
};

// Editar tarea desde el panel de acciones
window.editarEnvio = async () => {
  const envioId = parseInt(sessionStorage.getItem("envio_id"));
  const numEnvio = sessionStorage.getItem("num_envio") || '';
  const currentUserId = parseInt(sessionStorage.getItem("usuario_id"));
  const emisorId = parseInt(document.getElementById("menu_lateral_emisor_id").value) || 0;
  const descripcion = document.getElementById("menu_lateral_descripcion").value || '';
  const prioridadId = parseInt(document.getElementById("menu_lateral_prioridad_id").value) || 0;
  
  // Verificar si es el propietario
  const isOwner = emisorId === currentUserId;

  // Obtener opciones de prioridad
  let prioridadesOptions = `
    <option value="1" ${prioridadId === 1 ? 'selected' : ''}>Urgente</option>
    <option value="2" ${prioridadId === 2 ? 'selected' : ''}>Normal</option>
    <option value="3" ${prioridadId === 3 ? 'selected' : ''}>Baja</option>
  `;

  // Get current adjunto
  const adjuntoActual = document.getElementById("menu_lateral_adjunto").value || '';
  
  let pdfSection = '';
  if (isOwner) {
    if (adjuntoActual) {
      pdfSection = `
        <div class="mb-3">
          <label class="form-label">Archivo PDF Actual</label>
          <div class="d-flex align-items-center gap-2">
            <span class="badge bg-primary">${adjuntoActual}</span>
            <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeAdjunto()">
              <i class="fas fa-trash"></i> Eliminar
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label">替换 archivo PDF</label>
          <input type="file" id="edit-pdf-file" class="form-control" accept="application/pdf">
          <small class="text-muted">Dejar vacío para mantener el archivo actual</small>
        </div>
      `;
    } else {
      pdfSection = `
        <div class="mb-3">
          <label class="form-label">Archivo PDF</label>
          <input type="file" id="edit-pdf-file" class="form-control" accept="application/pdf">
        </div>
      `;
    }
  }

  let pdfRemoved = false;
  window.removeAdjunto = () => {
    pdfRemoved = true;
    document.querySelector('.swal2-content').querySelector('.mb-3').innerHTML = `
      <label class="form-label">Archivo PDF</label>
      <input type="file" id="edit-pdf-file" class="form-control" accept="application/pdf">
      <small class="text-muted">Se eliminará el archivo al guardar</small>
    `;
  };

  Swal.fire({
    title: `Editar Tarea #${numEnvio}`,
    html: `
      <div class="text-start">
        <div class="mb-3">
          <label class="form-label">Descripción</label>
          <textarea id="edit-descripcion" class="form-control" rows="3">${descripcion}</textarea>
        </div>
        <div class="mb-3">
          <label class="form-label">Prioridad</label>
          <select id="edit-prioridad" class="form-select">${prioridadesOptions}</select>
        </div>
        ${pdfSection}
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: 'Guardar',
    cancelButtonText: 'Cancelar',
    preConfirm: async () => {
      const newDescripcion = document.getElementById('edit-descripcion').value;
      const newPrioridad = document.getElementById('edit-prioridad').value;
      const pdfFile = document.getElementById('edit-pdf-file')?.files[0];

      try {
        // Primero actualizar descripción y prioridad
        const updateResponse = await axios.post("../api/envios/envio.php?editEnvio", {
          data: {
            envio: envioId,
            descripcion: newDescripcion,
            prioridad_id: newPrioridad
          }
        });

        if (!updateResponse.data.success) {
          throw new Error(updateResponse.data.message || 'Error al actualizar');
        }

        // Si hay archivo PDF nuevo y es propietario, subirlo
        if (pdfFile && isOwner) {
          const formData = new FormData();
          formData.append('pdf_file', pdfFile);
          formData.append('envio_id', envioId);
          
          const uploadResponse = await axios.post('../api/attach/upload.php', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          
          if (!uploadResponse.data.success) {
            throw new Error(uploadResponse.data.message || 'Error al subir archivo');
          }
        }

        await getListAllEnvios();
        return true;
      } catch (error) {
        Swal.showValidationMessage(error.message);
        return false;
      }
    }
  }).then((result) => {
    if (result.isConfirmed) {
      Swal.fire('Actualizado', 'La tarea ha sido actualizada', 'success');
      closeActionPanel();
    }
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
window.gotoComentarioEnvio = () => {
  const envioId = parseInt(sessionStorage.getItem("envio_id"));
  const numEnvio = sessionStorage.getItem("num_envio") || '';
  if (envioId && !isNaN(envioId)) {
    window.location.href = `comentarios.php?envio_id=${envioId}&num_envio=${numEnvio}`;
  } else {
    Swal.fire('Error', 'No hay tarea seleccionada', 'error');
  }
};
window.openComments = (event, envioId, numEnvio) => {
  if (event) event.stopPropagation();
  window.location.href = `comentarios.php?envio_id=${envioId}&num_envio=${numEnvio}`;
};
window.openPhotos = (event, envioId, numEnvio) => {
  if (event) event.stopPropagation();
  window.location.href = `fotos.php?envio_id=${envioId}&num_envio=${numEnvio}`;
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
      },
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
      data.estado = 1;
      break;
    case "en_curso":
      data.estado = 2;
      break;
    case "finalizado":
      data.estado = 3;
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
      },
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
  let filtros = filtrosRaw.split(",").map(Number);
  const isChecked = document.getElementById("checkFinalizado").checked;
  if (isChecked) {
    if (!filtros.includes(3)) {
      filtros.push(3);
    }
  } else {
    filtros = filtros.filter((item) => item !== 3);
  }
  sessionStorage.setItem("filtro_estados", filtros.join(","));
  getListAllEnvios();
};
