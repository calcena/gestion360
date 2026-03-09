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

  const getPriorityOrder = (bg_class) => {
    if (bg_class === 'bg-bug') return 1; // Urgente
    if (bg_class === 'bg-low') return 2; // Normal
    if (bg_class === 'bg-medium') return 3; // Baja
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
      const headerClass = item.recibido == 0
        ? "task-header-new"
        : (item.bg_class === "bg-danger" ? "bg-danger" : "");

      const cardId = item.id || '';
      const numEnvio = item.num_envio || '';
      const envioRegistro = item.envio_registro || '';
      const prioridadIcono = item.prioridad_icono || 'low_level.png';
      const estadoNombre = item.estado_nombre || '';
      const estadoColorBg = item.estado_color_bg || '';
      const estadoColorText = item.estado_color_text || '';
      const adjunto = item.adjunto || '';

      return `
       <div class="task-card mb-3" id="${cardId}">
            <div class="task-card-header ${headerClass} card-header-action"
                 data-card-id="${cardId}" data-card-title="${numEnvio}" data-card-status="${estadoNombre}" data-card-bg-status="${estadoColorBg}">
                <span class="task-badge-num">${numEnvio}</span>
                <small class="task-date">${envioRegistro}</small>
            </div>
            <div class="task-card-body card-body-detail">
                <p class="task-description mb-0">${tareaDescripcion}</p>
                ${adjunto ? `<div class="text-end mt-1"><img class="attached-card" src="../assets/images/icons/pdf_envio.png" alt="PDF" style="cursor:pointer;" onclick="viewAttachFile(event, '${adjunto}', '${cardId}')" /></div>` : ''}
            </div>
            <div class="task-card-footer">
                <img class="task-icon" src="../assets/images/icons/${prioridadIcono}" alt="prioridad">
                <span class="task-status-badge ${estadoColorBg} ${estadoColorText}">${estadoNombre}</span>
                <div class="d-flex align-items-center ms-auto gap-1">
                    <img class="task-icon" src="../assets/images/icons/comment.png" alt="comentarios" style="opacity:.7;">
                    <span class="task-comment-count">${item.count_comentarios || 0}</span>
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

const viewAttachFile = async (event, pdfUrl, envioIdFromCard) => {
  event.stopPropagation();
  habilitarContextoAudio();

  if (envioIdFromCard) {
    sessionStorage.setItem('envio_id', envioIdFromCard);
  }

  const pdfjsLib = window["pdfjs-dist/build/pdf"];
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  let pdfDoc = null, pageNum = 1, scale = 0.7;
  let canvas = null, ctx = null;
  let overlayCanvas = null, overlayCtx = null;
  let isEditMode = false;
  let isDrawing = false;
  let currentTool = 'pen';
  let drawColor = '#2196f3';
  let lineWidth = 3;
  let lastX = 0, lastY = 0;
  let highlightStartX = 0, highlightStartY = 0;
  let highlightPoints = [];
  let savedCanvasData = null;
  const annotations = {}; // { pageNum: dataURL }

  const saveCurrentAnnotation = () => {
    if (overlayCanvas) {
      annotations[pageNum] = overlayCanvas.toDataURL();
      highlightPoints = [];
    }
  };

  const redrawHighlight = () => {
    overlayCtx.fillStyle = drawColor + '40';
    const thickness = lineWidth * 3;
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

  const renderPage = async (num) => {
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale });
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    if (overlayCanvas) {
      overlayCanvas.height = viewport.height;
      overlayCanvas.width = viewport.width;
      overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    }
    await page.render({ canvasContext: ctx, viewport }).promise;
    document.getElementById("page_num").textContent = num;
    if (annotations[num] && overlayCtx) {
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
          overlayCtx.font = `${lineWidth * 6}px Arial`;
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
        overlayCtx.lineWidth = lineWidth * 5;
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
        overlayCtx.lineWidth = lineWidth;
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
      <div id="pdf-toolbar" class="mb-2 d-flex flex-wrap justify-content-center align-items-center gap-2">
        <button id="prev" class="btn btn-sm btn-secondary"><i class="fas fa-arrow-left"></i></button>
        <span><span id="page_num"></span> / <span id="page_count"></span></span>
        <button id="next" class="btn btn-sm btn-secondary"><i class="fas fa-arrow-right"></i></button>
        <div class="vr mx-1"></div>
        <button id="zoom_out" class="btn btn-sm btn-outline-dark"><i class="fas fa-search-minus"></i></button>
        <button id="zoom_in" class="btn btn-sm btn-outline-dark"><i class="fas fa-search-plus"></i></button>
        <button id="zoom_reset" class="btn btn-sm btn-outline-danger">100%</button>
        <div class="vr mx-1"></div>
        <button id="btn_edit_mode" class="btn btn-sm btn-outline-warning"><i class="fas fa-pen"></i> Editar</button>
        <button id="btn_save_pdf" class="btn btn-sm btn-success" style="display:none"><i class="fas fa-save"></i> Guardar PDF</button>
        <button id="btn_versions" class="btn btn-sm btn-secondary"><i class="fas fa-history"></i> Versiones</button>
      </div>
      <div id="edit-toolbar" class="mb-2 d-flex flex-wrap justify-content-center align-items-center gap-2" style="display:none!important;">
        <button id="tool_pen"       class="btn btn-sm btn-dark active-tool"><i class="fas fa-pencil-alt"></i></button>
        <button id="tool_highlight" class="btn btn-sm btn-outline-dark"><i class="fas fa-highlighter"></i></button>
        <button id="tool_text"      class="btn btn-sm btn-outline-dark"><i class="fas fa-font"></i></button>
        <button id="tool_eraser"    class="btn btn-sm btn-outline-secondary"><i class="fas fa-eraser"></i></button>
        <input type="color" id="draw_color" value="#2196f3" title="Color" style="width:36px;height:32px;padding:2px;border-radius:4px;cursor:pointer;">
        <select id="line_width" class="form-select form-select-sm" style="width:80px">
          <option value="2">Fino</option>
          <option value="4" selected>Normal</option>
          <option value="8">Grueso</option>
        </select>
        <button id="btn_clear_page" class="btn btn-sm btn-outline-danger"><i class="fas fa-trash-alt"></i> Limpiar</button>
      </div>
      <div id="pdf-container" style="overflow:auto;max-height:65vh;border:1px solid #ccc;background:#eee;position:relative;">
        <div style="position:relative;display:inline-block;">
          <canvas id="pdf-canvas"></canvas>
          <canvas id="overlay-canvas" style="position:absolute;top:0;left:0;pointer-events:none;"></canvas>
        </div>
      </div>
    `,
    width: "90%",
    showCloseButton: true,
    showConfirmButton: false,
    didOpen: async () => {
      canvas = document.getElementById("pdf-canvas");
      ctx = canvas.getContext("2d");
      overlayCanvas = document.getElementById("overlay-canvas");
      overlayCtx = overlayCanvas.getContext("2d");

      try {
        pdfDoc = await pdfjsLib.getDocument(`../attachments/${pdfUrl}`).promise;
        document.getElementById("page_count").textContent = pdfDoc.numPages;
        await renderPage(pageNum);
        setupDrawingEvents();

        // Navigation
        document.getElementById("prev").addEventListener("click", async () => {
          if (pageNum <= 1) return;
          saveCurrentAnnotation();
          pageNum--;
          await renderPage(pageNum);
        });
        document.getElementById("next").addEventListener("click", async () => {
          if (pageNum >= pdfDoc.numPages) return;
          saveCurrentAnnotation();
          pageNum++;
          await renderPage(pageNum);
        });

        // Zoom
        document.getElementById("zoom_in").addEventListener("click", () => { scale += 0.2; renderPage(pageNum); });
        document.getElementById("zoom_out").addEventListener("click", () => { if (scale > 0.3) { scale -= 0.2; renderPage(pageNum); } });
        document.getElementById("zoom_reset").addEventListener("click", () => { scale = 1.0; renderPage(pageNum); });

        // Edit mode toggle
        document.getElementById("btn_edit_mode").addEventListener("click", () => {
          isEditMode = !isEditMode;
          const btn = document.getElementById("btn_edit_mode");
          const editBar = document.getElementById("edit-toolbar");
          const saveBtn = document.getElementById("btn_save_pdf");
          if (isEditMode) {
            btn.classList.remove('btn-outline-warning'); btn.classList.add('btn-warning');
            editBar.style.display = 'flex';
            saveBtn.style.display = 'inline-block';
            overlayCanvas.style.pointerEvents = 'auto';
            overlayCanvas.style.cursor = 'crosshair';
          } else {
            btn.classList.remove('btn-warning'); btn.classList.add('btn-outline-warning');
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
                        <button data-file="${r.archivo}" class="btn btn-sm btn-primary ms-2 download-version">Descargar</button>
                        <button data-file="${r.archivo}" class="btn btn-sm btn-outline-success ms-2 restore-version">Restaurar</button>
                       </div>`;
              html += `</a>`;
            }
            html += '</div>';
            // Show the modal and attach handlers for download/restore buttons
            Swal.fire({
              title: 'Versiones del adjunto',
              html,
              width: '60%',
              showConfirmButton: false,
              showCloseButton: true,
              didOpen: () => {
                // Attach delegated click handlers inside the Swal content
                const container = document.querySelector('.swal2-html-container');
                if (!container) return;
                container.addEventListener('click', async (ev) => {
                  const btn = ev.target.closest('.download-version');
                  if (btn) {
                    const file = btn.getAttribute('data-file');
                    if (!file) return;
                    const url = '../attachments/' + encodeURIComponent(file);
                    window.open(url, '_blank');
                    return;
                  }
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
            document.getElementById(id).classList.toggle('btn-dark', id === `tool_${tool}`);
            document.getElementById(id).classList.toggle(`btn-outline-${id === 'tool_eraser' ? 'secondary' : 'dark'}`, id !== `tool_${tool}`);
          });
          overlayCanvas.style.cursor = tool === 'eraser' ? 'cell' : 'crosshair';
        };
        document.getElementById("tool_pen").addEventListener("click", () => setActiveTool('pen'));
        document.getElementById("tool_highlight").addEventListener("click", () => setActiveTool('highlight'));
        document.getElementById("tool_text").addEventListener("click", () => setActiveTool('text'));
        document.getElementById("tool_eraser").addEventListener("click", () => setActiveTool('eraser'));

        document.getElementById("draw_color").addEventListener("input", (e) => { drawColor = e.target.value; });
        document.getElementById("line_width").addEventListener("change", (e) => { lineWidth = parseInt(e.target.value); });

        document.getElementById("btn_clear_page").addEventListener("click", () => {
          overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
          delete annotations[pageNum];
        });

      } catch (error) {
        console.error("Error al cargar PDF:", error);
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
