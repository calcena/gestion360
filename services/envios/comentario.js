// Cargar comentarios al iniciar
document.addEventListener("DOMContentLoaded", function () {
  // Validar que tenemos un envio_id válido
  if (!envioId || isNaN(envioId) || envioId === 0) {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: 'No se ha especificado una tarea válida',
      confirmButtonText: 'Volver'
    }).then(() => {
      window.location.href = 'main.php';
    });
    return;
  }

  loadComments();

  // Evento para enviar comentario
  document
    .getElementById("btn-send-comment")
    .addEventListener("click", sendComment);

  // Permitir enviar con Ctrl+Enter
  document
    .getElementById("new-comment-text")
    .addEventListener("keydown", function (e) {
      if (e.ctrlKey && e.key === "Enter") {
        sendComment();
      }
    });
});

async function loadComments() {
  try {
    const response = await axios.post(
      "../api/comments/comments.php?getComments",
      {
        data: { envio_id: envioId },
      },
    );

    console.log("Response:", response.data);

    if (response.data.success) {
      renderComments(response.data.comments);
    } else {
      showError(response.data.message || "Error al cargar comentarios");
    }
  } catch (error) {
    console.error("Error loading comments:", error);
    showError("Error de conexión al cargar comentarios");
  }
}

function renderComments(comments) {
  const container = document.getElementById("comments-list");

  if (!container) return;

  if (!comments || comments.length === 0) {
    container.innerHTML =
      '<div class="no-comments">No hay comentarios aún. Sé el primero en comentar.</div>';
    return;
  }

  let html = '<div class="comments-cards">';

  comments.forEach((comment) => {
    const date = new Date(comment.registro);
    const dateStr = date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const canDelete = comment.usuario_id == currentUserId;

    html += `
      <div class="comment-card-item" data-comment-id="${comment.id}">
        <div class="comment-card-header">
          <span class="comment-card-user">${escapeHtml(comment.nombre_usuario || "Usuario")}</span>
          <span class="comment-card-date">${dateStr}</span>
        </div>
        <div class="comment-card-body">
          ${escapeHtml(comment.descripcion)}
        </div>
        ${canDelete ? `
        <div class="comment-card-actions">
          <button class="btn btn-sm btn-outline-danger" onclick="deleteComment(${comment.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        ` : ''}
      </div>
    `;
  });

  html += '</div>';

  container.innerHTML = html;
}

async function sendComment() {
  const textArea = document.getElementById("new-comment-text");
  const commentText = textArea.value.trim();

  if (!commentText) {
    Swal.fire("Atención", "Por favor escribe un comentario", "warning");
    return;
  }

  try {
    const response = await axios.post(
      "../api/comments/comments.php?addComment",
      {
        data: {
          envio_id: envioId,
          comentario: commentText,
        },
      },
    );

    console.log("Response:", response.data);

    if (response.data.success) {
      textArea.value = "";
      loadComments();
      Swal.fire({
        icon: "success",
        title: "Comentario añadido",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      showError(response.data.message || "Error al guardar comentario");
    }
  } catch (error) {
    console.error("Error sending comment:", error);
    showError("Error de conexión al enviar comentario");
  }
}

async function deleteComment(commentId) {
  const result = await Swal.fire({
    title: "¿Eliminar comentario?",
    text: "Esta acción no se puede deshacer",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
  });

  if (!result.isConfirmed) return;

  try {
    const response = await axios.post(
      "../api/comments/comments.php?deleteComment",
      {
        data: { comment_id: commentId },
      },
    );

    if (response.data.success) {
      loadComments();
      Swal.fire({
        icon: "success",
        title: "Comentario eliminado",
        toast: true,
        position: "top-end",
        timer: 2000,
        showConfirmButton: false,
      });
    } else {
      showError(response.data.message || "Error al eliminar comentario");
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
    showError("Error de conexión al eliminar comentario");
  }
}

function showError(message) {
  Swal.fire("Error", message, "error");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const initComentarios = async () => {
  await getListAllComentarios();
};

const cancelComentarioAction = async () => {
  if (document.getElementById("comentario_descripcion").value.length > 0) {
    await clearDataView();
  } else {
    window.location.href = "../main.php";
  }
};

const saveComentarioAction = async () => {
  const data = {
    registro: obtenerFechaHoyConHora(),
    usuario_id: sessionStorage.getItem("usuario_id"),
    tarea_id: sessionStorage.getItem("tarea_id"),
    subtarea_id: sessionStorage.getItem("subtarea_id") ?? null,
    descripcion: document.getElementById("comentario_descripcion").value,
    es_nuevo: true,
  };
  if (sessionStorage.getItem("comentario_mode_edit")) {
    data.es_nuevo = false;
    data.id = sessionStorage.getItem("comentario_id");
  }
  try {
    const response = await axios.post(
      "../../api/tareas/tarea.php?saveComentario",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data.success) {
      await clearDataView();
      await getListAllComentarios();
    }
  } catch (error) {
    console.error("error");
  }
};

const getListAllComentarios = async () => {
  const data = {
    tarea_id: sessionStorage.getItem("tarea_id"),
  };
  try {
    const response = await axios.post(
      "../../api/tareas/tarea.php?getListAllComentarios",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data.success) {
      document.getElementById("tbody_comentarios").innerHTML =
        await parseHtmlTablaComentarios(response.data.content);
    }
  } catch (error) {
    console.error(error);
  }
};

const parseHtmlTablaComentarios = async (data) => {
  return data
    .map((item) => {
      console.log(item.descripcion);
      const subtarea = item.subtarea_id == null ? "" : item.num_subtarea;
      const parsedComment =
        item.descripcion.length >= 30
          ? item.descripcion.substring(0, 27) + "..."
          : item.descripcion;
      return `
                <tr class="td-text-table" id="${item.id}">
                    <td class="td-text-table text-primary">${subtarea}</td>
                    <td class="td-text-table">${formatFechaISO(
                      item.registro,
                    )}</td>
                    <td class="td-text-table" onclick="editComentario(${item.id})">${parsedComment}</td>
                    <td>
                        <input
                            class="icon-table-mini pointer delete-comentario-btn"
                            type="image"
                            src="../../assets/images/icons/papelera.png"
                            alt="Eliminar"
                            onclick="eliminarComentario(${item.id})"
                        >
                    </td>
                </tr>
            `;
    })
    .join("");
};

const editComentario = async (id) => {
  sessionStorage.setItem("comentario_id", id);
  const data = {
    comentario_id: id,
  };
  try {
    const response = await axios.post(
      "../../api/tareas/tarea.php?getComentarioById",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data.success) {
      document.getElementById("comentario_descripcion").value =
        response.data.content.descripcion;
      sessionStorage.setItem("comentario_mode_edit", true);
    }
  } catch (error) {
    console.error(error);
  }
};

const clearDataView = async () => {
  sessionStorage.removeItem("comentario_mode_edit");
  document.getElementById("comentario_descripcion").value = null;
};

const eliminarComentario = async (id) => {
  const data = {
    comentario_id: id,
  };
  try {
    const response = await axios.post(
      "../../api/tareas/tarea.php?deleteComentarioById",
      { data },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
    if (response.data.success) {
      await clearDataView();
      await getListAllComentarios();
    }
  } catch (error) {
    console.error(error);
  }
};
