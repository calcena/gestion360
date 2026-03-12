let modo;
const initEnvios = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const envioIdFromUrl = urlParams.get('envio_id');
  if (envioIdFromUrl) {
    sessionStorage.setItem("envio_id", envioIdFromUrl);
  }
  
  const urlModo = urlParams.get('modo');
  modo = urlModo === 'edit' ? 'edit' : 'nuevo';
  
  if (modo === "nuevo") {
    const data = {};
    try {
      const response = await axios.post(
        "../../api/envios/envio.php?getNumeradorEnvio",
        { data },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        const numEnvio = parseInt(response.data.content.envio) + 1;
        const currentYear = new Date().getFullYear().toString().slice(-2);
        const numEnvioFormatted = numEnvio + '/' + currentYear;
        sessionStorage.setItem("num_envio", numEnvioFormatted);
        const numEnvioDisplay = document.getElementById("num_envio_display");
        const numEnvioBadge = document.getElementById("num_envio");
        if (numEnvioDisplay) numEnvioDisplay.innerText = numEnvioFormatted;
        if (numEnvioBadge) numEnvioBadge.innerText = '#' + numEnvioFormatted;
      }
    } catch (error) {
      console.error("error", error);
    }
  } else {
    const envioId = sessionStorage.getItem("envio_id") || envioIdFromUrl;
    if (!envioId) {
      Swal.fire('Error', 'No se ha especificado el ID de la tarea', 'error');
      return;
    }
    
    const data = {
      envio_id: parseInt(envioId),
    };
    try {
      const response = await axios.post(
        "../../api/envios/envio.php?getTareaById",
        { data },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success && response.data.content.length > 0) {
        const tarea = response.data.content[0];
        const numEnvioDisplay = document.getElementById("num_envio_display");
        const numEnvioBadge = document.getElementById("num_envio");
        if (numEnvioDisplay) numEnvioDisplay.innerText = tarea.num_envio;
        if (numEnvioBadge) numEnvioBadge.innerText = '#' + tarea.num_envio;
        
        const descripcionEl = document.getElementById("envio_descripcion");
        if (descripcionEl) descripcionEl.value = tarea.descripcion || '';
        
        const prioridadEl = document.getElementById("select_prioridad_accion");
        if (prioridadEl) prioridadEl.value = tarea.prioridad_id || 1;
        
        const estadoEl = document.getElementById("select_status_accion");
        if (estadoEl) estadoEl.value = tarea.estado_id || 1;
        
        // Mostrar archivo adjunto existente si lo hay
        if (tarea.adjunto) {
          sessionStorage.setItem("file_name", tarea.adjunto);
          mostrarArchivoAdjunto(tarea.adjunto);
        }
      }
    } catch (error) {
      console.error("error");
    }
  }
};

const validateLength = async (id) => {
  if (document.getElementById(id).value.length > 49) {
    await Swal.fire({
      position: "top-end",
      icon: "warning",
      text: "El titulo no puede ser superior a 50 carácteres",
      showConfirmButton: false,
      toast: true,
      timer: 1500,
    });
    document.getElementById(id).value = document
      .getElementById(id)
      .value.slice(0, 50);
  }
};

const saveAction = async () => {
  const descripcion = document.getElementById("envio_descripcion").value;
  if (!descripcion || descripcion.trim() === '') {
    Swal.fire('Error', 'La descripción no puede estar vacía', 'error');
    return;
  }

  const urlParams = new URLSearchParams(window.location.search);
  const envioIdFromUrl = urlParams.get('envio_id');
  const currentModo = urlParams.get('modo') === 'edit' ? 'edit' : 'nuevo';
  
  const data = {
    registro: obtenerFechaHoyConHora(),
    num_envio: sessionStorage.getItem("num_envio") || envioIdFromUrl,
    descripcion: descripcion,
    prioridad_id: document.getElementById("select_prioridad_accion").value,
  };

  if (currentModo === "nuevo") {
    data.envio = parseInt(sessionStorage.getItem("num_envio"));
    data.tarea = parseInt(sessionStorage.getItem("num_envio"));
    data.estado_id = 1;
    const fileName = sessionStorage.getItem("file_name");
    if (fileName) {
      data.archivo = fileName;
    }
    urlBase = "../../api/envios/envio.php?createEnvio";
  } else {
    data.envio = parseInt(sessionStorage.getItem("envio_id")) || parseInt(envioIdFromUrl);
    data.estado_id = document.getElementById("select_status_accion")?.value || 1;
    urlBase = "../../api/envios/envio.php?editEnvio";
  }

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
      sessionStorage.removeItem("file_name")
      await crearBackup();
      window.location.href = "../main.php";
    }
  } catch (error) {
    console.error("error");
  }
};

const mostrarArchivoAdjunto = (fileName) => {
  // Crear o actualizar un elemento para mostrar el archivo adjunto
  let fileDisplay = document.getElementById("file_display");
  if (!fileDisplay) {
    // Crear el elemento si no existe
    const fileInputContainer = document.querySelector('.col-12:has(#file_input)');
    if (fileInputContainer) {
      fileDisplay = document.createElement('div');
      fileDisplay.id = 'file_display';
      fileDisplay.className = 'mt-2 d-flex align-items-center gap-2';
      fileDisplay.innerHTML = `
        <i class="fas fa-file-pdf text-danger"></i>
        <span class="text-truncate" style="max-width: 200px;"></span>
        <small class="text-muted">(Archivo adjunto)</small>
      `;
      fileInputContainer.appendChild(fileDisplay);
    }
  }
  
  if (fileDisplay) {
    const fileNameSpan = fileDisplay.querySelector('span');
    if (fileNameSpan) {
      fileNameSpan.textContent = fileName;
    }
    // Aplicar filtro al icono si existe
    const iconElement = fileDisplay.querySelector('i');
    if (iconElement) {
      iconElement.style.filter = "invert(48%) sepia(79%) saturate(2476%) brightness(86%) contrast(118%)";
    }
  }
};

