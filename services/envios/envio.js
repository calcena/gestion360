let modo;
const initEnvios = async () => {
  modo = document.body.getAttribute("data-mode");
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
        sessionStorage.setItem(
          "num_envio",
          parseInt(response.data.content.envio) + 1
        );
        document.getElementById("num_envio").innerHTML = await formatNumberTask(
          response.data.content.envio,
          response.data.content.longitud_envio
        );
      }
    } catch (error) {
      console.error("error");
    }
  } else {
    const data = {
      envio_id: sessionStorage.getItem("envio_id"),
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
      if (response.data.success) {
        document.getElementById("num_envio").innerText =
          response.data.content[0].num_envio;
        document.getElementById("envio_descripcion").value =
          response.data.content[0].descripcion;
        document.getElementById("select_prioridad_accion").value =
          response.data.content[0].prioridad_id;
        document.getElementById("select_status_accion").value =
          response.data.content[0].estado_id;
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
  const data = {
    registro: obtenerFechaHoyConHora(),
    num_envio: document.getElementById("num_envio").innerText,
    descripcion: document.getElementById("envio_descripcion").value,
    prioridad_id: document.getElementById("select_prioridad_accion").value,
    estado_id: 1,
  };

  if (modo === "nuevo") {
    data.envio = parseInt(sessionStorage.getItem("num_envio"));
    data.tarea = parseInt(sessionStorage.getItem("num_envio"));
    data.estado_id = 1;
    // Solo enviar archivo si se ha subido uno
    const fileName = sessionStorage.getItem("file_name");
    if (fileName) {
      data.archivo = fileName;
    }
    urlBase = "../../api/envios/envio.php?createEnvio";
  } else {
    data.envio = parseInt(sessionStorage.getItem("envio_id"));
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

const cancelAction = async () => {
  window.location.href = "../main.php";
};

const changePriority = async (value) => {
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
      document.getElementById("img_attach").style.filter = "";
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
          document.getElementById("img_attach").style.filter =
            "invert(48%) sepia(79%) saturate(2476%) brightness(86%) contrast(118%)";
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
  const deleteBtn = document.getElementById("img_delete");
  if (deleteBtn) {
    deleteBtn.addEventListener("click", deleteAttachFile);
  }

  const attachBtn = document.getElementById("img_attach");
  if (attachBtn) {
    attachBtn.addEventListener("click", attachFile);
  }

  const prioritySelect = document.getElementById("select_prioridad_accion");
  if (prioritySelect) {
    prioritySelect.addEventListener("change", (e) => changePriority(e.target.value));
  }

  const statusSelect = document.getElementById("select_status_accion");
  if (statusSelect) {
    statusSelect.addEventListener("change", (e) => changeState(e.target.value));
  }

  const cancelBtn = document.querySelector('img[onclick="cancelAction()"]');
  if (!cancelBtn) {
    const cancelButtons = document.querySelectorAll('.icon-table');
    cancelButtons.forEach(btn => {
      if (btn.src.includes('cancelar.png')) {
        btn.addEventListener("click", cancelAction);
      }
    });
  }

  const saveBtn = document.querySelector('img[onclick="saveAction()"]');
  if (!saveBtn) {
    const iconButtons = document.querySelectorAll('.icon-table');
    iconButtons.forEach(btn => {
      if (btn.src.includes('save.png')) {
        btn.addEventListener("click", saveAction);
      }
    });
  }
});

window.deleteAttachFile = deleteAttachFile;
window.changePriority = changePriority;
window.changeState = changeState;
window.attachFile = attachFile;
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
            position: "top-end", // Esquina superior derecha
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true, // Muestra la barrita de tiempo restante
            didOpen: (toast) => {
              // Pausa el timer si el usuario pone el ratón encima
              toast.onmouseenter = Swal.stopTimer;
              toast.onmouseleave = Swal.resumeTimer;
            },
          });
          sessionStorage.setItem("file_name", response.data.data.file_name);
          document.getElementById("img_attach").style.filter =
            "invert(48%) sepia(79%) saturate(2476%) brightness(86%) contrast(118%)";
        } else {
          Swal.fire("Error", response.data.message, "error");
        }
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo conectar con el servidor", "error");
      }
    };
  }
});
