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
  <title>Fotos - Tarea <?php echo htmlspecialchars($num_envio); ?></title>
  <style>
    .photo-card {
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      padding: 12px;
      margin-bottom: 10px;
    }
    .photo-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 0.85rem;
      color: #666;
    }
    .photo-img {
      width: 100%;
      border-radius: 4px;
      cursor: pointer;
    }
    .photo-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
    }
    .camera-container {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    #video {
      width: 100%;
      max-width: 400px;
      border-radius: 8px;
      background: #000;
    }
    #canvas {
      display: none;
    }
    .camera-buttons {
      display: flex;
      gap: 10px;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .photo-preview {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      display: none;
    }
    .no-photos {
      text-align: center;
      color: #999;
      padding: 20px;
      font-style: italic;
    }
    .photo-actions {
      display: flex;
      gap: 5px;
      margin-top: 8px;
    }
  </style>
</head>

<body class="main-body">

  <!-- Top bar -->
  <div class="main-topbar d-flex justify-content-between align-items-center px-3 py-2">
    <div class="d-flex align-items-center gap-2">
      <span class="main-topbar-title">Fotos - Tarea <?php echo htmlspecialchars($num_envio); ?></span>
    </div>
    <div class="d-flex align-items-center gap-3">
      <a href="main.php" class="btn btn-sm btn-primary">
        <i class="fas fa-arrow-left me-1"></i> Volver
      </a>
    </div>
  </div>

  <!-- Fotos container -->
  <div class="container-fluid py-3">
    
    <!-- Cámara -->
    <div class="camera-container">
      <h6 class="mb-3"><i class="fas fa-camera me-2"></i>Capturar Foto</h6>
      <video id="video" autoplay playsinline></video>
      <canvas id="canvas"></canvas>
      <img id="photo-preview" class="photo-preview" alt="Preview">
      <div class="camera-buttons">
        <button id="btn-start-camera" class="btn btn-success btn-sm">
          <i class="fas fa-play me-1"></i> Iniciar Cámara
        </button>
        <button id="btn-capture" class="btn btn-primary btn-sm hidden-element">
          <i class="fas fa-camera me-1"></i> Capturar
        </button>
        <button id="btn-retake" class="btn btn-warning btn-sm hidden-element">
          <i class="fas fa-redo me-1"></i> Repetir
        </button>
        <button id="btn-save" class="btn btn-success btn-sm hidden-element">
          <i class="fas fa-save me-1"></i> Guardar
        </button>
      </div>
    </div>

    <!-- Lista de fotos -->
    <h6 class="mb-3"><i class="fas fa-images me-2"></i>Fotos de la Tarea</h6>
    <div id="photos-list" class="photo-container">
      <div class="no-photos">Cargando fotos...</div>
    </div>
  </div>

  <!-- Modal para ver foto grande -->
  <div class="modal fade" id="photoModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
      <div class="modal-content">
        <div class="modal-body text-center">
          <img id="modal-photo" src="" class="img-fluid" alt="Foto">
        </div>
      </div>
    </div>
  </div>

  <script>
    const envioId = <?php echo $envio_id; ?>;
    const numEnvio = '<?php echo addslashes($num_envio); ?>';
    let stream = null;
    let capturedImage = null;

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

    document.addEventListener('DOMContentLoaded', function() {
      loadPhotos();
      setupCamera();
    });

    function setupCamera() {
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const preview = document.getElementById('photo-preview');
      const btnStart = document.getElementById('btn-start-camera');
      const btnCapture = document.getElementById('btn-capture');
      const btnRetake = document.getElementById('btn-retake');
      const btnSave = document.getElementById('btn-save');

      btnStart.addEventListener('click', async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
          });
          video.srcObject = stream;
          video.style.display = 'block';
          preview.style.display = 'none';
          btnStart.style.display = 'none';
          btnCapture.style.display = 'inline-block';
        } catch (err) {
          console.error('Error accessing camera:', err);
          Swal.fire('Error', 'No se pudo acceder a la cámara', 'error');
        }
      });

      btnCapture.addEventListener('click', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        preview.src = capturedImage;
        preview.style.display = 'block';
        video.style.display = 'none';
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        btnCapture.style.display = 'none';
        btnRetake.style.display = 'inline-block';
        btnSave.style.display = 'inline-block';
      });

      btnRetake.addEventListener('click', async () => {
        capturedImage = null;
        preview.style.display = 'none';
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
          });
          video.srcObject = stream;
          video.style.display = 'block';
          btnRetake.style.display = 'none';
          btnSave.style.display = 'none';
          btnCapture.style.display = 'inline-block';
        } catch (err) {
          console.error('Error accessing camera:', err);
          Swal.fire('Error', 'No se pudo acceder a la cámara', 'error');
        }
      });

      btnSave.addEventListener('click', () => {
        if (capturedImage) {
          savePhoto(capturedImage);
        }
      });
    }

    async function loadPhotos() {
      try {
        const response = await axios.post('../api/fotos/fotos.php?getFotos', {
          data: { envio_id: envioId }
        });

        if (response.data.success) {
          renderPhotos(response.data.fotos);
        } else {
          showError(response.data.message || 'Error al cargar fotos');
        }
      } catch (error) {
        console.error('Error loading photos:', error);
        showError('Error de conexión al cargar fotos');
      }
    }

    function renderPhotos(photos) {
      const container = document.getElementById('photos-list');

      if (!photos || photos.length === 0) {
        container.innerHTML = '<div class="no-photos">No hay fotos aún. Usa la cámara para añadir una.</div>';
        return;
      }

      let html = '';
      photos.forEach(photo => {
        const date = new Date(photo.registro);
        const dateStr = date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        html += `
          <div class="photo-card" data-photo-id="${photo.id}">
            <div class="photo-header">
              <span>${dateStr}</span>
            </div>
            <img src="../photos/${photo.uuid}" class="photo-img" onclick="showPhotoModal('../photos/${photo.uuid}')" alt="Foto">
            <div class="photo-actions">
              <button class="btn btn-sm btn-outline-danger" onclick="deletePhoto(${photo.id})">
                <i class="fas fa-trash"></i> Eliminar
              </button>
            </div>
          </div>
        `;
      });

      container.innerHTML = html;
    }

    async function savePhoto(imageData) {
      try {
        const response = await axios.post('../api/fotos/fotos.php?addFoto', {
          data: {
            envio_id: envioId,
            image: imageData
          }
        });

        if (response.data.success) {
          capturedImage = null;
          document.getElementById('photo-preview').style.display = 'none';
          document.getElementById('btn-retake').style.display = 'none';
          document.getElementById('btn-save').style.display = 'none';
          document.getElementById('btn-start-camera').style.display = 'inline-block';
          
          loadPhotos();
          Swal.fire({
            icon: 'success',
            title: 'Foto guardada',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          showError(response.data.message || 'Error al guardar foto');
        }
      } catch (error) {
        console.error('Error saving photo:', error);
        showError('Error de conexión al guardar foto');
      }
    }

    async function deletePhoto(photoId) {
      const result = await Swal.fire({
        title: '¿Eliminar foto?',
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
        const response = await axios.post('../api/fotos/fotos.php?deleteFoto', {
          data: { foto_id: photoId }
        });

        if (response.data.success) {
          loadPhotos();
          Swal.fire({
            icon: 'success',
            title: 'Foto eliminada',
            toast: true,
            position: 'top-end',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          showError(response.data.message || 'Error al eliminar foto');
        }
      } catch (error) {
        console.error('Error deleting photo:', error);
        showError('Error de conexión al eliminar foto');
      }
    }

    function showPhotoModal(src) {
      document.getElementById('modal-photo').src = src;
      const modal = new bootstrap.Modal(document.getElementById('photoModal'));
      modal.show();
    }

    function showError(message) {
      Swal.fire('Error', message, 'error');
    }
  </script>
</body>
</html>
