// Comentarios functionality
// This file handles comment management for shipments/tasks

// Get data from HTML data attributes (set by PHP)
document.addEventListener('DOMContentLoaded', function() {
    const app = document.getElementById('comments-app');
    if (!app) return;

    const envioId = parseInt(app.dataset.envioId);
    const numEnvio = app.dataset.numEnvio;

    // Validation check for valid envio_id
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

    // Load comments on startup
    loadComments();

    // Event listener for send button
    document.getElementById('btn-send-comment').addEventListener('click', sendComment);

    // Allow sending with Ctrl+Enter
    document.getElementById('new-comment-text').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            sendComment();
        }
    });
});

async function loadComments() {
    const app = document.getElementById('comments-app');
    if (!app) return;

    const envioId = parseInt(app.dataset.envioId);

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
    const app = document.getElementById('comments-app');
    const userId = parseInt(app.dataset.userId);

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
                    ${comment.usuario_id == ${userId} ? `
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
    const app = document.getElementById('comments-app');
    if (!app) return;

    const envioId = parseInt(app.dataset.envioId);
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

// Make deleteComment available globally for onclick handlers
window.deleteComment = deleteComment;
