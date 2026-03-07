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
      }
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
      }
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
                <tr class="td-text-table" id="${
                  item.id
                }">
                    <td class="td-text-table text-primary">${subtarea}</td>
                    <td class="td-text-table">${formatFechaISO(
                      item.registro
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
      }
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


const eliminarComentario = async(id)=>{
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
      }
    );
    if (response.data.success) {
     await clearDataView()
     await getListAllComentarios()
    }
  } catch (error) {
    console.error(error);
  }
}