const cancelAction = async () => {
  window.location.href = "../main.php";
};

const attachFile = () => {
  document.getElementById("file_input").click();
};

const changePriority = async (value) => {
  if (modo === "nuevo") {
    return;
  }
  
  if (!sessionStorage.getItem("envio_id")) {
    Swal.fire('Error', 'No hay tarea seleccionada', 'error');
    return;
  }

  const data = {
    envio: parseInt(sessionStorage.getItem("envio_id")),
    prioridad: parseInt(value)
  };

  try {
    const response = await axios.post(
      "../../api/envios/envio.php?editPriority",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.success) {
      Swal.fire('Error', response.data.message || 'Error al cambiar prioridad', 'error');
    }
  } catch (error) {
    console.error("Error changing priority:", error);
    Swal.fire('Error', 'Error de conexión al cambiar prioridad', 'error');
  }
};

const changeState = async (value) => {
  // En modo nuevo, no se puede cambiar el estado porque la tarea no existe todavía
  if (modo === "nuevo") {
    Swal.fire('Info', 'Guarda la tarea primero para poder cambiar el estado', 'info');
    return;
  }
  
  if (!sessionStorage.getItem("envio_id")) {
    Swal.fire('Error', 'No hay tarea seleccionada', 'error');
    return;
  }

  const data = {
    envio: parseInt(sessionStorage.getItem("envio_id")),
    estado: parseInt(value)
  };

  try {
    const response = await axios.post(
      "../../api/envios/envio.php?editState",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      window.location.href = "../main.php";
    } else {
      Swal.fire('Error', response.data.message || 'Error al cambiar estado', 'error');
    }
  } catch (error) {
    console.error("Error changing state:", error);
    Swal.fire('Error', 'Error de conexión al cambiar estado', 'error');
  }
};

const deleteAttachFile = async () => {
  if (!sessionStorage.getItem("envio_id")) {
    Swal.fire('Error', 'No hay tarea seleccionada', 'error');
    return;
  }

  const result = await Swal.fire({
    title: '¿Eliminar adjunto?',
    text: 'Esta acción no se puede deshacer',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  });

  if (!result.isConfirmed) return;

  try {
    const response = await axios.post(
      "../../api/attach/delete.php",
      {
        data: {
          envio_id: parseInt(sessionStorage.getItem("envio_id"))
        }
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
      sessionStorage.removeItem("file_name");
      Swal.fire({
        icon: 'success',
        title: 'Adjunto eliminado',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });
      // Ocultar el elemento de visualización del archivo si existe
      const fileDisplay = document.getElementById("file_display");
      if (fileDisplay) {
        fileDisplay.remove();
      }
      // Resetear el estilo del icono
      const pdfIcon = document.getElementById("pdf_icon_input");
      if (pdfIcon) {
        pdfIcon.style.filter = "";
      }
    } else {
      Swal.fire('Error', response.data.message || 'Error al eliminar adjunto', 'error');
    }
  } catch (error) {
    console.error("Error deleting attachment:", error);
    Swal.fire('Error', 'Error de conexión al eliminar adjunto', 'error');
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // Initialize the page
  initEnvios();

  // File input change handler (already defined above)
  const fileInput = document.getElementById("file_input");
  if (fileInput) {
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validación rápida en cliente
      if (file.type !== "application/pdf") {
        Swal.fire("Error", "Solo se admiten archivos PDF", "error");
        fileInput.value = ""; // Limpiar input
        return;
      }

      const formData = new FormData();
      formData.append("archivo", file);
      try {
        Swal.fire({
          title: "Subiendo PDF...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const response = await axios.post(
          "../../api/helpers/helper.php?uploadFile",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );
        if (response.data.success) {
          currentAdjuntoId = response.data.data.id;
          Swal.fire({
            icon: "success",
            title: "¡Subido!",
            text: "El documento se ha adjuntado correctamente",
            toast: true,
            position: "top-end",
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true,
            didOpen: (toast) => {
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            },
          });
          sessionStorage.setItem("file_name", response.data.data.file_name);
          mostrarArchivoAdjunto(response.data.data.file_name);
          
          // Cambiar el estilo del icono para indicar que hay un archivo
          const pdfIcon = document.getElementById("pdf_icon_input");
          if (pdfIcon) {
            pdfIcon.style.filter = "invert(48%) sepia(79%) saturate(2476%) brightness(86%) contrast(118%)";
          }
        } else {
          Swal.fire("Error", response.data.message, "error");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
      }
    };
  }

  // Event listeners for buttons and selects
  const deleteBtn = document.getElementById("btn_delete_attach");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteAttachFile);
  }

  const prioritySelect = document.getElementById("select_prioridad_accion");
  if (prioritySelect) {
    prioritySelect.addEventListener("change", (e) => changePriority(e.target.value));
  }

  const statusSelect = document.getElementById("select_status_accion");
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => changeState(e.target.value));
  }
});

window.deleteAttachFile = deleteAttachFile;
window.changePriority = changePriority;
window.changeState = changeState;
window.attachFile = attachFile;
window.saveAction = saveAction;
window.cancelAction = cancelAction;
window.mostrarArchivoAdjunto = mostrarArchivoAdjunto;
