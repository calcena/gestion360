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
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
  <link href="../assets/css/bootstrap/bootstrap.min.css" rel="stylesheet" type="text/css">
  <link href="../assets/css/style.css?<?php random_file_enumerator() ?>" rel="stylesheet" type="text/css">
  <script src="../assets/js/axios/axios.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="../assets/js/bootstrap/bootstrap.min.js?<?php random_file_enumerator() ?>"></script>
  <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
  <title>Fotos - Tarea <?php echo htmlspecialchars($num_envio); ?></title>
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
      <input type="file" id="file-input" accept="image/*" capture="environment" style="display:none;">
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

  <!-- Modal para ver foto grande con zoom -->
  <div class="modal fade" id="photoModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
        </div>
        <div class="modal-body text-center p-0">
          <div class="photo-zoom-container">
            <img id="modal-photo" src="" class="photo-zoom-img" alt="Foto">
          </div>
        </div>
        <div class="modal-footer">
          <small class="text-muted">Pinchada o desliza para hacer zoom</small>
        </div>
      </div>
    </div>
  </div>

  <script>
    const envioId = <?php echo $envio_id; ?>;
    const numEnvio = '<?php echo addslashes($num_envio); ?>';
    const REFRESH_INTERVAL = 15000; // 15 seconds
    let stream = null;
    let capturedImage = null;
    let isCameraActive = false;

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
      
      // Auto-refresh photos every 15 seconds (paused while using camera)
      setInterval(() => {
        if (!isCameraActive && !capturedImage) {
          loadPhotos();
        }
      }, REFRESH_INTERVAL);
    });

    function setupCamera() {
      const video = document.getElementById('video');
      const canvas = document.getElementById('canvas');
      const preview = document.getElementById('photo-preview');
      const btnStart = document.getElementById('btn-start-camera');
      const btnCapture = document.getElementById('btn-capture');
      const btnRetake = document.getElementById('btn-retake');
      const btnSave = document.getElementById('btn-save');
      const fileInput = document.getElementById('file-input');

      btnStart.addEventListener('click', async () => {
        isCameraActive = true;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false 
          });
          video.srcObject = stream;
          video.style.display = 'block';
          preview.style.display = 'none';
          btnStart.style.display = 'none';
          btnCapture.style.display = 'inline-block';
        } catch (err) {
          console.error('Error accessing camera:', err);
          isCameraActive = false;
          // Fallback: usar input file
          fileInput.click();
        }
      });

      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            capturedImage = event.target.result;
            preview.src = capturedImage;
            preview.style.display = 'block';
            video.style.display = 'none';
            btnStart.style.display = 'none';
            btnCapture.style.display = 'none';
            btnRetake.style.display = 'inline-block';
            btnSave.style.display = 'inline-block';
          };
          reader.readAsDataURL(file);
        }
      });

      btnCapture.addEventListener('click', () => {
        if (video.videoWidth === 0 || video.videoHeight === 0) {
          Swal.fire('Error', 'La cámara no está lista', 'error');
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        
        capturedImage = canvas.toDataURL('image/jpeg', 0.9);
        preview.src = capturedImage;
        preview.style.display = 'block';
        video.style.display = 'none';
        isCameraActive = false;
        
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
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        try {
          stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false 
          });
          video.srcObject = stream;
          video.style.display = 'block';
          btnRetake.style.display = 'none';
          btnSave.style.display = 'none';
          btnCapture.style.display = 'inline-block';
          isCameraActive = true;
        } catch (err) {
          console.error('Error accessing camera:', err);
          fileInput.click();
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

      let html = '<div class="photo-list">';
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
          <div class="photo-list-item" onclick="showPhotoModal('../photos/${photo.uuid}')">
            <img src="../photos/${photo.uuid}" class="photo-thumbnail" alt="Foto">
            <div class="photo-list-info">
              <span class="photo-list-date">${dateStr}</span>
            </div>
            <button class="btn btn-sm btn-outline-danger photo-list-delete" onclick="event.stopPropagation(); deletePhoto(${photo.id})">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        `;
      });

      html += '</div>';

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
      const modalImg = document.getElementById('modal-photo');
      modalImg.src = src;
      modalImg.style.transform = 'scale(1)';
      modalImg.style.transformOrigin = 'center center';
      
      const modal = new bootstrap.Modal(document.getElementById('photoModal'));
      modal.show();
      
      // Reset zoom when modal closes
      document.getElementById('photoModal').addEventListener('hidden.bs.modal', function() {
        modalImg.style.transform = 'scale(1)';
      }, { once: true });
    }

    // Zoom functionality
    document.addEventListener('DOMContentLoaded', function() {
      const modalImg = document.getElementById('modal-photo');
      let scale = 1;
      let startX = 0;
      let startY = 0;
      let isDragging = false;
      
      // Click to zoom
      modalImg.addEventListener('click', function() {
        if (scale === 1) {
          scale = 2;
          modalImg.style.transform = 'scale(2)';
          modalImg.style.transformOrigin = 'center center';
        } else {
          scale = 1;
          modalImg.style.transform = 'scale(1)';
        }
      });
      
      // Touch pinch to zoom
      let initialDistance = 0;
      modalImg.addEventListener('touchstart', function(e) {
        if (e.touches.length === 2) {
          initialDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
        }
      });
      
      modalImg.addEventListener('touchmove', function(e) {
        if (e.touches.length === 2) {
          e.preventDefault();
          const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          );
          
          if (initialDistance > 0) {
            const scaleDiff = currentDistance / initialDistance;
            scale = Math.min(Math.max(scale * scaleDiff, 1), 4);
            modalImg.style.transform = `scale(${scale})`;
          }
        }
      });
      
      modalImg.addEventListener('touchend', function() {
        initialDistance = 0;
        if (scale < 1.1) {
          scale = 1;
          modalImg.style.transform = 'scale(1)';
        }
      });
    });

    function showError(message) {
      Swal.fire('Error', message, 'error');
    }
  </script>
</body>
</html>
