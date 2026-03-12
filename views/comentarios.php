<?php
require_once '../helpers/helper.php';
require_once '../helpers/config.php';
$GLOBALS['pathUrl'] = '../';
$GLOBALS['navigation_deep'] = 1;
$GLOBALS['hide_action_menu'] = 0;
get_session_status();
debug_mode();
$_SESSION['base_path'] = dirname(__FILE__);
$envio_id = isset($_GET['envio_id']) ? intval($_GET['envio_id']) : 0;
$num_envio = isset($_GET['num_envio']) ? $_GET['num_envio'] : '';
?>

<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href="../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
  <link href="../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
  <script src="../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <title>Comentarios - Tarea <?php echo htmlspecialchars($num_envio); ?></title>
  <style>
    .comment-card {
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 12px;
      margin-bottom: 10px;
      border-left: 3px solid #2e7d32;
    }
    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.85rem;
      color: #666;
    }
    .comment-text {
      font-size: 0.9rem;
      color: #333;
      line-height: 1.4;
      word-wrap: break-word;
    }
    .comment-author {
      font-weight: 600;
      color: #2e7d32;
    }
    .comment-time {
      color: #999;
      font-size: 0.8rem;
    }
    .comment-input-area {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .no-comments {
      text-align: center;
      color: #999;
      padding: 20px;
      font-style: italic;
    }
  </style>
</head>

<body class="main-body">

  <!-- Top bar -->
  <div class="main-topbar d-flex justify-content-between align-items-center px-3 py-2">
    <div class="d-flex align-items-center gap-2">
      <span class="main-topbar-title">Comentarios - Tarea <?php echo htmlspecialchars($num_envio); ?></span>
    </div>
    <div class="d-flex align-items-center gap-3">
      <a href="main.php" class="btn btn-sm btn-primary">
        <i class="fas fa-arrow-left me-1"></i> Volver
      </a>
    </div>
  </div>

  <!-- Comentarios container -->
  <div class="container-fluid py-3 comments-container">
    <!-- Input para nuevo comentario -->
    <div class="comment-input-area">
      <div class="mb-2">
        <textarea id="new-comment-text" class="form-control" rows="3" placeholder="Escribe tu comentario aquí..."></textarea>
      </div>
      <div class="d-flex justify-content-end">
        <button id="btn-send-comment" class="btn btn-primary btn-sm">
          <i class="fas fa-paper-plane me-1"></i> Enviar</button>
      </div>
    </div>

    <!-- Lista de comentarios -->
    <div id="comments-list">
      <div class="no-comments">Cargando comentarios...</div>
    </div>
  </div>

  <script>
    const envioId = <?php echo $envio_id; ?>;
    const numEnvio = '<?php echo addslashes($num_envio); ?>';

    // Verificar que tenemos un envio_id válido
    if (!envioId || isNaN(envioId) || envioId === 0) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se ha especificado una tarea válida',
        confirmButtonText: 'Volver'
      }).then(() => {
        window.location.href = 'main.php';
      });
    }

    // Cargar comentarios al iniciar
    document.addEventListener('DOMContentLoaded', function() {
      loadComments();

      // Evento para enviar comentario
      document.getElementById('btn-send-comment').addEventListener('click', sendComment);

      // Permitir enviar con Ctrl+Enter
      document.getElementById('new-comment-text').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
          sendComment();
        }
      });
    });

    async function loadComments() {
      try {
        const response = await axios.post('../api/comments/comments.php?getComments', {
          data: { envio_id: envioId }
        });

        console.log('Response:', response.data);

        if (response.data.success) {
          renderComments(response.data.comments);
        } else {
          showError(response.data.message || 'Error al cargar comentarios');
        }
      } catch (error) {
        console.error('Error loading comments:', error);
        showError('Error de conexión al cargar comentarios');
      }
    }

    function renderComments(comments) {
      const container = document.getElementById('comments-list');

      if (!comments || comments.length === 0) {
        container.innerHTML = '<div class="no-comments">No hay comentarios aún. Sé el primero en comentar.</div>';
        return;
      }

      let html = `
        <table class="table table-striped table-hover">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Comentario</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
      `;

      comments.forEach(comment => {
        const date = new Date(comment.registro);
        const dateStr = date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        html += `
          <tr data-comment-id="${comment.id}">
            <td class="align-middle table-comments">${escapeHtml(comment.nombre_usuario || 'Usuario')}</td>
            <td class="align-middle table-comments">${escapeHtml(comment.descripcion)}</td>
            <td class="align-middle table-comments">${dateStr}</td>
            <td class="align-middle table-comments">
              ${comment.usuario_id == <?php echo $_SESSION['user']['id']; ?> ? `
                <button class="btn btn-sm btn-outline-danger" onclick="deleteComment(${comment.id})">
                  <i class="fas fa-trash"></i>
                </button>
              ` : ''}
            </td>
          </tr>
        `;
      });

      html += `
          </tbody>
        </table>
      `;

      container.innerHTML = html;
    }

    async function sendComment() {
      const textArea = document.getElementById('new-comment-text');
      const commentText = textArea.value.trim();

      if (!commentText) {
        Swal.fire('Atención', 'Por favor escribe un comentario', 'warning');
        return;
      }

      try {
        const response = await axios.post('../api/comments/comments.php?addComment', {
          data: {
            envio_id: envioId,
            comentario: commentText
          }
        });

        console.log('Response:', response.data);

        if (response.data.success) {
          textArea.value = '';
          loadComments();
          Swal.fire({
            icon: 'success',
            title: 'Comentario añadido',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          showError(response.data.message || 'Error al guardar comentario');
        }
      } catch (error) {
        console.error('Error sending comment:', error);
        showError('Error de conexión al enviar comentario');
      }
    }

    async function deleteComment(commentId) {
      const result = await Swal.fire({
        title: '¿Eliminar comentario?',
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
        const response = await axios.post('../api/comments/comments.php?deleteComment', {
          data: { comment_id: commentId }
        });

        if (response.data.success) {
          loadComments();
          Swal.fire({
            icon: 'success',
            title: 'Comentario eliminado',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          showError(response.data.message || 'Error al eliminar comentario');
        }
      } catch (error) {
        console.error('Error deleting comment:', error);
        showError('Error de conexión al eliminar comentario');
      }
    }

    function showError(message) {
      Swal.fire('Error', message, 'error');
    }

    function escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  </script>
</body>
</html>
